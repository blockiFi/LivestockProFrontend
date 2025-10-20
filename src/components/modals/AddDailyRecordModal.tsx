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

interface AddDailyRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: DailyRecordFormData) => Promise<void>
  flockId: number
  poultryType: string
}

interface DailyRecordFormData {
  flock_id: number
  date: string
  mortality: number
  culls: number
  feed_consumed_kg: number
  water_consumed_liters: number
  avg_weight_grams: number
  min_temperature: number
  max_temperature: number
  humidity: number
  light_hours: number
  eggs_collected: number
  eggs_broken: number
  notes: string
}

const AddDailyRecordModal = ({ isOpen, onClose, onSubmit, flockId, poultryType }: AddDailyRecordModalProps) => {
  const [formData, setFormData] = useState<DailyRecordFormData>({
    flock_id: flockId,
    date: format(new Date(), 'yyyy-MM-dd'),
    mortality: 0,
    culls: 0,
    feed_consumed_kg: 0,
    water_consumed_liters: 0,
    avg_weight_grams: 0,
    min_temperature: 0,
    max_temperature: 0,
    humidity: 0,
    light_hours: 0,
    eggs_collected: 0,
    eggs_broken: 0,
    notes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof DailyRecordFormData, value: string | number) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = "Record date is required"
    if (formData.mortality < 0) newErrors.mortality = "Mortality cannot be negative"
    if (formData.culls < 0) newErrors.culls = "Culls cannot be negative"
    if (formData.feed_consumed_kg < 0) newErrors.feed_consumed_kg = "Feed consumed cannot be negative"
    if (formData.water_consumed_liters < 0) newErrors.water_consumed_liters = "Water consumed cannot be negative"
    if (formData.avg_weight_grams < 0) newErrors.avg_weight_grams = "Average weight cannot be negative"
    if (formData.humidity < 0 || formData.humidity > 100) newErrors.humidity = "Humidity must be between 0 and 100"
    if (formData.light_hours < 0 || formData.light_hours > 24) newErrors.light_hours = "Light hours must be between 0 and 24"
    
    // Only validate egg fields for non-broiler types
    if (poultryType.toLowerCase() !== "broiler") {
      if (formData.eggs_collected < 0) newErrors.eggs_collected = "Eggs collected cannot be negative"
      if (formData.eggs_broken < 0) newErrors.eggs_broken = "Eggs broken cannot be negative"
      if (formData.eggs_broken > formData.eggs_collected) newErrors.eggs_broken = "Eggs broken cannot exceed eggs collected"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form and close modal only on successful submission
      setFormData({
        flock_id: flockId,
        date: format(new Date(), 'yyyy-MM-dd'),
        mortality: 0,
        culls: 0,
        feed_consumed_kg: 0,
        water_consumed_liters: 0,
        avg_weight_grams: 0,
        min_temperature: 0,
        max_temperature: 0,
        humidity: 0,
        light_hours: 0,
        eggs_collected: 0,
        eggs_broken: 0,
        notes: ""
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating daily record:", error)
      // Don't close the modal on error so user can fix the issue
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        flock_id: flockId,
        date: format(new Date(), 'yyyy-MM-dd'),
        mortality: 0,
        culls: 0,
        feed_consumed_kg: 0,
        water_consumed_liters: 0,
        avg_weight_grams: 0,
        min_temperature: 0,
        max_temperature: 0,
        humidity: 0,
        light_hours: 0,
        eggs_collected: 0,
        eggs_broken: 0,
        notes: ""
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) {
        handleClose()
      }
    }}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Daily Record</DialogTitle>
          <DialogDescription>
            Record daily metrics for your flock. All fields are optional except the date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Record Date */}
          <div className="space-y-2">
            <Label>Record Date *</Label>
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
                  {formData.date ? format(new Date(formData.date), "PPP") : "Select record date"}
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

          {/* Mortality and Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mortality">Mortality Count</Label>
              <Input
                id="mortality"
                type="number"
                min="0"
                value={formData.mortality}
                onChange={(e) => handleInputChange("mortality", parseInt(e.target.value) || 0)}
                placeholder="Number of dead birds"
                className={errors.mortality ? "border-red-500" : ""}
              />
              {errors.mortality && <p className="text-sm text-red-500">{errors.mortality}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="culls">Culls Count</Label>
              <Input
                id="culls"
                type="number"
                min="0"
                value={formData.culls}
                onChange={(e) => handleInputChange("culls", parseInt(e.target.value) || 0)}
                placeholder="Number of culled birds"
                className={errors.culls ? "border-red-500" : ""}
              />
              {errors.culls && <p className="text-sm text-red-500">{errors.culls}</p>}
            </div>
          </div>

          {/* Feed and Water Consumption */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed_consumed_kg">Feed Consumed (kg)</Label>
              <Input
                id="feed_consumed_kg"
                type="number"
                min="0"
                step="0.1"
                value={formData.feed_consumed_kg}
                onChange={(e) => handleInputChange("feed_consumed_kg", parseFloat(e.target.value) || 0)}
                placeholder="Feed consumed in kg"
                className={errors.feed_consumed_kg ? "border-red-500" : ""}
              />
              {errors.feed_consumed_kg && <p className="text-sm text-red-500">{errors.feed_consumed_kg}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="water_consumed_liters">Water Consumed (L)</Label>
              <Input
                id="water_consumed_liters"
                type="number"
                min="0"
                step="0.1"
                value={formData.water_consumed_liters}
                onChange={(e) => handleInputChange("water_consumed_liters", parseFloat(e.target.value) || 0)}
                placeholder="Water consumed in liters"
                className={errors.water_consumed_liters ? "border-red-500" : ""}
              />
              {errors.water_consumed_liters && <p className="text-sm text-red-500">{errors.water_consumed_liters}</p>}
            </div>
          </div>

          {/* Weight and Environmental */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_weight_grams">Average Weight (g)</Label>
              <Input
                id="avg_weight_grams"
                type="number"
                min="0"
                value={formData.avg_weight_grams}
                onChange={(e) => handleInputChange("avg_weight_grams", parseInt(e.target.value) || 0)}
                placeholder="Average weight in grams"
                className={errors.avg_weight_grams ? "border-red-500" : ""}
              />
              {errors.avg_weight_grams && <p className="text-sm text-red-500">{errors.avg_weight_grams}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                min="0"
                max="100"
                value={formData.humidity}
                onChange={(e) => handleInputChange("humidity", parseInt(e.target.value) || 0)}
                placeholder="Humidity percentage"
                className={errors.humidity ? "border-red-500" : ""}
              />
              {errors.humidity && <p className="text-sm text-red-500">{errors.humidity}</p>}
            </div>
          </div>

          {/* Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_temperature">Min Temperature (°C)</Label>
              <Input
                id="min_temperature"
                type="number"
                step="0.1"
                value={formData.min_temperature}
                onChange={(e) => handleInputChange("min_temperature", parseFloat(e.target.value) || 0)}
                placeholder="Minimum temperature"
                className={errors.min_temperature ? "border-red-500" : ""}
              />
              {errors.min_temperature && <p className="text-sm text-red-500">{errors.min_temperature}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_temperature">Max Temperature (°C)</Label>
              <Input
                id="max_temperature"
                type="number"
                step="0.1"
                value={formData.max_temperature}
                onChange={(e) => handleInputChange("max_temperature", parseFloat(e.target.value) || 0)}
                placeholder="Maximum temperature"
                className={errors.max_temperature ? "border-red-500" : ""}
              />
              {errors.max_temperature && <p className="text-sm text-red-500">{errors.max_temperature}</p>}
            </div>
          </div>

          {/* Light Hours and Egg Production */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="light_hours">Light Hours</Label>
              <Input
                id="light_hours"
                type="number"
                min="0"
                max="24"
                step="0.1"
                value={formData.light_hours}
                onChange={(e) => handleInputChange("light_hours", parseFloat(e.target.value) || 0)}
                placeholder="Hours of light"
                className={errors.light_hours ? "border-red-500" : ""}
              />
              {errors.light_hours && <p className="text-sm text-red-500">{errors.light_hours}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggs_collected">Eggs Collected</Label>
              <Input
                id="eggs_collected"
                type="number"
                min="0"
                value={formData.eggs_collected}
                onChange={(e) => handleInputChange("eggs_collected", parseInt(e.target.value) || 0)}
                placeholder="Number of eggs collected"
                className={errors.eggs_collected ? "border-red-500" : ""}
              />
              {errors.eggs_collected && <p className="text-sm text-red-500">{errors.eggs_collected}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggs_broken">Eggs Broken</Label>
              <Input
                id="eggs_broken"
                type="number"
                min="0"
                value={formData.eggs_broken}
                onChange={(e) => handleInputChange("eggs_broken", parseInt(e.target.value) || 0)}
                placeholder="Number of broken eggs"
                className={errors.eggs_broken ? "border-red-500" : ""}
              />
              {errors.eggs_broken && <p className="text-sm text-red-500">{errors.eggs_broken}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional observations or notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddDailyRecordModal
