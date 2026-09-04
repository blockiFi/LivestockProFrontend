import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { DetailedFlockRecord, FlockAiInsights, FlockProfitLoss } from "@/lib/types"
import { buildFlockMetrics } from "@/lib/flockMetrics"
import { getFlockMetricsAiInsights } from "@/lib/request"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { cn, formatCurrency, Naira } from "@/lib/utils"
import { getCategoryLabel } from "@/lib/expenditureCategories"
import StatisticsCard from "@/components/general/StatisticsCard"
import { AiGate } from "@/components/general/AiGate"
import { useSubscription } from "@/hooks/useSubscription"
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Egg,
  Heart,
  Loader2,
  RefreshCw,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react"

interface FlockMetricsDashboardProps {
  flock: DetailedFlockRecord
  profitLoss?: FlockProfitLoss | null
  daysInFlock: number
  currentAge: number
  onRefresh?: () => Promise<unknown>
  onInsightsChange?: (payload: {
    insights: FlockAiInsights | null
    analysis: string | null
    generatedAt: Date | null
  }) => void
}

const CHART_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6"]

const scoreStyles: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-800 border-emerald-200",
  fair: "bg-amber-50 text-amber-800 border-amber-200",
  poor: "bg-rose-50 text-rose-800 border-rose-200",
}

const priorityStyles: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatKg(value: number) {
  return `${value.toFixed(1)} kg`
}

