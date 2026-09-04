import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Egg,
  Loader2,
  Percent,
  StickyNote,
  Weight,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { EggReport, FlockRecord, DetailedFlockRecord } from "@/lib/types"
import type { EggReportPayload } from "@/lib/request"
import { getBirdCountOnDate } from "@/lib/flock-birds"

interface AddEggRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: EggReportPayload) => Promise<void>
  flock?: FlockRecord | DetailedFlockRecord
  initialReport?: EggReport
}

interface EggRecordFormData {
  flock_id: number
  date: string
  eggs_collected: number
  eggs_broken: number
  average_egg_weight: number
  notes: string
}

const AddEggRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  flock,
  initialReport,
}: AddEggRecordModalProps) => {
  const isEditMode = Boolean(initialReport)
  const mortalityReports = (flock as DetailedFlockRecord | undefined)?.mortality_reports
  const dailyRecords = (flock as DetailedFlockRecord | undefined)?.daily_records

  const getBirdCountForDate = (date: string) => {
    if (!flock) return 0
    if ("actual_quantity" in flock && flock.actual_quantity != null && !date) {
      return flock.actual_quantity
    }
    return getBirdCountOnDate(flock.quantity, date, {
      mortalityReports,
      dailyRecords,
    })
  }

  const buildFormData = (report?: EggReport): EggRecordFormData => ({
    flock_id: flock?.id || report?.flock_id || 0,
    date: report?.date?.slice(0, 10) || new Date().toISOString().split("T")[0],
    eggs_collected: report?.eggs_collected ?? 0,
    eggs_broken: report?.eggs_broken ?? 0,
    average_egg_weight: report?.average_egg_weight ?? 0,
    notes: report?.notes ?? "",
  })

  const [formData, setFormData] = useState<EggRecordFormData>(buildFormData(initialReport))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(buildFormData(initialReport))
      setErrors({})
      setShowCalendar(false)
    }
  }, [isOpen, initialReport, flock?.id])

  const birdCount = useMemo(
    () => getBirdCountForDate(formData.date),
    [formData.date, flock, mortalityReports, dailyRecords]
  )

  const previewProductionPct = useMemo(() => {
    if (birdCount <= 0) return 0
    return Math.round((formData.eggs_collected / birdCount) * 10000) / 100
  }, [birdCount, formData.eggs_collected])

  const handleInputChange = (field: keyof EggRecordFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    const validDate = new Date(date)
    validDate.setHours(12, 0, 0, 0)
    const formattedDate = format(validDate, "yyyy-MM-dd")
    setFormData((prev) => ({ ...prev, date: formattedDate }))
    setShowCalendar(false)
    if (errors.date) {
      setErrors((prev) => {
        const { date: _, ...rest } = prev
        return rest
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const today = new Date().toISOString().split("T")[0]

    if (!formData.date) newErrors.date = "Date is required"
    if (formData.date > today) newErrors.date = "Date cannot be in the future"
    if (formData.eggs_collected < 0) newErrors.eggs_collected = "Eggs collected cannot be negative"
    if (formData.eggs_broken < 0) newErrors.eggs_broken = "Broken eggs cannot be negative"
    if (formData.eggs_broken > formData.eggs_collected) {
      newErrors.eggs_broken = "Broken eggs cannot exceed eggs collected"
    }
    if (formData.average_egg_weight < 0) newErrors.average_egg_weight = "Average egg weight cannot be negative"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        flock_id: formData.flock_id,
        date: formData.date,
        eggs_collected: formData.eggs_collected,
        eggs_broken: formData.eggs_broken,
        average_egg_weight: formData.average_egg_weight || undefined,
        notes: formData.notes || undefined,
      })
      onClose()
    } catch (error) {
      console.error("Error saving egg report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(buildFormData())
      setErrors({})
      setShowCalendar(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) handleClose()
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-emerald-600 to-amber-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {isEditMode ? "Edit Egg Report" : "Add Egg Report"}
            </DialogTitle>
            <DialogDescription className="text-emerald-100">
              Record daily egg collection for this flock. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              Report Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-emerald-500 ring-2 ring-emerald-100"
              )}
            >
              <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.date
                  ? format(new Date(`${formData.date}T12:00:00`), "EEEE, MMMM d, yyyy")
                  : "Select date"}
              </span>
              {showCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(`${formData.date}T12:00:00`) : undefined}
                  onSelect={handleDateChange}
                  disabled={(date) => date > new Date()}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Egg className="h-4 w-4 text-amber-500" />
              Production
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="eggs_collected" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Egg className="h-3.5 w-3.5 text-amber-400" />
                  Eggs Collected *
                </Label>
                <Input
                  id="eggs_collected"
                  type="number"
                  min="0"
                  value={formData.eggs_collected}
                  onChange={(e) => handleInputChange("eggs_collected", parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className={cn("h-9 text-sm", errors.eggs_collected && "border-red-400")}
                />
                {errors.eggs_collected && <p className="text-xs text-red-500">{errors.eggs_collected}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="eggs_broken" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  Broken Eggs
                </Label>
                <Input
                  id="eggs_broken"
                  type="number"
                  min="0"
                  value={formData.eggs_broken}
                  onChange={(e) => handleInputChange("eggs_broken", parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className={cn("h-9 text-sm", errors.eggs_broken && "border-red-400")}
                />
                {errors.eggs_broken && <p className="text-xs text-red-500">{errors.eggs_broken}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="average_egg_weight" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-emerald-400" />
                  Avg Egg Weight (g)
                </Label>
                <Input
                  id="average_egg_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.average_egg_weight}
                  onChange={(e) => handleInputChange("average_egg_weight", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={cn("h-9 text-sm", errors.average_egg_weight && "border-red-400")}
                />
                {errors.average_egg_weight && <p className="text-xs text-red-500">{errors.average_egg_weight}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">Bird count on date</p>
                <p className="text-lg font-semibold text-gray-900">{birdCount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <Percent className="h-3 w-3" />
                  Hen-day production
                </p>
                <p className="text-lg font-semibold text-emerald-700">{previewProductionPct.toFixed(2)}%</p>
              </div>
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
              placeholder="Optional notes about this collection"
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : isEditMode ? "Update Report" : "Create Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddEggRecordModal
