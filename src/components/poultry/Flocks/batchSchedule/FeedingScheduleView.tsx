import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Wheat,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  ClipboardCheck,
  ListChecks,
  Undo2,
} from "lucide-react"
import type { BatchFeedingSchedule } from "@/lib/types"
import ImplementFeedingScheduleModal from "./ImplementFeedingScheduleModal"
import BulkImplementFeedingModal from "./BulkImplementFeedingModal"
import BulkRevertFeedingModal from "./BulkRevertFeedingModal"
import {
  coversFeedingDay,
  countMissedDaysInRange,
  formatFeedingDayRange,
  listMissedFeedingDays,
  resolveRangeBounds,
} from "@/lib/feeding-range"

interface FeedingScheduleViewProps {
  schedule: BatchFeedingSchedule
  flockQuantity: number
  currentFeedingDay: number
  arrivalDate: string
  onRefresh?: () => void
  readOnly?: boolean
  onChangeSchedule?: () => void
}

function executedTotalGrams(
  executedItem: { actual_total_kg?: number | string | null; actual_quantity?: number | string | null },
  flockQuantity: number
): number {
  const storedTotalKg = executedItem.actual_total_kg
  if (storedTotalKg != null && storedTotalKg !== "") {
    return Number(storedTotalKg) * 1000
  }
  return Number(executedItem.actual_quantity || 0) * flockQuantity
}

function daysElapsedInRange(
  start: number,
  end: number | null,
  currentFeedingDay: number
): number {
  if (currentFeedingDay < start) return 0
  const effectiveEnd = end == null ? currentFeedingDay : Math.min(end, currentFeedingDay)
  return Math.max(0, effectiveEnd - start + 1)
}

