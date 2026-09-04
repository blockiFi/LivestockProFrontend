import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { EggReport, FlockRecord, DetailedFlockRecord } from "@/lib/types"
import { getSalesRecords, type EggReportPayload } from "@/lib/request"
import {
  Egg,
  Eye,
  Package,
  Pencil,
  Percent,
  Plus,
  AlertTriangle,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { formatDate } from "@/lib/utils"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import Pagination from "@/components/general/Pagination"
import AddEggRecordModal from "@/components/modals/AddEggRecordModal"
import RecordsDateRangeFilter from "@/components/poultry/Flocks/RecordsDateRangeFilter"
import { useRecordsDateRange } from "@/hooks/useRecordsDateRange"
import { toast } from "react-toastify"
import {
  buildEggTrendSeries,
  computeEggKpis,
  computeEggStock,
  filterEggReportsByDateRange,
  getDayOverDayDelta,
  getProductionBadgeLevel,
  sortEggReportsByDate,
  sumBrokenEggs,
  sumCollectedEggs,
} from "@/lib/eggMetrics"

const EGG_EXPORT_COLUMNS: ExportColumn<EggReport>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Eggs Collected", value: (row) => row.eggs_collected },
  { header: "Eggs Broken", value: (row) => row.eggs_broken ?? 0 },
  { header: "Avg Egg Weight (g)", value: (row) => row.average_egg_weight },
  { header: "Production %", value: (row) => row.production_percentage },
  { header: "Bird Count", value: (row) => row.bird_count },
  { header: "Recorded By", value: (row) => row.recorded_by_name ?? "" },
  { header: "Notes", value: (row) => row.notes },
]

interface EggRecordPageProps {
  reports: EggReport[]
  flock?: FlockRecord | DetailedFlockRecord
  onAddRecord?: (data: EggReportPayload) => Promise<void>
  onUpdateRecord?: (id: number, data: EggReportPayload) => Promise<void>
  onDeleteRecord?: (id: number) => Promise<void>
}

const badgeClassNames = {
  good: "bg-emerald-100 text-emerald-800 border-emerald-200",
  fair: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-rose-100 text-rose-800 border-rose-200",
} as const

