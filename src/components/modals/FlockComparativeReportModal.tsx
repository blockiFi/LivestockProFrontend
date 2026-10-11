import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { DetailedFlockRecord, FlockComparativeReport } from "@/lib/types"
import { getFlockComparativeMetrics, refreshFlockComparativeMetrics } from "@/lib/request"
import { useSubscription } from "@/hooks/useSubscription"
import { FormModal } from "@/components/ui/form-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import StatisticsCard from "@/components/general/StatisticsCard"
import { exportFlockComparativePdf, printFlockComparativeReport } from "@/lib/print-flock-comparative"
import { formatEggsWithCrates } from "@/lib/eggMetrics"
import { cn, formatCurrency, Naira } from "@/lib/utils"
import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileDown,
  Loader2,
  Printer,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react"
import { toast } from "react-toastify"

interface FlockComparativeReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flock: DetailedFlockRecord
}

const METRIC_LABELS: Record<string, string> = {
  mortality_rate_percent: "Mortality Rate",
  survival_rate_percent: "Survival Rate",
  feed_conversion_ratio: "FCR",
  net_profit: "Net Profit",
  margin_percent: "Margin",
  cost_per_bird: "Cost per Bird",
  latest_weight_g: "Latest Weight",
  egg_production_rate_percent: "Hen-day Production",
}

function formatMetricValue(key: string, value: number | null): string {
  if (value === null) return "—"
  if (key.includes("percent")) return `${value.toFixed(1)}%`
  if (key === "feed_conversion_ratio") return value.toFixed(2)
  if (key === "net_profit" || key === "cost_per_bird") return `${Naira}${formatCurrency(value)}`
  if (key === "latest_weight_g") return `${value.toFixed(0)} g`
  if (key === "total_eggs") return formatEggsWithCrates(value)
  return value.toFixed(2)
}

