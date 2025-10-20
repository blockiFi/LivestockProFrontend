import { useState, useEffect } from "react"
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
import type { MortalityReport, FlockRecord } from "@/lib/types"

interface AddMortalityRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  flock?: FlockRecord
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
    bird_count: 0, // Will be set from flock quantity
    date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate current bird count by subtracting total mortality from original quantity
  const totalMortality = mortalityReports.reduce((sum, report) => sum + report.mortality_count, 0)
  const currentBirdCount = (flock?.quantity || 0) - totalMortality

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
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, date: formattedDate }))
      if (errors.date) {
        setErrors(prev => {
          const { date: _, ...rest } = prev
          return rest
        })
      }
    }
  }

  // Automatically calculate mortality percentage when mortality count or current bird count changes
  useEffect(() => {
    if (currentBirdCount > 0 && formData.mortality_count > 0) {
      const percentage = (formData.mortality_count / currentBirdCount) * 100
      setFormData(prev => ({ ...prev, mortality_percentage: percentage }))
    } else {
      setFormData(prev => ({ ...prev, mortality_percentage: 0 }))
    }
  }, [formData.mortality_count, currentBirdCount])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.mortality_count <= 0) newErrors.mortality_count = "Mortality count must be greater than 0"
    if (formData.mortality_count > currentBirdCount) newErrors.mortality_count = `Mortality count cannot exceed current bird count (${currentBirdCount})`
    if (formData.average_weight <= 0) newErrors.average_weight = "Average weight must be greater than 0"
    if (currentBirdCount <= 0) newErrors.bird_count = "Current bird count must be greater than 0"
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
        bird_count: currentBirdCount,
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
        bird_count: 0, // Will be set from flock quantity
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
        bird_count: 0, // Will be set from flock quantity
        date: new Date().toISOString().split('T')[0],
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
          <DialogTitle>Add Mortality Record</DialogTitle>
          <DialogDescription>
            Record mortality data for this flock. All fields marked with * are required.
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
                      !formData.date && "text-muted-foreground",
                      errors.date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Mortality Count */}
            <div className="space-y-2">
              <Label htmlFor="mortality_count">Mortality Count *</Label>
              <Input
                id="mortality_count"
                type="number"
                min="1"
                max={currentBirdCount > 0 ? currentBirdCount : undefined}
                value={formData.mortality_count}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleInputChange("mortality_count", value)
                }}
                placeholder={`Enter mortality count (max: ${currentBirdCount})`}
                className={errors.mortality_count ? "border-red-500" : ""}
              />
              {errors.mortality_count && <p className="text-sm text-red-500">{errors.mortality_count}</p>}
              {currentBirdCount > 0 && (
                <p className="text-xs text-gray-500">Maximum mortality count: {currentBirdCount}</p>
              )}
            </div>

            {/* Bird Count (Display Only) */}
            <div className="space-y-2">
              <Label htmlFor="bird_count">Current Bird Count</Label>
              <Input
                id="bird_count"
                type="number"
                value={currentBirdCount}
                disabled
                placeholder="From flock data"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Original quantity ({flock?.quantity || 0}) minus total mortality ({totalMortality})</p>
              {errors.bird_count && <p className="text-sm text-red-500">{errors.bird_count}</p>}
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

            {/* Mortality Percentage (Auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="mortality_percentage">Mortality Percentage</Label>
              <Input
                id="mortality_percentage"
                type="number"
                step="0.01"
                value={formData.mortality_percentage.toFixed(2)}
                disabled
                placeholder="Auto-calculated"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Automatically calculated from mortality count and bird count</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes about this mortality record"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
