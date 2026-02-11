import { useState, useEffect } from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { feedingScheduleItem, FeedingTimeEntry } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import { createFeedingBatchItem } from "@/lib/request"

interface ImplementFeedingScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleItem: feedingScheduleItem
  batchScheduleId: number
  flockQuantity: number
  onSuccess?: () => void
}

const ImplementFeedingScheduleModal = ({
  open,
  onOpenChange,
  scheduleItem,
  batchScheduleId,
  flockQuantity,
  onSuccess,
}: ImplementFeedingScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [feedingDate, setFeedingDate] = useState<Date>(new Date())
  const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  
  const [formData, setFormData] = useState({
    actual_quantity: scheduleItem.quantity?.toString() || "",
    status: "completed" as "scheduled" | "completed" | "missed",
    notes: "",
  })

  const [feedingTimes, setFeedingTimes] = useState<FeedingTimeEntry[]>(
    scheduleItem.feeding_times || [{ time: "08:00", percentage: 100 }]
  )

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        actual_quantity: scheduleItem.quantity?.toString() || "",
        status: "completed",
        notes: "",
      })
      setFeedingDate(new Date())
      setFeedingTimes(scheduleItem.feeding_times || [{ time: "08:00", percentage: 100 }])
    }
  }, [open, scheduleItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate feeding times total to 100%
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Implement Feeding Schedule</DialogTitle>
          <DialogDescription>
            Record the details of the feeding for Day {scheduleItem.feeding_day}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feeding Date */}
          <div className="space-y-2">
            <Label>Feeding Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !feedingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {feedingDate ? format(feedingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={feedingDate} onSelect={(date) => date && setFeedingDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quantity Information */}
          <div className="space-y-2">
            <Label htmlFor="actual_quantity">Actual Quantity per Bird (grams) *</Label>
            <Input
              id="actual_quantity"
              type="number"
              min="0"
              step="0.1"
              value={formData.actual_quantity}
              onChange={(e) => handleInputChange("actual_quantity", e.target.value)}
              placeholder="e.g., 50"
            />
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="font-semibold mb-1">Total Quantity Calculation:</div>
              <div className="space-y-1">
                <div>Per Bird: <span className="font-bold">{totalDailyQuantityPerBird.toFixed(1)} grams</span></div>
                <div>Flock Size: <span className="font-bold">{flockQuantity} birds</span></div>
                <div className="text-blue-700 font-bold">Total: {(totalDailyQuantity / 1000).toFixed(2)} kg</div>
              </div>
            </div>
          </div>

          {/* Feeding Times */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Feeding Times & Distribution</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeedingTime}
                className="h-8"
              >
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
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={ft.percentage}
                      onChange={(e) => updateFeedingTime(index, "percentage", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600">Quantity</Label>
                    <div className="mt-1 text-sm font-semibold text-gray-700 p-2 bg-white rounded border">
                      {((totalDailyQuantity * Number(ft.percentage)) / 100 / 1000).toFixed(2)} kg
                    </div>
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

            <div className={cn(
              "text-sm p-2 rounded-lg border",
              Math.abs(totalPercentage - 100) < 0.01 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            )}>
              Total Percentage: <span className="font-bold">{totalPercentage.toFixed(1)}%</span>
              {Math.abs(totalPercentage - 100) >= 0.01 && " (Must equal 100%)"}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any observations about feed quality, bird appetite, etc..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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
