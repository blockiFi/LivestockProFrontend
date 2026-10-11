import { useMemo, useState } from "react"
import { useSelector } from "react-redux"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, Eye, Gauge, Loader2, Plus, Scale, Sparkles, Target, Trash2, TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "react-toastify"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmModal } from "@/components/ui/form-modal"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import AddWeightReportModal, { type WeightHouseOption } from "@/components/modals/AddWeightReportModal"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import { getWeightReport } from "@/lib/request"
import type { FlockRecord, WeightReport, WeightReportPayload } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"
import {
  DATA_SOURCE_LABELS,
  SEX_LABELS,
  UNIFORMITY_GRADE_STYLES,
  UNIFORMITY_METHOD_LABELS,
  WEIGHING_METHOD_LABELS,
  computeWeightStats,
  cvGrade,
  formatGrams,
  uniformityGrade,
  weightHistogram,
} from "@/lib/weightStats"
import type { RootState } from "@/store"

const avgGrams = (r: WeightReport): number | null => {
  if (r.average_weight_g != null) return r.average_weight_g
  return r.average_weight ? Math.round(r.average_weight * 1000) : null
}

const signed = (n: number | null | undefined, dp = 0, suffix = "") =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(dp)}${suffix}`

const WEIGHT_EXPORT_COLUMNS: ExportColumn<WeightReport>[] = [
  { header: "Date", value: (row) => formatExportDate(row.report_date) },
  { header: "Time", value: (row) => row.weighed_at_time?.slice(0, 5) ?? "" },
  { header: "Age (days)", value: (row) => row.age_days ?? "" },
  { header: "House", value: (row) => row.house?.name ?? "" },
  { header: "Pen", value: (row) => row.pen_label ?? "" },
  { header: "Sex", value: (row) => (row.sex ? SEX_LABELS[row.sex] : "") },
  { header: "Method", value: (row) => (row.weighing_method ? WEIGHING_METHOD_LABELS[row.weighing_method] : "") },
  { header: "Birds Weighed", value: (row) => row.sample_size },
  { header: "Birds in Flock", value: (row) => row.number_of_birds },
  { header: "Average (g)", value: (row) => avgGrams(row) ?? "" },
  { header: "Median (g)", value: (row) => row.median_weight_g ?? "" },
  { header: "Min (kg)", value: (row) => row.min_weight ?? "" },
  { header: "Max (kg)", value: (row) => row.max_weight ?? "" },
  { header: "Std Dev (g)", value: (row) => row.std_dev_g ?? "" },
  { header: "CV (%)", value: (row) => row.cv_percent ?? "" },
  { header: "Uniformity (%)", value: (row) => row.uniformity_percent ?? "" },
  { header: "Uniformity Method", value: (row) => (row.uniformity_method ? UNIFORMITY_METHOD_LABELS[row.uniformity_method] : "") },
  { header: "Uniformity Band (±%)", value: (row) => row.uniformity_band_percent ?? "" },
  { header: "Target (g)", value: (row) => row.target_weight_g ?? "" },
  { header: "Deviation (g)", value: (row) => row.deviation_from_target_g ?? "" },
  { header: "Deviation (%)", value: (row) => row.deviation_from_target_percent ?? "" },
  { header: "Daily Gain (g/day)", value: (row) => row.daily_gain_g ?? "" },
  { header: "Source", value: (row) => (row.data_source ? DATA_SOURCE_LABELS[row.data_source] : "") },
  { header: "Recorded By", value: (row) => row.recorded_by_name ?? "" },
  { header: "Notes", value: (row) => row.notes ?? "" },
]

interface WeightReportPageProps {
  reports: WeightReport[]
  flock?: FlockRecord
  houses?: WeightHouseOption[]
  onAddRecord?: (payload: WeightReportPayload) => Promise<void>
  onDeleteRecord?: (recordId: number) => Promise<void>
}

const UniformityBadge = ({ value, method }: { value: number | null | undefined; method?: WeightReport["uniformity_method"] }) => {
  const grade = uniformityGrade(value)
  if (!grade || value == null) return <span className="text-slate-400">—</span>
  return (
    <span
      title={method ? UNIFORMITY_METHOD_LABELS[method] : undefined}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums", UNIFORMITY_GRADE_STYLES[grade].badge)}
    >
      {value.toFixed(1)}%
      {method === "estimated" && <span className="text-[10px] font-normal opacity-70">est.</span>}
      {method === "counted" && <span className="text-[10px] font-normal opacity-70">counted</span>}
    </span>
  )
}

const SourceBadge = ({ source }: { source: WeightReport["data_source"] }) => {
  if (!source) return null
  const ai = source === "ai_image" || source === "ai_file"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        ai && "bg-violet-100 text-violet-700",
        source === "manual" && "bg-sky-100 text-sky-700",
        source === "summary_only" && "bg-slate-100 text-slate-600"
      )}
    >
      {ai && <Sparkles className="h-3 w-3" />}
      {DATA_SOURCE_LABELS[source]}
    </span>
  )
}

const WeightReportPage = ({ reports, flock, houses = [], onAddRecord, onDeleteRecord }: WeightReportPageProps) => {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)
  const [detail, setDetail] = useState<WeightReport | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const sorted = useMemo(
    () =>
      [...reports].sort((a, b) =>
        a.report_date === b.report_date ? a.id - b.id : a.report_date < b.report_date ? -1 : 1
      ),
    [reports]
  )
  const newestFirst = useMemo(() => [...sorted].reverse(), [sorted])

  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]
  const latestAvg = latest ? avgGrams(latest) : null
  const gain = latest?.daily_gain_g ?? null
  const fallbackGain = latestAvg !== null && previous && avgGrams(previous) !== null ? latestAvg - (avgGrams(previous) as number) : null

  const chartData = useMemo(
    () =>
      sorted.map((r) => ({
        label: r.age_days != null ? `D${r.age_days}` : formatDate(r.report_date),
        date: formatDate(r.report_date),
        actual: avgGrams(r),
        target: r.target_weight_g ?? null,
        uniformity: r.uniformity_percent ?? null,
        cv: r.cv_percent ?? null,
      })),
    [sorted]
  )
  const hasTargets = chartData.some((d) => d.target !== null)
  const uniformityData = chartData.filter((d) => d.uniformity !== null)

  const openDetail = async (report: WeightReport) => {
    setDetail(report)
    if (!token || !farmId || report.data_source === "summary_only") return
    setDetailLoading(true)
    try {
      const res = await getWeightReport(token, farmId, report.id)
      if (res.success && res.data) {
        setDetail((cur) => (cur && cur.id === report.id ? { ...report, ...res.data } : cur))
      }
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAddRecord = async (payload: WeightReportPayload) => {
    if (!onAddRecord) return
    await onAddRecord(payload)
  }

  const confirmDelete = async () => {
    if (!onDeleteRecord || !recordToDelete) return
    try {
      await onDeleteRecord(recordToDelete)
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error("Error deleting weight report:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while deleting the weight report. Please try again.")
    }
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  const latestUGrade = uniformityGrade(latest?.uniformity_percent)
  const latestCvGrade = cvGrade(latest?.cv_percent)

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <ExportDataButton
          rows={newestFirst}
          columns={WEIGHT_EXPORT_COLUMNS}
          filename={buildExportFilename(flock?.name || "flock", "weight")}
        />
        {onAddRecord && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="transform bg-gradient-to-r from-green-500 to-blue-600 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-blue-700 hover:shadow-xl"
          >
            <Plus className="h-4 w-4" /> Record Weighing
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2"><Scale className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Latest Avg Weight</p>
              <p className="text-2xl font-bold text-green-600">{formatGrams(latestAvg)}</p>
              {latest?.age_days != null && <p className="text-xs text-gray-500">Day {latest.age_days}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2"><Target className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <p className="text-sm text-gray-500">vs Target</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  latest?.deviation_from_target_percent == null
                    ? "text-slate-400"
                    : Math.abs(latest.deviation_from_target_percent) <= 3
                      ? "text-emerald-600"
                      : Math.abs(latest.deviation_from_target_percent) <= 7
                        ? "text-amber-600"
                        : "text-red-600"
                )}
              >
                {signed(latest?.deviation_from_target_percent, 1, "%")}
              </p>
              {latest?.target_weight_g != null && <p className="text-xs text-gray-500">Target {formatGrams(latest.target_weight_g)}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2"><Gauge className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Uniformity</p>
              <p className={cn("text-2xl font-bold", latestUGrade ? UNIFORMITY_GRADE_STYLES[latestUGrade].text : "text-slate-400")}>
                {latest?.uniformity_percent != null ? `${latest.uniformity_percent.toFixed(1)}%` : "—"}
              </p>
              {latestUGrade && <p className="text-xs text-gray-500">{UNIFORMITY_GRADE_STYLES[latestUGrade].label} · ±{latest?.uniformity_band_percent ?? 10}%</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2"><Activity className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">CV</p>
              <p className={cn("text-2xl font-bold", latestCvGrade ? UNIFORMITY_GRADE_STYLES[latestCvGrade].text : "text-slate-400")}>
                {latest?.cv_percent != null ? `${latest.cv_percent.toFixed(1)}%` : "—"}
              </p>
              {latest?.std_dev_g != null && <p className="text-xs text-gray-500">SD {latest.std_dev_g.toFixed(0)} g</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              {(gain ?? fallbackGain ?? 0) >= 0 ? <TrendingUp className="h-5 w-5 text-blue-600" /> : <TrendingDown className="h-5 w-5 text-blue-600" />}
            </div>
            <div>
              <p className="text-sm text-gray-500">{gain !== null ? "Daily Gain" : "Gain vs Previous"}</p>
              <p className={cn("text-2xl font-bold", (gain ?? fallbackGain ?? 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {gain !== null ? `${signed(gain, 1)} g/d` : fallbackGain !== null ? `${signed(fallbackGain)} g` : "—"}
              </p>
              <p className="text-xs text-gray-500">{latest?.sample_size ?? 0} birds weighed</p>
            </div>
          </div>
        </Card>
      </div>

      {chartData.length > 1 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">Average weight {hasTargets ? "vs target" : ""} (g)</p>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""} formatter={(v, n) => [`${Math.round(Number(v)).toLocaleString()} g`, n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                {hasTargets && <Line type="monotone" dataKey="target" name="Target" stroke="#6366f1" strokeDasharray="6 4" strokeWidth={2} dot={false} connectNulls />}
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">Uniformity trend (%)</p>
            {uniformityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={uniformityData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""} formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
                  <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" />
                  <Bar dataKey="uniformity" name="Uniformity" radius={[4, 4, 0, 0]}>
                    {uniformityData.map((d, i) => {
                      const g = uniformityGrade(d.uniformity)
                      return <Cell key={i} fill={g === "good" ? "#10b981" : g === "fair" ? "#f59e0b" : "#ef4444"} />
                    })}
                  </Bar>
                  <Line type="monotone" dataKey="cv" name="CV" stroke="#64748b" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-center text-sm text-slate-500">
                Record individual bird weights to track uniformity over time.
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / Age</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead className="text-right">Weighed</TableHead>
              <TableHead className="text-right">Avg (g)</TableHead>
              <TableHead className="text-right">Target (g)</TableHead>
              <TableHead className="text-right">vs Target</TableHead>
              <TableHead>Uniformity</TableHead>
              <TableHead className="text-right">CV</TableHead>
              <TableHead className="text-right">Gain (g/d)</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newestFirst.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-sm text-slate-500">
                  No weighing sessions recorded yet.
                </TableCell>
              </TableRow>
            )}
            {newestFirst.map((report) => {
              const avg = avgGrams(report)
              const dev = report.deviation_from_target_percent
              return (
                <TableRow key={report.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail(report)}>
                  <TableCell className="font-medium">
                    <div>{formatDate(report.report_date)}</div>
                    <div className="text-xs text-slate-500">
                      {report.age_days != null ? `Day ${report.age_days}` : ""}
                      {report.weighed_at_time ? ` · ${report.weighed_at_time.slice(0, 5)}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{[report.house?.name, report.pen_label].filter(Boolean).join(" · ") || "—"}</TableCell>
                  <TableCell className="text-sm">{report.sex ? SEX_LABELS[report.sex] : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{report.sample_size}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{avg !== null ? Math.round(avg).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{report.target_weight_g != null ? Math.round(report.target_weight_g).toLocaleString() : "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      dev == null ? "text-slate-400" : Math.abs(dev) <= 3 ? "text-emerald-600" : Math.abs(dev) <= 7 ? "text-amber-600" : "text-red-600"
                    )}
                  >
                    {signed(dev, 1, "%")}
                  </TableCell>
                  <TableCell><UniformityBadge value={report.uniformity_percent} method={report.uniformity_method} /></TableCell>
                  <TableCell className="text-right tabular-nums">{report.cv_percent != null ? `${report.cv_percent.toFixed(1)}%` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{signed(report.daily_gain_g, 1)}</TableCell>
                  <TableCell><SourceBadge source={report.data_source ?? "summary_only"} /></TableCell>
                  <TableCell className="text-sm">{report.recorded_by_name ?? "—"}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(report)} title="View session">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {onDeleteRecord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRecordToDelete(report.id)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <WeightSessionSheet report={detail} loading={detailLoading} onClose={() => setDetail(null)} />

      {onAddRecord && (
        <AddWeightReportModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleAddRecord}
          flock={flock}
          houses={houses}
        />
      )}

      {onDeleteRecord && (
        <ConfirmModal
          open={isDeleteDialogOpen}
          onOpenChange={(open) => (open ? setIsDeleteDialogOpen(true) : cancelDelete())}
          title="Delete Weighing Session"
          description="This deletes the session and all individual bird weights recorded in it. This action cannot be undone."
          icon={Trash2}
          tone="danger"
          confirmLabel="Delete"
          confirmIcon={Trash2}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

const WeightSessionSheet = ({ report, loading, onClose }: { report: WeightReport | null; loading: boolean; onClose: () => void }) => {
  const samples = report?.samples ?? []
  const included = samples.filter((s) => !s.excluded).map((s) => s.weight_g)
  const histogram = useMemo(() => {
    if (!report || included.length === 0) return []
    const stats = computeWeightStats(included, report.target_weight_g ?? null, report.uniformity_band_percent ?? 10)
    return weightHistogram(included, stats.bandLow, stats.bandHigh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, samples.length])

  const avg = report ? avgGrams(report) : null
  const rows: Array<[string, string]> = report
    ? [
        ["Date", `${formatDate(report.report_date)}${report.weighed_at_time ? ` · ${report.weighed_at_time.slice(0, 5)}` : ""}`],
        ["Age", report.age_days != null ? `${report.age_days} days` : "—"],
        ["House / pen", [report.house?.name, report.pen_label].filter(Boolean).join(" · ") || "—"],
        ["Sex", report.sex ? SEX_LABELS[report.sex] : "—"],
        ["Method", report.weighing_method ? WEIGHING_METHOD_LABELS[report.weighing_method] : "—"],
        ["Scale", report.scale_reference || "—"],
        ["Birds weighed", `${report.sample_size} of ${report.number_of_birds.toLocaleString()}`],
        ["Average", formatGrams(avg, 1)],
        ["Median", formatGrams(report.median_weight_g)],
        ["Min – Max", `${formatGrams(report.min_weight * 1000)} – ${formatGrams(report.max_weight * 1000)}`],
        ["Std deviation", report.std_dev_g != null ? `${report.std_dev_g.toFixed(1)} g` : "—"],
        ["CV", report.cv_percent != null ? `${report.cv_percent.toFixed(2)}%` : "—"],
        [
          "Uniformity",
          report.uniformity_percent != null
            ? `${report.uniformity_percent.toFixed(1)}% (${report.uniformity_method === "estimated" ? "≈" : ""}${report.birds_within_band ?? "?"} birds within ±${report.uniformity_band_percent ?? 10}%)${report.uniformity_method ? ` · ${UNIFORMITY_METHOD_LABELS[report.uniformity_method]}` : ""}`
            : "—",
        ],
        ["Target", formatGrams(report.target_weight_g)],
        [
          "vs target",
          report.deviation_from_target_g != null
            ? `${signed(report.deviation_from_target_g)} g (${signed(report.deviation_from_target_percent, 1, "%")})`
            : "—",
        ],
        ["Daily gain", report.daily_gain_g != null ? `${signed(report.daily_gain_g, 1)} g/day` : "—"],
        ["Recorded by", report.recorded_by_name ?? "—"],
      ]
    : []

  return (
    <Sheet open={!!report} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {report && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Weighing session <SourceBadge source={report.data_source ?? "summary_only"} />
              </SheetTitle>
              <SheetDescription>
                {formatDate(report.report_date)}
                {report.age_days != null ? ` · Day ${report.age_days}` : ""}
                {report.data_source === "ai_image" || report.data_source === "ai_file" ? " · extracted from an uploaded weighing sheet" : ""}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>

              {report.notes && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{report.notes}</div>
              )}

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading bird weights…
                </div>
              ) : samples.length > 0 ? (
                <>
                  {histogram.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-800">Distribution</p>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={histogram} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v} birds`, "Count"]} labelFormatter={(l) => `${l} g`} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {histogram.map((bin) => (
                              <Cell key={bin.label} fill={bin.inBand ? "#10b981" : "#cbd5e1"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-800">
                      Individual weights ({samples.length})
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        amber = possible outlier, struck through = excluded
                      </span>
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                      {samples.map((s, i) => (
                        <div
                          key={s.id ?? i}
                          className={cn(
                            "rounded-md border px-1.5 py-1 text-xs tabular-nums",
                            s.excluded && "bg-slate-100 text-slate-400 line-through",
                            !s.excluded && s.is_outlier && "border-amber-300 bg-amber-50 text-amber-800",
                            !s.excluded && !s.is_outlier && "border-slate-200 bg-white"
                          )}
                        >
                          <span className="mr-1 text-[10px] text-slate-400">{s.sequence ?? i + 1}</span>
                          {Math.round(s.weight_g)}
                          {s.sex ? <span className="ml-0.5 text-[10px] text-slate-400">{s.sex === "male" ? "M" : "F"}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  This session was recorded as a summary only, so individual bird weights are not available.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default WeightReportPage