const FeedingScheduleView = ({
  schedule,
  flockQuantity,
  currentFeedingDay,
  arrivalDate,
  onRefresh,
  readOnly = false,
  onChangeSchedule,
}: FeedingScheduleViewProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [implementModalOpen, setImplementModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [revertModalOpen, setRevertModalOpen] = useState(false)
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<any>(null)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "active":
      case "recorded":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
      case "upcoming":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "missed":
      case "past":
      case "partial":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const allScheduleItems = [...(schedule.schedule?.items || [])].sort((a, b) => {
    const as = resolveRangeBounds(a).start_day
    const bs = resolveRangeBounds(b).start_day
    return as - bs
  })
  const executedItems = schedule.items || []

  const missedPreview = useMemo(
    () =>
      listMissedFeedingDays({
        scheduleItems: allScheduleItems,
        executedItems,
        currentFeedingDay,
        arrivalDate,
        flockQuantity,
      }),
    [allScheduleItems, executedItems, currentFeedingDay, arrivalDate, flockQuantity]
  )

  const missedCount = missedPreview.length
  const missedTotalKg = missedPreview.reduce((sum, day) => sum + day.planned_total_kg, 0)

  const revertiblePreview = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    const revertibleDays = executedItems
      .filter((item) => item.status === "late" && item.feeding_date.slice(0, 10) < today)
      .map((item) => ({
        id: item.id,
        feeding_day: 0,
        feeding_date: item.feeding_date.slice(0, 10),
        feeding_schedule_item_id: item.feeding_schedule_item_id,
        actual_quantity: Number(item.actual_quantity || 0),
        planned_total_kg: executedTotalGrams(item, flockQuantity) / 1000,
      }))

    return {
      revertible_days: revertibleDays,
      count: revertibleDays.length,
      total_feed_kg: revertibleDays.reduce((sum, day) => sum + day.planned_total_kg, 0),
    }
  }, [executedItems, flockQuantity])

  const revertibleCount = revertiblePreview.count

  const totalDaysCovered = allScheduleItems.reduce((sum, item) => {
    const { start_day, end_day } = resolveRangeBounds(item)
    if (end_day == null) return sum
    return sum + (end_day - start_day + 1)
  }, 0)

  const recordedDays = executedItems.length
  const totalFeedKg =
    executedItems.reduce((sum, item) => sum + executedTotalGrams(item, flockQuantity), 0) / 1000

  const activeRange = allScheduleItems.find((item) =>
    coversFeedingDay(item, currentFeedingDay)
  )

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-orange-500 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wheat className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {schedule.schedule.title}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {schedule.schedule.description || "Feeding schedule for the flock"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getStatusColor(schedule.status)} border px-3 py-1`}>
                {schedule.status.toUpperCase()}
              </Badge>
              {!readOnly && missedCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => setBulkModalOpen(true)}
                  className="h-8 bg-red-600 hover:bg-red-700"
                >
                  <ListChecks className="h-4 w-4 mr-1" />
                  Implement all missed ({missedCount})
                </Button>
              )}
              {!readOnly && revertibleCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevertModalOpen(true)}
                  className="h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Revert backfill ({revertibleCount})
                </Button>
              )}
              {!readOnly && onChangeSchedule && (
                <Button variant="outline" size="sm" onClick={onChangeSchedule} className="h-8">
                  Change schedule
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{allScheduleItems.length}</div>
              <div className="text-xs text-gray-600">Ranges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {totalDaysCovered || "∞"}
              </div>
              <div className="text-xs text-gray-600">Days covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recordedDays}</div>
              <div className="text-xs text-gray-600">Days recorded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{missedCount}</div>
              <div className="text-xs text-gray-600">Days missed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalFeedKg.toFixed(2)}kg</div>
              <div className="text-xs text-gray-600">Total feed</div>
            </div>
          </div>
          {missedCount > 0 && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {missedCount} past day(s) not recorded (~{missedTotalKg.toFixed(2)} kg planned).
              {!readOnly && " Use bulk implement to backfill all at once."}
            </div>
          )}
          {activeRange && (
            <div className="mt-3 text-sm text-slate-600">
              Today is placement day <span className="font-semibold">{currentFeedingDay}</span> — active rate{" "}
              <span className="font-semibold">{Number(activeRange.quantity)} g/bird</span> (
              {formatFeedingDayRange(
                resolveRangeBounds(activeRange).start_day,
                resolveRangeBounds(activeRange).end_day
              )}
              )
            </div>
          )}
        </CardContent>
      </Card>

      {isExpanded && (
        <div className="space-y-3">
          {allScheduleItems.map((scheduleItem) => {
            const { start_day, end_day } = resolveRangeBounds(scheduleItem)
            const rangeExecuted = executedItems.filter(
              (ei) => ei.feeding_schedule_item_id === scheduleItem.id
            )
            const elapsed = daysElapsedInRange(start_day, end_day, currentFeedingDay)
            const rangeMissed = countMissedDaysInRange(
              scheduleItem.id,
              start_day,
              end_day,
              currentFeedingDay,
              allScheduleItems,
              executedItems,
              arrivalDate
            )
            const coversToday = coversFeedingDay(scheduleItem, currentFeedingDay)
            const isUpcoming = start_day > currentFeedingDay
            const rangeTotalDays =
              end_day != null ? end_day - start_day + 1 : Math.max(0, currentFeedingDay - start_day)

            let status: "active" | "upcoming" | "past" | "recorded" | "partial" = "upcoming"
            if (coversToday) status = "active"
            else if (isUpcoming) status = "upcoming"
            else if (rangeMissed === 0 && rangeExecuted.length > 0) status = "recorded"
            else if (rangeMissed > 0 && rangeExecuted.length > 0) status = "partial"
            else if (rangeMissed > 0) status = "past"

            const plannedPerBird = Number(scheduleItem.quantity || 0)
            const plannedDailyKg = (plannedPerBird * flockQuantity) / 1000

            return (
              <Card key={scheduleItem.id} className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center min-w-10 h-10 px-2 bg-orange-100 rounded-full">
                        <span className="text-orange-700 font-bold text-xs whitespace-nowrap">
                          {formatFeedingDayRange(start_day, end_day).replace("Day ", "D")}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatFeedingDayRange(start_day, end_day)} Feeding
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {plannedPerBird}g/bird/day · {plannedDailyKg.toFixed(2)} kg/day for flock
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {rangeExecuted.length} / {rangeTotalDays || "∞"} day(s) recorded
                          {rangeMissed > 0 && (
                            <span className="text-red-600">· {rangeMissed} missed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(status)} border flex items-center gap-1`}>
                      {status === "active" && <CheckCircle className="h-3.5 w-3.5" />}
                      {(status === "past" || status === "partial") && (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      {status === "upcoming" && <Clock className="h-3.5 w-3.5" />}
                      {status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-xs text-gray-500">Days elapsed</div>
                      <div className="text-lg font-bold text-gray-900">
                        {elapsed}
                        {end_day != null ? ` / ${end_day - start_day + 1}` : "+"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Days recorded</div>
                      <div className="text-lg font-bold text-green-700">{rangeExecuted.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Feed type</div>
                      <div className="text-sm font-semibold text-gray-800 mt-1">
                        #{scheduleItem.feed_type_id}
                      </div>
                    </div>
                  </div>

                  {(scheduleItem.feeding_times || []).length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <Clock className="h-4 w-4" />
                        Daily times
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(scheduleItem.feeding_times || []).map((time: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs"
                          >
                            <span className="font-semibold text-blue-900">{time.time}</span>
                            <span className="text-blue-700 ml-2">{time.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(status === "active" || status === "past" || status === "partial") && !readOnly && (
                    <div className="mt-4 flex items-center justify-between gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-sm text-amber-800">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>
                          {status === "active"
                            ? "Record today’s feeding for this range"
                            : "Backfill a missed day in this range"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedScheduleItem(scheduleItem)
                          setImplementModalOpen(true)
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Implement
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedScheduleItem && (
        <ImplementFeedingScheduleModal
          open={implementModalOpen}
          onOpenChange={setImplementModalOpen}
          scheduleItem={selectedScheduleItem}
          batchScheduleId={schedule.id}
          flockQuantity={flockQuantity}
          arrivalDate={arrivalDate}
          onSuccess={() => {
            onRefresh?.()
          }}
        />
      )}

      <BulkImplementFeedingModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        batchScheduleId={schedule.id}
        fallbackPreview={{
          missed_days: missedPreview,
          count: missedCount,
          total_feed_kg: missedTotalKg,
          inventory_requirements: [],
        }}
        onSuccess={() => {
          onRefresh?.()
        }}
      />

      <BulkRevertFeedingModal
        open={revertModalOpen}
        onOpenChange={setRevertModalOpen}
        batchScheduleId={schedule.id}
        fallbackPreview={revertiblePreview}
        onSuccess={() => {
          onRefresh?.()
        }}
      />
    </div>
  )
}

export default FeedingScheduleView
