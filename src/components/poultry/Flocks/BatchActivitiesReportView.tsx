import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  CalendarRange,
  FileText,
  Loader2,
  Search,
  ArrowDownAZ,
} from "lucide-react"

import { Calendar } from "@/components/ui/calendar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Pagination from "@/components/general/Pagination"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import type { RootState } from "@/store"
import type { DetailedFlockRecord } from "@/lib/types"
import {
  ACTIVITY_DATE_PRESET_OPTIONS,
  buildBatchBadgeLabel,
  parseLocalIsoDate,
  resolveActivityDateRange,
  toLocalIsoDate,
  type ActivityDateRangePreset,
} from "@/lib/dateRange"
import {
  fetchAllFlockActivities,
  getFlockActivities,
  type BatchActivityReportMeta,
  type BatchActivityRow,
  type BatchActivityCategory,
} from "@/lib/request"
import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_EXPORT_COLUMNS,
} from "@/lib/batchActivityExport"
import { buildExportFilename } from "@/lib/exportData"
import { exportFlockActivitiesPdf } from "@/lib/print-flock-activities"
import { formatDate, cn } from "@/lib/utils"
import ActivityTimeline from "@/components/poultry/Flocks/batchActivity/ActivityTimeline"
import FeedOverviewPanel from "@/components/poultry/Flocks/batchActivity/FeedOverviewPanel"
import SummaryStatGrid from "@/components/poultry/Flocks/batchActivity/SummaryStatGrid"

type SortKey = keyof Pick<
  BatchActivityRow,
  "date" | "activity" | "category" | "status"
>

type Props = {
  flock: DetailedFlockRecord
}

const ROWS_PER_PAGE = 10

