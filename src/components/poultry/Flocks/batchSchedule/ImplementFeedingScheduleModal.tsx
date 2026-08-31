import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Plus,
  X,
  Wheat,
  ClipboardCheck,
  Clock,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format, addDays, parseISO, isBefore, isAfter, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import type { feedingScheduleItem, FeedingTimeEntry } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import { createFeedingBatchItem } from "@/lib/request"
import { formatFeedingDayRange, resolveRangeBounds } from "@/lib/feeding-range"

interface ImplementFeedingScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleItem: feedingScheduleItem
  batchScheduleId: number
  flockQuantity: number
  arrivalDate: string
  onSuccess?: () => void
}

const ImplementFeedingScheduleModal = ({
  open,
  onOpenChange,
  scheduleItem,
  batchScheduleId,
  flockQuantity,
  arrivalDate,
  onSuccess,
}: ImplementFeedingScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [feedingDate, setFeedingDate] = useState<Date>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [formData, setFormData] = useState({
    actual_quantity: scheduleItem.quantity?.toString() || "",
    status: "completed" as "scheduled" | "completed" | "missed",
    notes: "",
  })

  const [feedingTimes, setFeedingTimes] = useState<FeedingTimeEntry[]>(
    scheduleItem.feeding_times || [{ time: "08:00", percentage: 100 }]
  )

  const { start_day, end_day } = useMemo(
    () => resolveRangeBounds(scheduleItem),
    [scheduleItem]
  )

  const minDate = useMemo(() => {
    if (!arrivalDate) return undefined
    return startOfDay(addDays(parseISO(arrivalDate), start_day - 1))
  }, [arrivalDate, start_day])

  const maxDate = useMemo(() => {
    if (!arrivalDate || end_day == null) return undefined
    return startOfDay(addDays(parseISO(arrivalDate), end_day - 1))
  }, [arrivalDate, end_day])

  useEffect(() => {
    if (!open) return

    setFormData({
      actual_quantity: scheduleItem.quantity?.toString() || "",
      status: "completed",
      notes: "",
    })
    setFeedingTimes(scheduleItem.feeding_times || [{ time: "08:00", percentage: 100 }])

    const today = startOfDay(new Date())
    let defaultDate = today
    if (minDate && isBefore(today, minDate)) {
      defaultDate = minDate
    } else if (maxDate && isAfter(today, maxDate)) {
      defaultDate = maxDate
    }
    setFeedingDate(defaultDate)
  }, [open, scheduleItem, minDate, maxDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const totalPercentage = feedingTimes.reduce((sum, ft) => sum + Number(ft.percentage), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error(`Feeding time percentages must total 100%. Current total: ${totalPercentage}%`)
        setLoading(false)
        return
      }

      const payload = {
        feeding_batch_schedule_id: batchScheduleId,
        feeding_schedule_item_id: scheduleItem.id,
        feeding_date: format(feedingDate, "yyyy-MM-dd"),
        actual_quantity: formData.actual_quantity ? Number(formData.actual_quantity) : null,
        actual_feeding_time: feedingTimes,
        status: formData.status,
        notes: formData.notes || null,
      }

      const response = await createFeedingBatchItem(token!, farmId!, payload)

      if (!response.success) {
        throw new Error(response.error?.[0] || "Failed to create feeding batch schedule item")
      }

      toast.success("Feeding schedule implemented successfully!")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error implementing feeding schedule:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to implement feeding schedule"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addFeedingTime = () => {
    setFeedingTimes([...feedingTimes, { time: "12:00", percentage: 0 }])
  }

  const removeFeedingTime = (index: number) => {
    if (feedingTimes.length > 1) {
      setFeedingTimes(feedingTimes.filter((_, i) => i !== index))
    }
  }

  const updateFeedingTime = (index: number, field: keyof FeedingTimeEntry, value: string | number) => {
    const updated = [...feedingTimes]
    updated[index] = { ...updated[index], [field]: value }
    setFeedingTimes(updated)
  }

  const totalDailyQuantityPerBird = Number(formData.actual_quantity || 0)
  const totalDailyQuantity = totalDailyQuantityPerBird * flockQuantity
  const totalPercentage = feedingTimes.reduce((sum, ft) => sum + Number(ft.percentage), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Implement Feeding Schedule</DialogTitle>
            <DialogDescription className="text-amber-100">
              Record feeding for {formatFeedingDayRange(start_day, end_day)}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
              Status
            </h3>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Feeding Date
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-gray-300",
                  showCalendar && "border-amber-500 ring-2 ring-amber-100"
                )}
              >
                <span className="text-gray-900 font-medium">
                  {format(feedingDate, "EEEE, MMMM d, yyyy")}
                </span>
                {showCalendar ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {showCalendar && (
                <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                  <Calendar
                    mode="single"
                    selected={feedingDate}
                    onSelect={(date) => {
                      if (date) {
                        setFeedingDate(date)
                        setShowCalendar(false)
                      }
                    }}
                    disabled={(date) => {
                      const d = startOfDay(date)
                      if (minDate && isBefore(d, minDate)) return true
                      if (maxDate && isAfter(d, maxDate)) return true
                      return false
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-slate-500">
                Dates limited to {formatFeedingDayRange(start_day, end_day)}
                {end_day == null ? " (no upper bound)" : ""}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              Quantity
            </h3>
            <div className="space-y-1">
              <Label htmlFor="actual_quantity" className="text-xs text-gray-600">
                Actual Quantity per Bird (grams) *
              </Label>
              <Input
                id="actual_quantity"
                type="number"
                min="0"
                step="0.1"
                value={formData.actual_quantity}
                onChange={(e) => handleInputChange("actual_quantity", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Total:{" "}
              <span className="font-bold text-amber-700">
                {(totalDailyQuantity / 1000).toFixed(2)} kg
              </span>{" "}
              ({totalDailyQuantityPerBird.toFixed(1)}g × {flockQuantity} birds)
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Feeding Times
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addFeedingTime} className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Add Time
              </Button>
            </div>
            <div className="space-y-2">
              {feedingTimes.map((ft, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">Time</Label>
                    <Input
                      type="time"
                      value={ft.time}
                      onChange={(e) => updateFeedingTime(index, "time", e.target.value)}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={ft.percentage}
                      onChange={(e) => updateFeedingTime(index, "percentage", Number(e.target.value))}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  {feedingTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeedingTime(index)}
                      className="h-8 w-8 p-0 mt-5"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div
              className={cn(
                "text-sm p-2 rounded-lg border",
                Math.abs(totalPercentage - 100) < 0.01
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              Total Percentage: <span className="font-bold">{totalPercentage.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Implementing..." : "Implement Feeding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ImplementFeedingScheduleModal