export default function FlockMetricsDashboard({
  flock,
  profitLoss,
  daysInFlock,
  currentAge,
  onInsightsChange,
}: FlockMetricsDashboardProps) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const { aiEnabled } = useSubscription()

  const [aiInsights, setAiInsights] = useState<FlockAiInsights | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [chartTab, setChartTab] = useState("mortality")

  const metrics = useMemo(
    () => buildFlockMetrics(flock, profitLoss, daysInFlock, currentAge),
    [flock, profitLoss, daysInFlock, currentAge]
  )

  const loadAiInsights = useCallback(async () => {
    if (!token || !farmId || !flock.id || !aiEnabled) return
    setLoadingAi(true)
    try {
      const res = await getFlockMetricsAiInsights(token, farmId, flock.id)
      if (res.success && res.data) {
        setAiInsights(res.data.ai_insights)
        setAiAnalysis(res.data.ai_analysis)
        setAiAvailable(res.data.ai_available)
        const generated = res.data.ai_available ? new Date() : null
        if (generated) setLastGenerated(generated)
        onInsightsChange?.({
          insights: res.data.ai_insights,
          analysis: res.data.ai_analysis,
          generatedAt: generated,
        })
      } else {
        setAiAvailable(false)
        onInsightsChange?.({ insights: null, analysis: null, generatedAt: null })
      }
    } catch {
      setAiAvailable(false)
      onInsightsChange?.({ insights: null, analysis: null, generatedAt: null })
    } finally {
      setLoadingAi(false)
    }
  }, [token, farmId, flock.id, aiEnabled, onInsightsChange])

  useEffect(() => {
    void loadAiInsights()
  }, [loadAiInsights])

  const { kpis, trends, poultryKind, ruleInsights } = metrics

  const kpiCards = useMemo(() => {
    const cards = [
      {
        key: "survival",
        title: "Survival Rate",
        value: formatPercent(kpis.survivalRate),
        footer: `${kpis.birdsRemaining.toLocaleString()} of ${kpis.initialBirds.toLocaleString()} birds`,
        icon: <Heart className="h-4 w-4" />,
        cardStyles: "border-emerald-200/80 bg-emerald-50/50",
        iconStyles: "bg-emerald-100 text-emerald-700",
      },
      {
        key: "mortality",
        title: "Mortality Rate",
        value: formatPercent(kpis.mortalityRate),
        footer: `${kpis.totalMortality.toLocaleString()} total losses`,
        icon: <AlertTriangle className="h-4 w-4" />,
        cardStyles: "border-rose-200/80 bg-rose-50/50",
        iconStyles: "bg-rose-100 text-rose-700",
      },
      {
        key: "feed",
        title: "Total Feed",
        value: formatKg(kpis.totalFeedKg),
        footer: `${kpis.feedPerBird.toFixed(2)} kg / bird`,
        icon: <Wheat className="h-4 w-4" />,
        cardStyles: "border-amber-200/80 bg-amber-50/50",
        iconStyles: "bg-amber-100 text-amber-700",
      },
      {
        key: "profit",
        title: "Net Profit",
        value: `${Naira}${formatCurrency(kpis.netProfit)}`,
        footer: `${formatPercent(kpis.marginPercent)} margin`,
        icon: kpis.netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
        cardStyles: kpis.netProfit >= 0 ? "border-emerald-200/80 bg-emerald-50/50" : "border-rose-200/80 bg-rose-50/50",
        iconStyles: kpis.netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
      },
    ]

    if (poultryKind === "broiler" || poultryKind === "dual" || kpis.fcr != null) {
      cards.splice(3, 0, {
        key: "fcr",
        title: "FCR",
        value: kpis.fcr != null ? kpis.fcr.toFixed(2) : "—",
        footer:
          kpis.averageDailyGain != null
            ? `${kpis.averageDailyGain.toFixed(0)} g/day ADG`
            : "Feed conversion ratio",
        icon: <Scale className="h-4 w-4" />,
        cardStyles: "border-sky-200/80 bg-sky-50/50",
        iconStyles: "bg-sky-100 text-sky-700",
      })
    }

    if (poultryKind === "layer" || poultryKind === "dual" || kpis.totalEggs > 0) {
      cards.push({
        key: "eggs",
        title: "Total Eggs",
        value: kpis.totalEggs.toLocaleString(),
        footer:
          kpis.henDayProduction != null
            ? `${kpis.henDayProduction.toFixed(1)}% hen-day`
            : `${kpis.avgDailyEggs.toFixed(0)} avg / day`,
        icon: <Egg className="h-4 w-4" />,
        cardStyles: "border-violet-200/80 bg-violet-50/50",
        iconStyles: "bg-violet-100 text-violet-700",
      })
    }

    return cards.slice(0, 6)
  }, [kpis, poultryKind])

  const financialChartData = trends.financial.map((row) => ({
    name: getCategoryLabel(row.category),
    value: row.total_cost,
  }))

  const visibleChartTabs = useMemo(() => {
    const tabs: { id: string; label: string }[] = []
    if (trends.mortality.length > 0) tabs.push({ id: "mortality", label: "Mortality" })
    if (trends.weight.length > 0 && (poultryKind === "broiler" || poultryKind === "dual" || poultryKind === "other")) {
      tabs.push({ id: "weight", label: "Weight" })
    }
    if (trends.eggs.length > 0 && (poultryKind === "layer" || poultryKind === "dual")) {
      tabs.push({ id: "eggs", label: "Eggs" })
    }
    if (trends.feed.length > 0) tabs.push({ id: "feed", label: "Feed" })
    if (financialChartData.length > 0) tabs.push({ id: "financial", label: "Financial" })
    return tabs
  }, [trends, poultryKind, financialChartData.length])

  useEffect(() => {
    if (visibleChartTabs.length > 0 && !visibleChartTabs.some((tab) => tab.id === chartTab)) {
      setChartTab(visibleChartTabs[0].id)
    }
  }, [visibleChartTabs, chartTab])

  const renderLineChart = (data: { label: string; value: number }[], color: string, unit: string) => (
    <ChartContainer
      config={{ value: { label: unit, color } }}
      className="aspect-[16/7] w-full min-h-[220px]"
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <AiGate>
        <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    AI Performance Analysis
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Expert interpretation of flock health, growth, production, and profitability.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadAiInsights()}
                disabled={loadingAi}
                className="shrink-0 border-emerald-200 bg-white/80"
              >
                {loadingAi ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {aiInsights ? "Refresh analysis" : "Generate analysis"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAi && !aiInsights && !aiAnalysis ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/70 px-4 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                <p className="text-sm text-slate-600">Analysing flock performance with AI…</p>
              </div>
            ) : aiAvailable && aiInsights ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("capitalize font-semibold", scoreStyles[aiInsights.performance_score])}
                  >
                    {aiInsights.performance_score} performance
                  </Badge>
                  {lastGenerated && (
                    <span className="text-xs text-slate-500">
                      Generated {lastGenerated.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{aiInsights.executive_summary}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-emerald-100 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {aiInsights.strengths.length > 0 ? (
                        aiInsights.strengths.map((item) => (
                          <li key={item} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-emerald-600">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500">No strengths highlighted yet.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-rose-100 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">Risks</p>
                    <ul className="space-y-1.5">
                      {aiInsights.risks.length > 0 ? (
                        aiInsights.risks.map((item) => (
                          <li key={item} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-rose-600">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500">No major risks flagged.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {aiInsights.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
                    <div className="grid gap-2">
                      {[...aiInsights.recommendations]
                        .sort((a, b) => {
                          const rank = { high: 0, medium: 1, low: 2 }
                          return rank[a.priority] - rank[b.priority]
                        })
                        .map((rec, index) => (
                          <div
                            key={`${rec.action}-${index}`}
                            className="rounded-lg border border-slate-200 bg-white/90 p-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">{rec.action}</p>
                              <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                            </div>
                            <Badge variant="outline" className={cn("capitalize shrink-0", priorityStyles[rec.priority])}>
                              {rec.priority}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {aiInsights.benchmark_comparison && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Benchmark: </span>
                    {aiInsights.benchmark_comparison}
                  </div>
                )}
              </div>
            ) : aiAvailable && aiAnalysis ? (
              <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">AI insights unavailable</p>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your LLM API key on the server to enable AI-powered flock analysis. Deterministic metrics below remain available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </AiGate>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <StatisticsCard
            key={card.key}
            cardStyles={card.cardStyles}
            title={card.title}
            value={card.value}
            footer={card.footer}
            footerIcon={null}
            icon={card.icon}
            iconStyles={card.iconStyles}
          />
        ))}
      </div>

      {/* Rule-based insights */}
      {ruleInsights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ruleInsights.map((insight) => (
            <Badge key={insight} variant="outline" className="bg-white text-slate-700 border-slate-200 py-1.5 px-3">
              <BarChart3 className="h-3 w-3 mr-1.5 text-amber-600" />
              {insight}
            </Badge>
          ))}
        </div>
      )}

      {/* Charts */}
      {visibleChartTabs.length > 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={chartTab} onValueChange={setChartTab}>
              <TabsList className="mb-4 flex w-full flex-wrap h-auto gap-1 bg-slate-100 p-1">
                {visibleChartTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="mortality">
                {renderLineChart(trends.mortality, "#ef4444", "Birds")}
              </TabsContent>
              <TabsContent value="weight">
                {renderLineChart(trends.weight, "#0ea5e9", "Grams")}
              </TabsContent>
              <TabsContent value="eggs">
                {renderLineChart(trends.eggs, "#8b5cf6", "Eggs")}
              </TabsContent>
              <TabsContent value="feed">
                {renderLineChart(trends.feed, "#f59e0b", "Kg")}
              </TabsContent>
              <TabsContent value="financial">
                {financialChartData.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartContainer config={{ value: { label: "Cost", color: "#10b981" } }} className="aspect-square max-h-[280px]">
                      <PieChart>
                        <Pie
                          data={financialChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {financialChartData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <ChartContainer config={{ value: { label: "Cost", color: "#10b981" } }} className="aspect-[4/3] min-h-[220px]">
                      <BarChart data={financialChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">No financial breakdown available.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-10 text-center">
            <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No trend data yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add daily records, mortality, weight, or feed usage to unlock performance charts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