export default function BatchActivitiesReportView({ flock }: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const farmName = useSelector((state: RootState) => state.authentication.activeFarm?.name)

  const [preset, setPreset] = useState<ActivityDateRangePreset>("last_7")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [calendarMonths, setCalendarMonths] = useState(1)
  const [activeFrom, setActiveFrom] = useState("")
  const [activeTo, setActiveTo] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activityType, setActivityType] = useState<BatchActivityCategory | "">("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<BatchActivityReportMeta | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)")
    const update = () => setCalendarMonths(media.matches ? 2 : 1)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const seedCustomRange = useCallback((): DateRange => {
    if (activeFrom && activeTo) {
      return {
        from: parseLocalIsoDate(activeFrom),
        to: parseLocalIsoDate(activeTo),
      }
    }

    const { dateFrom, dateTo } = resolveActivityDateRange("last_7", "", "")
    return {
      from: parseLocalIsoDate(dateFrom),
      to: parseLocalIsoDate(dateTo),
    }
  }, [activeFrom, activeTo])

  const handlePresetChange = (value: ActivityDateRangePreset) => {
    setPreset(value)
    if (value !== "custom") return

    const range = seedCustomRange()
    setCustomRange(range)
    if (range.from) setCustomFrom(toLocalIsoDate(range.from))
    if (range.to) setCustomTo(toLocalIsoDate(range.to))
  }

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range)
    if (range?.from) {
      setCustomFrom(toLocalIsoDate(range.from))
    } else {
      setCustomFrom("")
    }
    if (range?.to) {
      setCustomTo(toLocalIsoDate(range.to))
    } else if (range?.from) {
      setCustomTo(toLocalIsoDate(range.from))
    } else {
      setCustomTo("")
    }
  }

  const sortedRows = useMemo(() => {
    const rows = [...(report?.activities.data ?? [])]
    rows.sort((a, b) => {
      const av = String(a[sortKey] ?? "")
      const bv = String(b[sortKey] ?? "")
      const cmp = av.localeCompare(bv)
      return sortDir === "asc" ? cmp : -cmp
    })
    return rows
  }, [report?.activities.data, sortKey, sortDir])

  const fetchReport = useCallback(
    async (opts?: { page?: number; resetPage?: boolean }) => {
      if (!token || !farmId) return

      const { dateFrom, dateTo } = resolveActivityDateRange(preset, customFrom, customTo)
      if (!dateFrom || !dateTo) {
        toast.error(
          preset === "custom"
            ? "Select a start and end date on the calendar"
            : "Please select a valid date range"
        )
        return
      }
      if (dateFrom > dateTo) {
        toast.error("Start date must be on or before the end date")
        return
      }

      setLoading(true)
      setError(null)

      const nextPage = opts?.resetPage ? 1 : (opts?.page ?? page)

      const result = await getFlockActivities(token, farmId, flock.id, {
        start_date: dateFrom,
        end_date: dateTo,
        activity_type: activityType || undefined,
        search: debouncedSearch || undefined,
        page: nextPage,
        per_page: ROWS_PER_PAGE,
      })

      setLoading(false)

      if (!result.success || !result.data) {
        const message = result.error?.[0] ?? "Failed to load activity report"
        setError(message)
        toast.error(message)
        return
      }

      setReport(result.data)
      setActiveFrom(dateFrom)
      setActiveTo(dateTo)
      setHasGenerated(true)
      if (opts?.resetPage) setPage(1)
      else if (opts?.page) setPage(opts.page)
    },
    [
      token,
      farmId,
      flock.id,
      preset,
      customFrom,
      customTo,
      activityType,
      debouncedSearch,
      page,
    ]
  )

  useEffect(() => {
    if (!hasGenerated) return
    void fetchReport({ resetPage: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activityType])

  useEffect(() => {
    if (!hasGenerated) return
    void fetchReport({ page })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleGenerate = () => {
    setPage(1)
    void fetchReport({ resetPage: true })
  }

  const toggleSortDir = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
  }

  const badgeLabel =
    report && activeFrom && activeTo
      ? buildBatchBadgeLabel(flock, activeFrom, activeTo, report.batch.batch_week)
      : null

  const exportAllRows = async () => {
    if (!token || !farmId || !activeFrom || !activeTo) return []
    return fetchAllFlockActivities(token, farmId, flock.id, {
      start_date: activeFrom,
      end_date: activeTo,
      activity_type: activityType || undefined,
      search: debouncedSearch || undefined,
    })
  }

  const handlePdfExport = async () => {
    if (!report) return
    try {
      const rows = await exportAllRows()
      exportFlockActivitiesPdf({
        flock,
        report,
        rows,
        farmName,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed")
    }
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50/80 px-4 py-12 text-center">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700">No activities found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Try a wider date range or adjust your search and category filters.
          </p>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-lg border bg-slate-50/60 p-4 sm:p-6">
          <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <Label className="text-xs text-muted-foreground">Date range</Label>
                <Select value={preset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_DATE_PRESET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={cn(
                  "sm:col-span-2",
                  preset === "custom" ? "lg:col-span-8" : "lg:col-span-8"
                )}
              >
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </div>
            </div>

            {preset === "custom" && (
              <div className="mt-4 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 sm:p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Custom date range</p>
                    <p className="text-xs text-muted-foreground">
                      Click a start date, then an end date. Future dates include planned activities.
                    </p>
                  </div>
                  <p className="text-sm font-medium text-indigo-700">
                    {customFrom && customTo
                      ? `${format(parseLocalIsoDate(customFrom)!, "dd MMM yyyy")} – ${format(parseLocalIsoDate(customTo)!, "dd MMM yyyy")}`
                      : customFrom
                        ? `${format(parseLocalIsoDate(customFrom)!, "dd MMM yyyy")} – select end date`
                        : "Select start and end dates"}
                  </p>
                </div>
                <div className="flex justify-center overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
                  <Calendar
                    mode="range"
                    numberOfMonths={calendarMonths}
                    defaultMonth={customRange?.from ?? new Date()}
                    selected={customRange}
                    onSelect={handleCustomRangeSelect}
                    className="rounded-md"
                  />
                </div>
              </div>
            )}

            {hasGenerated && activeFrom && activeTo && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Showing{" "}
                <span className="font-medium text-foreground">{formatDate(activeFrom)}</span>
                {" – "}
                <span className="font-medium text-foreground">{formatDate(activeTo)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
            {badgeLabel && (
              <Badge
                variant="outline"
                className="w-full sm:w-auto whitespace-normal text-left text-xs sm:text-sm px-3 py-2 font-medium leading-relaxed h-auto"
              >
                {badgeLabel}
              </Badge>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!hasGenerated && !loading && (
              <div className="rounded-lg border border-dashed bg-slate-50/80 px-4 py-10 text-center">
                <CalendarRange className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-700">Select a date range to begin</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a preset or custom range, then tap Generate Report.
                </p>
              </div>
            )}

            {report && hasGenerated && (
              <>
                <FeedOverviewPanel summary={report.summary} />

                <SummaryStatGrid summary={report.summary} />

                <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px]">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-8 bg-white"
                        placeholder="Search activities…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={activityType || "all"}
                      onValueChange={(v) =>
                        setActivityType(v === "all" ? "" : (v as BatchActivityCategory))
                      }
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {report.activities.total}{" "}
                        {report.activities.total === 1 ? "activity" : "activities"} found
                        {loading && (
                          <Loader2 className="inline-block h-3.5 w-3.5 ml-2 animate-spin" />
                        )}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={toggleSortDir}
                      >
                        <ArrowDownAZ className="h-3.5 w-3.5 mr-1.5" />
                        {sortDir === "desc" ? "Newest first" : "Oldest first"}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                        <ExportDataButton
                          getRows={exportAllRows}
                          columns={ACTIVITY_EXPORT_COLUMNS}
                          filename={buildExportFilename("batch-activities", flock.name)}
                          disabled={!report.activities.total}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={!report.activities.total || loading}
                        onClick={() => void handlePdfExport()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </div>

                <ActivityTimeline
                  rows={sortedRows}
                  loading={loading}
                  sortDir={sortDir}
                  emptyState={emptyState}
                />

                {report.activities.last_page > 1 && (
                  <div className="pt-1">
                    <Pagination
                      currentPage={report.activities.current_page}
                      totalPages={report.activities.last_page}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
        </div>
    </div>
  )
}
