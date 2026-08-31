import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Weight,
  Bird,
  Ruler,
  StickyNote,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { WeightReport, FlockRecord, DetailedFlockRecord } from "@/lib/types"

interface AddWeightReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: Omit<WeightReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<void>
  flock?: FlockRecord | DetailedFlockRecord
}

interface WeightReportFormData {
  farm_id: number
  flock_id: number
  average_weight: number
  min_weight: number
  max_weight: number
  number_of_birds: number
  sample_size: number
  report_date: string
  notes: string
}

const AddWeightReportModal = ({ isOpen, onClose, onSubmit, flock }: AddWeightReportModalProps) => {
  // Use backend-computed current bird count when available
  const getCurrentBirdCount = () => {
    if (!flock) return 0
    if ('actual_quantity' in flock && flock.actual_quantity != null) {
      return flock.actual_quantity
    }
    const mortalityReports = (flock as DetailedFlockRecord).mortality_reports
    if (mortalityReports) {
      const totalMortality = mortalityReports.reduce((sum: number, report) => sum + report.mortality_count, 0)
      return flock.quantity - totalMortality
    }
    return flock.quantity
  }

  const currentBirdCount = getCurrentBirdCount()

  const [formData, setFormData] = useState<WeightReportFormData>({
    farm_id: flock?.farm_id || 0,
    flock_id: flock?.id || 0,
    average_weight: 0,
    min_weight: 0,
    max_weight: 0,
    number_of_birds: currentBirdCount,
    sample_size: 0,
    report_date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)

  const handleInputChange = (field: keyof WeightReportFormData, value: string | number) => {
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
      setFormData(prev => ({ ...prev, report_date: formattedDate }))
      setShowCalendar(false)
      if (errors.report_date) {
        setErrors(prev => {
          const { report_date: _, ...rest } = prev
          return rest
        })
      }
    }
  }

  // Remove auto-calculation of average weight - it should be manually input

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.average_weight <= 0) newErrors.average_weight = "Average weight must be greater than 0"
    if (formData.min_weight <= 0) newErrors.min_weight = "Minimum weight must be greater than 0"
    if (formData.max_weight <= 0) newErrors.max_weight = "Maximum weight must be greater than 0"
    if (formData.min_weight > formData.max_weight) newErrors.max_weight = "Maximum weight must be greater than minimum weight"
    if (formData.sample_size <= 0) newErrors.sample_size = "Sample size must be greater than 0"
    if (formData.sample_size > formData.number_of_birds) newErrors.sample_size = `Sample size cannot exceed bird count (${formData.number_of_birds})`
    if (formData.number_of_birds <= 0) newErrors.number_of_birds = "Number of birds must be greater than 0"
    if (!formData.report_date) newErrors.report_date = "Date is required"

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
        recorded_by: 1 // This should come from user context in the future
      }
      await onSubmit(recordData)
      // Reset form on successful submission
      setFormData({
        farm_id: flock?.farm_id || 0,
        flock_id: flock?.id || 0,
        average_weight: 0,
        min_weight: 0,
        max_weight: 0,
        number_of_birds: currentBirdCount,
        sample_size: 0,
        report_date: new Date().toISOString().split('T')[0],
        notes: ""
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating weight report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        farm_id: flock?.farm_id || 0,
        flock_id: flock?.id || 0,
        average_weight: 0,
        min_weight: 0,
        max_weight: 0,
        number_of_birds: currentBirdCount,
        sample_size: 0,
        report_date: new Date().toISOString().split('T')[0],
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
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Weight Report</DialogTitle>
            <DialogDescription className="text-orange-100">
              Record weight data for this flock. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Date Picker (inline calendar) ── */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
              Report Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.report_date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-orange-500 ring-2 ring-orange-100"
              )}
            >
              <span className={formData.report_date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.report_date
                  ? format(new Date(formData.report_date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                  : "Select date"}
              </span>
              {showCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={formData.report_date ? new Date(formData.report_date + 'T12:00:00') : undefined}
                  onSelect={handleDateChange}
                />
              </div>
            )}
            {errors.report_date && <p className="text-xs text-red-500">{errors.report_date}</p>}
          </div>

          {/* ── Weight Measurements Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Weight className="h-4 w-4 text-orange-500" />
              Weight Measurements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="min_weight" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-blue-400" />
                  Min Weight (kg) *
                </Label>
                <Input id="min_weight" type="number" step="0.01" min="0.01" value={formData.min_weight} onChange={(e) => handleInputChange("min_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={cn("h-9 text-sm", errors.min_weight && "border-red-400")} />
                {errors.min_weight && <p className="text-xs text-red-500">{errors.min_weight}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="max_weight" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-red-400" />
                  Max Weight (kg) *
                </Label>
                <Input id="max_weight" type="number" step="0.01" min="0.01" value={formData.max_weight} onChange={(e) => handleInputChange("max_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={cn("h-9 text-sm", errors.max_weight && "border-red-400")} />
                {errors.max_weight && <p className="text-xs text-red-500">{errors.max_weight}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="average_weight" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-orange-400" />
                  Average Weight (kg) *
                </Label>
                <Input id="average_weight" type="number" step="0.01" min="0.01" value={formData.average_weight} onChange={(e) => handleInputChange("average_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={cn("h-9 text-sm", errors.average_weight && "border-red-400")} />
                {errors.average_weight && <p className="text-xs text-red-500">{errors.average_weight}</p>}
              </div>
            </div>
          </div>

          {/* ── Sampling Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Bird className="h-4 w-4 text-blue-500" />
              Sampling Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sample_size" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Bird className="h-3.5 w-3.5 text-blue-400" />
                  Sample Size *
                </Label>
                <Input id="sample_size" type="number" min="1" max={formData.number_of_birds} value={formData.sample_size} onChange={(e) => handleInputChange("sample_size", parseInt(e.target.value) || 0)} placeholder="Enter sample size" className={cn("h-9 text-sm", errors.sample_size && "border-red-400")} />
                {errors.sample_size && <p className="text-xs text-red-500">{errors.sample_size}</p>}
                <p className="text-xs text-gray-500">Birds weighed (max: {formData.number_of_birds})</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="number_of_birds" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Bird className="h-3.5 w-3.5 text-green-400" />
                  Current Bird Count
                </Label>
                <Input id="number_of_birds" type="number" value={formData.number_of_birds} disabled className="h-9 text-sm bg-gray-50" />
                <p className="text-xs text-gray-500">Original: {flock?.quantity || 0}, after mortality: {currentBirdCount}</p>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Enter any additional notes about this weight report" rows={3} className="resize-none" />
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddWeightReportModal
