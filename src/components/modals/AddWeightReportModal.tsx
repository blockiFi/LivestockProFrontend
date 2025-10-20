import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
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
  // Calculate current bird count accounting for mortality
  const getCurrentBirdCount = () => {
    if (!flock) return 0
    // Check if flock has mortality_reports (DetailedFlockRecord)
    const mortalityReports = (flock as DetailedFlockRecord).mortality_reports
    if (mortalityReports) {
      const totalMortality = mortalityReports.reduce((sum: number, report) => sum + report.mortality_count, 0)
      return flock.quantity - totalMortality
    }
    return flock.quantity // If no mortality data available, return original quantity
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
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, report_date: formattedDate }))
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
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Weight Report</DialogTitle>
          <DialogDescription>
            Record weight data for this flock. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.report_date && "text-muted-foreground",
                      errors.report_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.report_date ? format(new Date(formData.report_date), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.report_date ? new Date(formData.report_date) : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.report_date && <p className="text-sm text-red-500">{errors.report_date}</p>}
            </div>

            {/* Sample Size */}
            <div className="space-y-2">
              <Label htmlFor="sample_size">Sample Size *</Label>
              <Input
                id="sample_size"
                type="number"
                min="1"
                max={formData.number_of_birds}
                value={formData.sample_size}
                onChange={(e) => handleInputChange("sample_size", parseInt(e.target.value) || 0)}
                placeholder="Enter sample size"
                className={errors.sample_size ? "border-red-500" : ""}
              />
              {errors.sample_size && <p className="text-sm text-red-500">{errors.sample_size}</p>}
              <p className="text-xs text-gray-500">Number of birds weighed (max: {formData.number_of_birds})</p>
            </div>

            {/* Min Weight */}
            <div className="space-y-2">
              <Label htmlFor="min_weight">Minimum Weight (kg) *</Label>
              <Input
                id="min_weight"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.min_weight}
                onChange={(e) => handleInputChange("min_weight", parseFloat(e.target.value) || 0)}
                placeholder="Enter minimum weight"
                className={errors.min_weight ? "border-red-500" : ""}
              />
              {errors.min_weight && <p className="text-sm text-red-500">{errors.min_weight}</p>}
            </div>

            {/* Max Weight */}
            <div className="space-y-2">
              <Label htmlFor="max_weight">Maximum Weight (kg) *</Label>
              <Input
                id="max_weight"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.max_weight}
                onChange={(e) => handleInputChange("max_weight", parseFloat(e.target.value) || 0)}
                placeholder="Enter maximum weight"
                className={errors.max_weight ? "border-red-500" : ""}
              />
              {errors.max_weight && <p className="text-sm text-red-500">{errors.max_weight}</p>}
            </div>

            {/* Average Weight */}
            <div className="space-y-2">
              <Label htmlFor="average_weight">Average Weight (kg) *</Label>
              <Input
                id="average_weight"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.average_weight}
                onChange={(e) => handleInputChange("average_weight", parseFloat(e.target.value) || 0)}
                placeholder="Enter average weight"
                className={errors.average_weight ? "border-red-500" : ""}
              />
              {errors.average_weight && <p className="text-sm text-red-500">{errors.average_weight}</p>}
            </div>

            {/* Number of Birds (Display Only) */}
            <div className="space-y-2">
              <Label htmlFor="number_of_birds">Current Bird Count</Label>
              <Input
                id="number_of_birds"
                type="number"
                value={formData.number_of_birds}
                disabled
                placeholder="From flock data"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Current flock size (original: {flock?.quantity || 0}, after mortality: {currentBirdCount})
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes about this weight report"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
