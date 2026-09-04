import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ClipboardList,
  Droplets,
  Edit,
  Eye,
  Skull,
  Sun,
  Thermometer,
  Trash2,
  Wheat,
} from "lucide-react"
import { toast } from "react-toastify"

import Pagination from "@/components/general/Pagination"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import RecordsDateRangeFilter from "@/components/poultry/Flocks/RecordsDateRangeFilter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRecordsDateRange } from "@/hooks/useRecordsDateRange"
import { isDateInRange } from "@/lib/dateRange"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import type { PoultryDailyReport } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

const DAILY_EXPORT_COLUMNS: ExportColumn<PoultryDailyReport>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Mortality", value: (row) => row.mortality },
  { header: "Feed (kg)", value: (row) => row.feed_consumed_kg },
  { header: "Water (L)", value: (row) => row.water_consumed_liters },
  { header: "Avg Weight (kg)", value: (row) => (row.avg_weight_grams ? row.avg_weight_grams / 1000 : "") },
  { header: "Min Temperature (°C)", value: (row) => row.min_temperature },
  { header: "Max Temperature (°C)", value: (row) => row.max_temperature },
  { header: "Humidity (%)", value: (row) => row.humidity },
  { header: "Light Hours", value: (row) => row.light_hours },
  { header: "Notes", value: (row) => row.notes },
]

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  iconBg,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  iconBg: string
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={cn("w-1.5 shrink-0", accent)} />
          <div className="flex flex-1 items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums truncate">{value}</p>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const DailyRecord = ({
  records,
  flockName,
  onEdit,
  onDelete,
}: {
  records: PoultryDailyReport[]
  flockName?: string
  onEdit?: (record: PoultryDailyReport) => void
  onDelete?: (recordId: number) => Promise<void>
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 10
  const [recordToDelete, setRecordToDelete] = useState<PoultryDailyReport | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
  } = useRecordsDateRange("this_month")

  const hasActions = Boolean(onEdit || onDelete)

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [records])

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((record) => isDateInRange(record.date, dateFrom, dateTo))
  }, [sortedRecords, dateFrom, dateTo])

  const kpis = useMemo(() => {
    const days = filteredRecords.length
    const totalMortality = filteredRecords.reduce((sum, r) => sum + Number(r.mortality || 0), 0)
    const totalFeed = filteredRecords.reduce((sum, r) => sum + Number(r.feed_consumed_kg || 0), 0)
    const totalWater = filteredRecords.reduce((sum, r) => sum + Number(r.water_consumed_liters || 0), 0)
    const avgWater = days > 0 ? totalWater / days : 0
    const highMortalityDays = filteredRecords.filter((r) => Number(r.mortality || 0) > 2).length
    return { days, totalMortality, totalFeed, avgWater, highMortalityDays }
  }, [filteredRecords])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage))

  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * recordsPerPage
    return filteredRecords.slice(startIdx, startIdx + recordsPerPage)
  }, [filteredRecords, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [dateFrom, dateTo, preset])

  const getAlertLevel = (record: PoultryDailyReport) => {
    if (record.mortality > 4) return "high"
    if (record.mortality > 2) return "medium"
    return "normal"
  }

  const handleDeleteClick = (record: PoultryDailyReport) => {
    setRecordToDelete(record)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!onDelete || !recordToDelete) return
    setIsDeleting(true)
    try {
      await onDelete(recordToDelete.id)
      toast.success("Daily record deleted successfully!")
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An error occurred while deleting the daily record.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">{filteredRecords.length}</span> of{" "}
            {records.length} records
          </p>
          <ExportDataButton
            rows={filteredRecords}
            columns={DAILY_EXPORT_COLUMNS}
            filename={buildExportFilename(flockName || "flock", "daily-records")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Days logged"
          value={String(kpis.days)}
          subtitle={rangeLabel}
          icon={ClipboardList}
          accent="bg-indigo-500"
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          title="Mortality"
          value={String(kpis.totalMortality)}
          subtitle="birds in range"
          icon={Skull}
          accent="bg-red-500"
          iconBg="bg-red-50 text-red-600"
        />
        <KpiCard
          title="Feed used"
          value={`${kpis.totalFeed.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`}
          icon={Wheat}
          accent="bg-amber-500"
          iconBg="bg-amber-50 text-amber-600"
        />
        <KpiCard
          title="Avg water"
          value={`${kpis.avgWater.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`}
          subtitle="per day"
          icon={Droplets}
          accent="bg-sky-500"
          iconBg="bg-sky-50 text-sky-600"
        />
        <KpiCard
          title="High mortality days"
          value={String(kpis.highMortalityDays)}
          subtitle=">2 birds / day"
          icon={AlertTriangle}
          accent="bg-orange-500"
          iconBg="bg-orange-50 text-orange-600"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-900">No daily records in this range</h3>
            <p className="max-w-sm text-sm text-slate-500">
              Try widening the date range or add a new daily record for the selected period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Mortality</TableHead>
                  <TableHead className="font-semibold text-slate-700">Feed (kg)</TableHead>
                  <TableHead className="font-semibold text-slate-700">Water (L)</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Avg weight</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden lg:table-cell">Temperature</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden lg:table-cell">Humidity</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden xl:table-cell">Light</TableHead>
                  <TableHead className="font-semibold text-slate-700">Notes</TableHead>
                  {hasActions && <TableHead className="w-[100px] font-semibold text-slate-700">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record, index) => {
                  const alertLevel = getAlertLevel(record)
                  return (
                    <TableRow
                      key={record.id ?? index}
                      className={cn(
                        "transition-colors",
                        alertLevel === "high" && "bg-red-50/60 hover:bg-red-50",
                        alertLevel === "medium" && "bg-amber-50/40 hover:bg-amber-50/70",
                        alertLevel === "normal" && "hover:bg-indigo-50/30"
                      )}
                    >
                      <TableCell className="font-medium text-slate-900">{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {alertLevel !== "normal" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-normal gap-1",
                                alertLevel === "high"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {record.mortality}
                            </Badge>
                          ) : (
                            <span className="tabular-nums text-slate-700">{record.mortality}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{Number(record.feed_consumed_kg).toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">
                        {Number(record.water_consumed_liters).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell tabular-nums">
                        {record.avg_weight_grams ? (record.avg_weight_grams / 1000).toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                          <span className="tabular-nums">
                            {record.min_temperature}° – {record.max_temperature}°
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Droplets className="h-3.5 w-3.5 text-sky-400" />
                          <span className="tabular-nums">{record.humidity}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Sun className="h-3.5 w-3.5 text-amber-400" />
                          <span className="tabular-nums">{record.light_hours}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.notes ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4 text-slate-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{record.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      {hasActions && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(record)}
                                className="h-8 w-8 p-0"
                                aria-label="Edit daily record"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label="Delete daily record"
                              >
                                <Trash2 className="h-4 w-4" />
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
            <div className="border-t border-slate-100 px-4 py-3 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </Card>
      )}

      {onDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Daily Record</DialogTitle>
              <DialogDescription>
                {recordToDelete
                  ? `Are you sure you want to delete the daily record for ${formatDate(recordToDelete.date)}? This action cannot be undone.`
                  : "Are you sure you want to delete this daily record? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setRecordToDelete(null)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void confirmDelete()} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DailyRecord