export default function FlockComparativeReportModal({
  open,
  onOpenChange,
  flock,
}: FlockComparativeReportModalProps) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const farmName = useSelector((state: RootState) => state.authentication.activeFarm?.name)
  const { aiEnabled } = useSubscription()

  const [report, setReport] = useState<FlockComparativeReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(
    async (force = false) => {
      if (!token || !farmId) return
      if (force) setRefreshing(true)
      else setLoading(true)
      setError(null)

      // Forcing a rebuild regenerates the AI narrative, which is Premium-only.
      // Other plans still refresh the deterministic peer comparison.
      const response = force && aiEnabled
        ? await refreshFlockComparativeMetrics(token, farmId, flock.id)
        : await getFlockComparativeMetrics(token, farmId, flock.id)

      if (force) setRefreshing(false)
      else setLoading(false)

      if (!response.success || !response.data) {
        setError(response.error?.[0] ?? "Failed to load comparative report")
        return
      }

      setReport(response.data)
    },
    [token, farmId, flock.id, aiEnabled]
  )

  useEffect(() => {
    if (open) {
      void loadReport(false)
    }
  }, [open, loadReport])

  const summaryCards = useMemo(() => {
    if (!report) return []

    const keys = ["mortality_rate_percent", "feed_conversion_ratio", "net_profit", "survival_rate_percent"]
      .filter((key) => report.aggregates[key]?.avg != null)

    return keys.slice(0, 4).map((key) => {
      const agg = report.aggregates[key]
      const label = METRIC_LABELS[key] ?? key
      const delta = agg.delta_vs_avg
      const positiveDelta = delta != null && delta > 0
      const negativeDelta = delta != null && delta < 0
      const lowerIsBetter = key === "mortality_rate_percent" || key === "feed_conversion_ratio" || key === "cost_per_bird"
      const isGood = delta != null && (lowerIsBetter ? delta < 0 : delta > 0)

      return {
        key,
        title: label,
        value: formatMetricValue(key, agg.target),
        footer: [
          agg.rank != null ? `Rank ${agg.rank} of ${(agg.peer_count ?? 0) + 1}` : null,
          agg.avg != null ? `Avg ${formatMetricValue(key, agg.avg)}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        icon:
          key === "net_profit" ? (
            isGood ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
          ) : key === "feed_conversion_ratio" ? (
            <Scale className="h-4 w-4" />
          ) : key === "mortality_rate_percent" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Wheat className="h-4 w-4" />
          ),
        cardStyles: isGood
          ? "border-emerald-200/80 bg-emerald-50/50"
          : negativeDelta || positiveDelta
            ? "border-amber-200/80 bg-amber-50/50"
            : "border-slate-200/80 bg-slate-50/50",
        iconStyles: isGood ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700",
      }
    })
  }, [report])

  const chartData = useMemo(() => {
    if (!report) return []
    const keys = ["mortality_rate_percent", "feed_conversion_ratio", "net_profit"].filter(
      (key) => report.aggregates[key]?.avg != null && report.aggregates[key]?.target != null
    )

    return keys.map((key) => ({
      metric: METRIC_LABELS[key] ?? key,
      target: report.aggregates[key].target ?? 0,
      average: report.aggregates[key].avg ?? 0,
    }))
  }, [report])

  const handlePrint = () => {
    if (!report) return
    printFlockComparativeReport({
      report,
      flockName: flock.name,
      batchNumber: flock.batch_number,
      farmName,
      generatedAt: report.generated_at ? new Date(report.generated_at) : new Date(),
    })
  }

  const handleExportPdf = () => {
    if (!report) return
    exportFlockComparativePdf({
      report,
      flockName: flock.name,
      batchNumber: flock.batch_number,
      farmName,
      generatedAt: report.generated_at ? new Date(report.generated_at) : new Date(),
    })
    toast.info("Choose 'Save as PDF' in the print dialog to download the report.")
  }

  const allRows = report ? [report.target_flock, ...report.peers] : []

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Detailed Batch Comparison"
      description={
        <>
          {flock.name} (Batch {flock.batch_number}) compared to completed {report?.poultry_type ?? "same-type"} batches
        </>
      }
      icon={BarChart3}
      tone="report"
      size="full"
      bodyClassName="space-y-6"
      footer={
        <>
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadReport(true)}
              disabled={loading || refreshing}
              className="rounded-xl"
            >
              {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!report} className="rounded-xl">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!report} className="rounded-xl">
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
        </>
      }
    >
          {report && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-white">{report.peer_count} peer batches</Badge>
              {report.cached && <Badge variant="secondary">Cached</Badge>}
              {report.generated_at && (
                <span className="text-xs text-slate-500">
                  Generated {new Date(report.generated_at).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Building comparative report...
            </div>
          )}

          {error && !loading && (
            <Card className="border-rose-200 bg-rose-50/50">
              <CardContent className="py-8 text-center text-rose-700">{error}</CardContent>
            </Card>
          )}

          {report && !loading && (
            <>
              {report.peer_count === 0 ? (
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardContent className="py-8 text-center text-amber-900">
                    No completed batches of this type yet. Finish at least one batch to enable peer comparison.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {summaryCards.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {summaryCards.map((card) => (
                        <StatisticsCard
                          key={card.key}
                          title={card.title}
                          value={card.value}
                          footer={card.footer}
                          footerIcon={null}
                          icon={card.icon}
                          cardStyles={card.cardStyles}
                          iconStyles={card.iconStyles}
                        />
                      ))}
                    </div>
                  )}

                  {chartData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="h-4 w-4 text-sky-600" />
                          This Batch vs Peer Average
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            target: { label: "This batch", color: "#0284c7" },
                            average: { label: "Peer average", color: "#94a3b8" },
                          }}
                          className="aspect-[16/7] w-full min-h-[240px]"
                        >
                          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                            <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} width={48} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="target" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="average" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )}

                  {(report.highlights.strengths.length > 0 || report.highlights.gaps.length > 0) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-emerald-200/80">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-emerald-800">Strengths vs Peers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {report.highlights.strengths.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-amber-200/80">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-amber-800">Gaps vs Peers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {report.highlights.gaps.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Peer Batch Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Batch</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Mortality</TableHead>
                            <TableHead className="text-right">FCR</TableHead>
                            <TableHead className="text-right">Net Profit</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                            <TableHead className="text-right">Days</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allRows.map((row) => {
                            const isTarget = row.id === report.target_flock.id
                            return (
                              <TableRow
                                key={row.id}
                                className={cn(isTarget && "bg-sky-50/80 font-medium")}
                              >
                                <TableCell>
                                  {row.name}
                                  <div className="text-xs text-slate-500">{row.batch_number}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={isTarget ? "default" : "outline"} className="capitalize">
                                    {row.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.metrics.mortality_rate_percent.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.metrics.feed_conversion_ratio != null
                                    ? row.metrics.feed_conversion_ratio.toFixed(2)
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Naira}
                                  {formatCurrency(row.metrics.net_profit)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.metrics.margin_percent.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">{row.metrics.days_in_flock}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {report.ai_insights && (
                    <Card className="border-violet-200/80 bg-violet-50/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Brain className="h-4 w-4 text-violet-700" />
                          AI Comparative Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-slate-700">
                        <p>{report.ai_insights.executive_summary}</p>
                        {report.ai_insights.peer_ranking_summary && (
                          <p className="text-slate-600">{report.ai_insights.peer_ranking_summary}</p>
                        )}
                        {report.ai_insights.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-slate-900">Recommendations</h4>
                            <ul className="space-y-2">
                              {report.ai_insights.recommendations.map((rec, index) => (
                                <li key={`${rec.action}-${index}`} className="rounded-md border border-violet-100 bg-white p-3">
                                  <Badge variant="outline" className="mb-1 capitalize">
                                    {rec.priority}
                                  </Badge>
                                  <p className="font-medium">{rec.action}</p>
                                  <p className="text-slate-600">{rec.reason}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
    </FormModal>
  )
}
