import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Skull,
  Weight,
  Bird,
  TrendingDown,
  StickyNote,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { MortalityReport, FlockRecord, DetailedFlockRecord } from "@/lib/types"
import { getBirdCountOnDate } from "@/lib/flock-birds"

interface AddMortalityRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  flock?: FlockRecord | DetailedFlockRecord
  mortalityReports?: MortalityReport[]
}

interface MortalityRecordFormData {
  farm_id: number
  flock_id: number
  poultry_type_id: number
  mortality_count: number
  average_weight: number
  mortality_percentage: number
  bird_count: number
  date: string
  notes: string
}

const AddMortalityRecordModal = ({ isOpen, onClose, onSubmit, flock, mortalityReports = [] }: AddMortalityRecordModalProps) => {
  const [formData, setFormData] = useState<MortalityRecordFormData>({
    farm_id: flock?.farm_id || 0,
    flock_id: flock?.id || 0,
    poultry_type_id: flock?.poultry_type_id || 0,
    mortality_count: 0,
    average_weight: 0,
    mortality_percentage: 0,
    bird_count: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)

  const dailyRecords = (flock as DetailedFlockRecord | undefined)?.daily_records

  const birdCountOnDate = useMemo(() => {
    return getBirdCountOnDate(flock?.quantity || 0, formData.date, {
      mortalityReports,
      dailyRecords,
    })
  }, [dailyRecords, flock?.quantity, formData.date, mortalityReports])

  const handleInputChange = (field: keyof MortalityRecordFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      const formattedDate = format(validDate, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, date: formattedDate }))
      setShowCalendar(false)
      if (errors.date) {
        setErrors(prev => {
          const { date: _, ...rest } = prev
          return rest
        })
      }
    }
  }

  // Keep bird count + mortality % in sync with selected date and mortality count
  useEffect(() => {
    const percentage =
      birdCountOnDate > 0 && formData.mortality_count > 0
        ? (formData.mortality_count / birdCountOnDate) * 100
        : 0

    setFormData((prev) => ({
      ...prev,
      bird_count: birdCountOnDate,
      mortality_percentage: percentage,
    }))
  }, [birdCountOnDate, formData.mortality_count])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.mortality_count <= 0) newErrors.mortality_count = "Mortality count must be greater than 0"
    if (formData.mortality_count > birdCountOnDate) {
      newErrors.mortality_count = `Mortality count cannot exceed bird count on this date (${birdCountOnDate})`
    }
    if (formData.average_weight <= 0) newErrors.average_weight = "Average weight must be greater than 0"
    if (birdCountOnDate <= 0) newErrors.bird_count = "Bird count on this date must be greater than 0"
    if (!formData.date) newErrors.date = "Date is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const recordData = {
        ...formData,
        bird_count: birdCountOnDate,
        mortality_percentage:
          birdCountOnDate > 0 ? (formData.mortality_count / birdCountOnDate) * 100 : 0,
        recorded_by: 1 // This should come from user context in the future
      }
      await onSubmit(recordData)
      // Reset form on successful submission
      setFormData({
        farm_id: flock?.farm_id || 0,
        flock_id: flock?.id || 0,
        poultry_type_id: flock?.poultry_type_id || 0,
        mortality_count: 0,
        average_weight: 0,
        mortality_percentage: 0,
        bird_count: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ""
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating mortality record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        farm_id: flock?.farm_id || 0,
        flock_id: flock?.id || 0,
        poultry_type_id: flock?.poultry_type_id || 0,
        mortality_count: 0,
        average_weight: 0,
        mortality_percentage: 0,
        bird_count: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ""
      })
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
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Mortality Record</DialogTitle>
            <DialogDescription className="text-red-100">
              Record mortality data for this flock. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Date Picker (inline calendar, no Popover) ── */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-red-600" />
              Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-red-500 ring-2 ring-red-100"
              )}
            >
              <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.date
                  ? format(new Date(formData.date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                  : "Select date"}
              </span>
              {showCalendar
                ? <ChevronUp className="h-4 w-4 text-gray-500" />
                : <ChevronDown className="h-4 w-4 text-gray-500" />
              }
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date + 'T12:00:00') : undefined}
                  onSelect={handleDateChange}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* ── Mortality Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Skull className="h-4 w-4 text-red-500" />
              Mortality Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mortality_count" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Skull className="h-3.5 w-3.5 text-red-400" />
                  Mortality Count *
                </Label>
                <Input
                  id="mortality_count"
                  type="number"
                  min="1"
                  max={birdCountOnDate > 0 ? birdCountOnDate : undefined}
                  value={formData.mortality_count}
                  onChange={(e) => handleInputChange("mortality_count", parseInt(e.target.value) || 0)}
                  placeholder={`Enter mortality count (max: ${birdCountOnDate})`}
                  className={cn("h-9 text-sm", errors.mortality_count && "border-red-400")}
                />
                {errors.mortality_count && <p className="text-xs text-red-500">{errors.mortality_count}</p>}
                {birdCountOnDate > 0 && (
                  <p className="text-xs text-gray-500">Maximum on this date: {birdCountOnDate}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="average_weight" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-orange-400" />
                  Average Weight (kg) *
                </Label>
                <Input
                  id="average_weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.average_weight}
                  onChange={(e) => handleInputChange("average_weight", parseFloat(e.target.value) || 0)}
                  placeholder="Enter average weight"
                  className={cn("h-9 text-sm", errors.average_weight && "border-red-400")}
                />
                {errors.average_weight && <p className="text-xs text-red-500">{errors.average_weight}</p>}
              </div>
            </div>
          </div>

          {/* ── Flock Info Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Bird className="h-4 w-4 text-blue-500" />
              Flock Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bird_count" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Bird className="h-3.5 w-3.5 text-blue-400" />
                  Bird Count on Date
                </Label>
                <Input
                  id="bird_count"
                  type="number"
                  value={birdCountOnDate}
                  disabled
                  className="h-9 text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Arrival ({flock?.quantity || 0}) minus mortality/culls before {formData.date}
                </p>
                {errors.bird_count && <p className="text-xs text-red-500">{errors.bird_count}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="mortality_percentage" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  Mortality Percentage
                </Label>
                <Input
                  id="mortality_percentage"
                  type="number"
                  step="0.01"
                  value={formData.mortality_percentage.toFixed(2)}
                  disabled
                  className="h-9 text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-500">Auto-calculated from count &amp; bird count on date</p>
              </div>
            </div>
          </div>

          {/* ── Notes Section ── */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes about this mortality record"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMortalityRecordModal
