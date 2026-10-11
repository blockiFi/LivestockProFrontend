import { useState, useEffect, useMemo } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { formatFeedingDayRange, normalizeFeedingTimesForUi, resolveRangeBounds } from "@/lib/feeding-range"

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
    normalizeFeedingTimesForUi(scheduleItem.feeding_times, [{ time: "08:00", percentage: 100 }])
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
    setFeedingTimes(
      normalizeFeedingTimesForUi(scheduleItem.feeding_times, [{ time: "08:00", percentage: 100 }])
    )

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
    setFeedingTimes((prev) => [...prev, { time: "12:00", percentage: 0 }])
  }

  const removeFeedingTime = (index: number) => {
    setFeedingTimes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const updateFeedingTime = (index: number, field: keyof FeedingTimeEntry, value: string | number) => {
    setFeedingTimes((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: field === "percentage" ? Number(value) || 0 : String(value),
      }
      return updated
    })
  }

  const totalDailyQuantityPerBird = Number(formData.actual_quantity || 0)
  const totalDailyQuantity = totalDailyQuantityPerBird * flockQuantity
  const totalPercentage = feedingTimes.reduce((sum, ft) => sum + Number(ft.percentage), 0)
  const percentageOk = Math.abs(totalPercentage - 100) < 0.01

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Implement Feeding Schedule"
      description={`Record feeding for ${formatFeedingDayRange(start_day, end_day)}.`}
      icon={Wheat}
      tone="schedule"
      size="lg"
      busy={loading}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitLabel="Implement Feeding"
          busyLabel="Implementing..."
          busy={loading}
          icon={Wheat}
        />
      }
    >
      <FormSection step={1} icon={ClipboardCheck} title="Status & date" description="Outcome of this feeding and the day it applies to.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Status" required>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Feeding date"
            required
            hint={`Dates limited to ${formatFeedingDayRange(start_day, end_day)}${end_day == null ? " (no upper bound)" : ""}.`}
          >
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm transition-colors hover:bg-white",
                showCalendar && "border-teal-500 bg-white ring-2 ring-teal-100"
              )}
            >
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                {format(feedingDate, "EEE, MMM d, yyyy")}
              </span>
              {showCalendar ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>
          </FormField>

          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:col-span-2">
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
        </div>
      </FormSection>

      <FormSection step={2} icon={Wheat} title="Quantity" description="Feed given per bird for this day.">
        <div className="space-y-3">
          <FormField label="Actual quantity per bird (grams)" required htmlFor="actual_quantity">
            <div className="relative">
              <Wheat className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="actual_quantity"
                type="number"
                min="0"
                step="0.1"
                value={formData.actual_quantity}
                onChange={(e) => handleInputChange("actual_quantity", e.target.value)}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
          <FormSummary
            label={`Total (${totalDailyQuantityPerBird.toFixed(1)}g × ${flockQuantity} birds)`}
            value={`${(totalDailyQuantity / 1000).toFixed(2)} kg`}
          />
        </div>
      </FormSection>

      <FormSection
        step={3}
        icon={Clock}
        title="Feeding times"
        description="Split the daily ration across feeding times (must total 100%)."
        action={
          <Button type="button" variant="outline" size="sm" onClick={addFeedingTime} className="h-8 rounded-xl">
            <Plus className="mr-1 h-4 w-4" />
            Add Time
          </Button>
        }
      >
        <div className="space-y-2">
          {feedingTimes.map((ft, index) => (
            <div key={index} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <FormField label="Time" className="flex-1">
                <Input
                  type="time"
                  value={ft.time}
                  onChange={(e) => updateFeedingTime(index, "time", e.target.value)}
                  className={formInputClass(false, "bg-white")}
                />
              </FormField>
              <FormField label="Percentage (%)" className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={ft.percentage}
                  onChange={(e) => updateFeedingTime(index, "percentage", Number(e.target.value))}
                  className={formInputClass(false, "bg-white")}
                />
              </FormField>
              {feedingTimes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeedingTime(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          ))}
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
              percentageOk
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            <span>Total percentage</span>
            <span className="font-semibold">{totalPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </FormSection>

      <FormSection step={4} icon={StickyNote} title="Notes" description="Any observations about this feeding.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            rows={3}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default ImplementFeedingScheduleModal