const EggRecordPage = ({
  reports,
  flock,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: EggRecordPageProps) => {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
    rangeLabel,
  } = useRecordsDateRange()
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<EggReport | undefined>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)
  const [eggsSold, setEggsSold] = useState(0)
  const stockCardRef = useRef<HTMLDivElement | null>(null)
  const reportsPerPage = 10

  const flockId = flock?.id

  const loadEggSales = useCallback(async () => {
    if (!token || !farmId || !flockId) {
      setEggsSold(0)
      return
    }
    const res = await getSalesRecords(token, farmId, { flock_id: flockId, type: "egg" })
    if (res.success && res.data) {
      const sold = res.data.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
      setEggsSold(sold)
    }
  }, [token, farmId, flockId])

  useEffect(() => {
    void loadEggSales()
  }, [loadEggSales, reports])

  // Refetch when Eggs tab becomes visible again (e.g. after recording a sale)
  useEffect(() => {
    const el = stockCardRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadEggSales()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadEggSales])

  const filteredReports = useMemo(
    () => filterEggReportsByDateRange(reports, dateFrom || undefined, dateTo || undefined),
    [reports, dateFrom, dateTo]
  )

  const sortedReports = useMemo(
    () => sortEggReportsByDate(filteredReports, "desc"),
    [filteredReports]
  )

  const kpis = useMemo(() => computeEggKpis(filteredReports), [filteredReports])
  const trendData = useMemo(() => buildEggTrendSeries(filteredReports), [filteredReports])

  const dailyRecords = useMemo(() => {
    if (flock && "daily_records" in flock && Array.isArray(flock.daily_records)) {
      return flock.daily_records
    }
    return []
  }, [flock])

  /** Egg-report broken + daily broken only for dates without an egg report (legacy). */
  const brokenSource = useMemo(() => {
    const reportDates = new Set(reports.map((r) => r.date?.slice(0, 10)).filter(Boolean))
    const dailyOnly = dailyRecords.filter((d) => {
      const key = d.date?.slice(0, 10)
      return key && !reportDates.has(key)
    })
    return [
      ...reports.map((r) => ({ date: r.date, eggs_broken: r.eggs_broken ?? 0 })),
      ...dailyOnly.map((d) => ({ date: d.date, eggs_broken: d.eggs_broken ?? 0 })),
    ]
  }, [reports, dailyRecords])

  const brokenInRange = useMemo(
    () => sumBrokenEggs(brokenSource, dateFrom || undefined, dateTo || undefined),
    [brokenSource, dateFrom, dateTo]
  )

  /** Current stock uses lifetime collected vs sold vs broken (same rules as backend). */
  const eggStock = useMemo(() => {
    const collected = sumCollectedEggs(reports, dailyRecords)
    const broken = sumBrokenEggs(brokenSource)
    return computeEggStock(collected, eggsSold, broken)
  }, [reports, dailyRecords, eggsSold, brokenSource])

  const trendTitle = useMemo(() => {
    if (dateFrom && dateTo) {
      return `Production Trend (${formatDate(dateFrom)} – ${formatDate(dateTo)})`
    }
    if (dateFrom) {
      return `Production Trend (from ${formatDate(dateFrom)})`
    }
    if (dateTo) {
      return `Production Trend (through ${formatDate(dateTo)})`
    }
    return "Production Trend"
  }, [dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / reportsPerPage))
  const paginatedReports = useMemo(() => {
    const startIdx = (currentPage - 1) * reportsPerPage
    return sortedReports.slice(startIdx, startIdx + reportsPerPage)
  }, [sortedReports, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [reports, dateFrom, dateTo])

  const handleAddRecord = async (recordData: EggReportPayload) => {
    if (!onAddRecord) return
    try {
      await onAddRecord(recordData)
      toast.success("Egg report created successfully!")
      setIsAddModalOpen(false)
    } catch (error) {
      if (error instanceof Error) toast.error(error.message)
      else toast.error("An error occurred while creating the egg report.")
      throw error
    }
  }

  const handleUpdateRecord = async (recordData: EggReportPayload) => {
    if (!onUpdateRecord || !editingReport) return
    try {
      await onUpdateRecord(editingReport.id, recordData)
      toast.success("Egg report updated successfully!")
      setEditingReport(undefined)
    } catch (error) {
      if (error instanceof Error) toast.error(error.message)
      else toast.error("An error occurred while updating the egg report.")
      throw error
    }
  }

  const confirmDelete = async () => {
    if (!onDeleteRecord || !recordToDelete) return
    try {
      await onDeleteRecord(recordToDelete)
      toast.success("Egg report deleted successfully!")
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      if (error instanceof Error) toast.error(error.message)
      else toast.error("An error occurred while deleting the egg report.")
    }
  }

  const renderTrendDelta = (delta: number | null, suffix = "") => {
    if (delta === null) return <span className="text-xs text-gray-400">—</span>
    if (delta === 0) return <span className="text-xs text-gray-500">0{suffix}</span>
    const positive = delta > 0
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {positive ? "+" : ""}
        {delta.toFixed(suffix === "%" ? 2 : 0)}
        {suffix}
      </span>
    )
  }

  const hasAnyReports = reports.length > 0
  const emptyInRange = hasAnyReports && sortedReports.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <RecordsDateRangeFilter
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          rangeLabel={rangeLabel}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            Showing {sortedReports.length} of {reports.length}
          </span>
          <ExportDataButton
            rows={sortedReports}
            columns={EGG_EXPORT_COLUMNS}
            filename={buildExportFilename(flock?.name || "flock", "eggs")}
          />
          {onAddRecord && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-amber-600 hover:from-emerald-600 hover:to-amber-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Egg Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <Card ref={stockCardRef} className="p-4 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Stock</p>
              <p className="text-2xl font-bold text-emerald-700">{eggStock.available.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {eggStock.collected.toLocaleString()} collected · {eggStock.sold.toLocaleString()} sold ·{" "}
                {eggStock.broken.toLocaleString()} broken
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Lifetime stock (as of today). Sale checks use the sale date.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Egg className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-amber-600">{kpis.totalEggs.toLocaleString()}</p>
              {(dateFrom || dateTo) && (
                <p className="text-xs text-gray-400 mt-0.5">In selected range</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Broken Eggs</p>
              <p className="text-2xl font-bold text-rose-600">{brokenInRange.toLocaleString()}</p>
              {(dateFrom || dateTo) && (
                <p className="text-xs text-gray-400 mt-0.5">In selected range</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Egg className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Daily Production</p>
              <p className="text-2xl font-bold text-emerald-600">{kpis.avgDailyEggs.toFixed(0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Percent className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Peak Hen-day %</p>
              <p className="text-2xl font-bold text-violet-600">{kpis.peakProductionPct.toFixed(2)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Percent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Latest Hen-day %</p>
              <p className="text-2xl font-bold text-blue-600">{kpis.latestProductionPct.toFixed(2)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{trendTitle}</h3>
          <ChartContainer
            config={{
              eggs: { label: "Eggs", color: "#d97706" },
              productionPct: { label: "Production %", color: "#059669" },
            }}
            className="aspect-[16/7] w-full min-h-[220px]"
          >
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={44} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={44} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line yAxisId="left" type="monotone" dataKey="eggs" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} name="Eggs" />
              <Line yAxisId="right" type="monotone" dataKey="productionPct" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name="Production %" />
            </LineChart>
          </ChartContainer>
        </Card>
      )}

      {sortedReports.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <Egg className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {emptyInRange ? "No egg reports in this range" : "No egg reports yet"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {emptyInRange
              ? `Nothing matches ${rangeLabel}. Try a wider date range.`
              : "Start tracking daily egg collection for this flock."}
          </p>
          {onAddRecord && !emptyInRange && (
            <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Egg Report
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Eggs</TableHead>
                  <TableHead>Broken</TableHead>
                  <TableHead>Avg Weight (g)</TableHead>
                  <TableHead>Production %</TableHead>
                  <TableHead>Bird Count</TableHead>
                  <TableHead>Day-over-day</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Notes</TableHead>
                  {(onUpdateRecord || onDeleteRecord) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report, index) => {
                  const globalIndex = (currentPage - 1) * reportsPerPage + index
                  const previous = sortedReports[globalIndex + 1]
                  const delta = getDayOverDayDelta(report, previous)
                  const badgeLevel = getProductionBadgeLevel(Number(report.production_percentage || 0))

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{formatDate(report.date)}</TableCell>
                      <TableCell>{report.eggs_collected.toLocaleString()}</TableCell>
                      <TableCell className={Number(report.eggs_broken || 0) > 0 ? "text-rose-600 font-medium" : undefined}>
                        {Number(report.eggs_broken || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{Number(report.average_egg_weight || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badgeClassNames[badgeLevel]}>
                          {Number(report.production_percentage || 0).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{report.bird_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {renderTrendDelta(delta.eggsDelta)}
                          {renderTrendDelta(delta.productionPctDelta, "%")}
                        </div>
                      </TableCell>
                      <TableCell>{report.recorded_by_name ?? "—"}</TableCell>
                      <TableCell>
                        {report.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Eye className="h-4 w-4 text-gray-400 cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{report.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      {(onUpdateRecord || onDeleteRecord) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onUpdateRecord && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingReport(report)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {onDeleteRecord && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRecordToDelete(report.id)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {onAddRecord && (
        <AddEggRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddRecord}
          flock={flock}
        />
      )}

      {onUpdateRecord && (
        <AddEggRecordModal
          isOpen={Boolean(editingReport)}
          onClose={() => setEditingReport(undefined)}
          onSubmit={handleUpdateRecord}
          flock={flock}
          initialReport={editingReport}
        />
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Egg Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this egg report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EggRecordPage
