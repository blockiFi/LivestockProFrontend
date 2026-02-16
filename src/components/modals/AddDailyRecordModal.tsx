import { useState, useEffect, useCallback } from "react"
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
  Scissors,
  Wheat,
  Droplets,
  Weight,
  Thermometer,
  Sun,
  Egg,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getFeedingBatchItemByDate, getMortalityByFlockAndDate } from "@/lib/request"

interface AddDailyRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: DailyRecordFormData) => Promise<void>
  flockId: number
  flockQuantity: number
  farmId: number
  token: string
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

const initialFormState = (flockId: number): DailyRecordFormData => ({
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

const AddDailyRecordModal = ({ isOpen, onClose, onSubmit, flockId, flockQuantity, farmId, token, poultryType }: AddDailyRecordModalProps) => {
  const [formData, setFormData] = useState<DailyRecordFormData>(initialFormState(flockId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [feedLocked, setFeedLocked] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedPerBirdGrams, setFeedPerBirdGrams] = useState(0)
  const [existingMortality, setExistingMortality] = useState(0)
  const [mortalityLoading, setMortalityLoading] = useState(false)
  const [mortalityReportCount, setMortalityReportCount] = useState(0)

  const fetchBatchFeedData = useCallback(async (date: string) => {
    if (!token || !farmId || !flockId || !date) return
    setFeedLoading(true)
    try {
      const response = await getFeedingBatchItemByDate(token, farmId, flockId, date)
      if (response.success && response.data) {
        const item = response.data
        // actual_quantity is per bird in grams, multiply by flock count and convert to kg
        const perBirdGrams = item.actual_quantity ? parseFloat(item.actual_quantity) : 0
        const totalFeedKg = (perBirdGrams * flockQuantity) / 1000
        if (totalFeedKg > 0) {
          setFeedPerBirdGrams(perBirdGrams)
          setFormData(prev => ({ ...prev, feed_consumed_kg: parseFloat(totalFeedKg.toFixed(2)) }))
          setFeedLocked(true)
        } else {
          setFeedPerBirdGrams(0)
          setFeedLocked(false)
        }
      } else {
        setFeedPerBirdGrams(0)
        setFeedLocked(false)
      }
    } catch {
      setFeedLocked(false)
    } finally {
      setFeedLoading(false)
    }
  }, [token, farmId, flockId, flockQuantity])

  const fetchMortalityData = useCallback(async (date: string) => {
    if (!token || !farmId || !flockId || !date) return
    setMortalityLoading(true)
    try {
      const response = await getMortalityByFlockAndDate(token, farmId, flockId, date)
      if (response.success && response.data && response.data.total_mortality > 0) {
        setFormData(prev => ({ ...prev, mortality: response.data!.total_mortality }))
        setExistingMortality(response.data.total_mortality)
        setMortalityReportCount(response.data.report_count)
      } else {
        setExistingMortality(0)
        setMortalityReportCount(0)
      }
    } catch {
      setExistingMortality(0)
      setMortalityReportCount(0)
    } finally {
      setMortalityLoading(false)
    }
  }, [token, farmId, flockId])

  // Fetch batch feed data and mortality data when modal opens or date changes
  useEffect(() => {
    if (isOpen && formData.date) {
      fetchBatchFeedData(formData.date)
      fetchMortalityData(formData.date)
    }
    if (!isOpen) {
      setFeedLocked(false)
      setExistingMortality(0)
    }
  }, [isOpen, formData.date, fetchBatchFeedData, fetchMortalityData])

  const handleInputChange = (field: keyof DailyRecordFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      const formattedDate = format(validDate, 'yyyy-MM-dd')
      setFeedLocked(false)
      setFeedPerBirdGrams(0)
      setExistingMortality(0)
      setMortalityReportCount(0)
      setFormData(prev => ({ ...prev, date: formattedDate, feed_consumed_kg: 0, mortality: 0 }))
      setShowCalendar(false)
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
    if (formData.mortality < 0) newErrors.mortality = "Cannot be negative"
    if (formData.culls < 0) newErrors.culls = "Cannot be negative"
    if (formData.feed_consumed_kg < 0) newErrors.feed_consumed_kg = "Cannot be negative"
    if (formData.water_consumed_liters < 0) newErrors.water_consumed_liters = "Cannot be negative"
    if (formData.avg_weight_grams < 0) newErrors.avg_weight_grams = "Cannot be negative"
    if (formData.humidity < 0 || formData.humidity > 100) newErrors.humidity = "Must be 0–100"
    if (formData.light_hours < 0 || formData.light_hours > 24) newErrors.light_hours = "Must be 0–24"

    if (poultryType.toLowerCase() !== "broiler") {
      if (formData.eggs_collected < 0) newErrors.eggs_collected = "Cannot be negative"
      if (formData.eggs_broken < 0) newErrors.eggs_broken = "Cannot be negative"
      if (formData.eggs_broken > formData.eggs_collected) newErrors.eggs_broken = "Cannot exceed collected"
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
      setFormData(initialFormState(flockId))
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating daily record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormState(flockId))
      setErrors({})
      setShowCalendar(false)
      setFeedLocked(false)
      setFeedPerBirdGrams(0)
      setExistingMortality(0)
      setMortalityReportCount(0)
      onClose()
    }
  }

  const isLayerType = poultryType.toLowerCase() !== "broiler"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) handleClose()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Daily Record</DialogTitle>
            <DialogDescription className="text-blue-100">
              Record daily metrics for your flock. All fields are optional except the date.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Date Picker (inline calendar, no Popover) ── */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              Record Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-blue-500 ring-2 ring-blue-100"
              )}
            >
              <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.date
                  ? format(new Date(formData.date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                  : "Select a date"}
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
                  onSelect={handleDateSelect}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* ── Health Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Skull className="h-4 w-4 text-red-500" />
              Health &amp; Mortality
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mortality" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Skull className="h-3.5 w-3.5 text-red-400" />
                  Mortality
                </Label>
                <div className="relative">
                  <Input
                    id="mortality"
                    type="number"
                    min={0}
                    value={formData.mortality}
                    onChange={(e) => handleInputChange("mortality", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    disabled={mortalityLoading}
                    className={cn(
                      "h-9 text-sm",
                      errors.mortality && "border-red-400 focus-visible:ring-red-300",
                      existingMortality > 0 && "border-amber-300"
                    )}
                  />
                  {mortalityLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    </div>
                  )}
                </div>
                {existingMortality > 0 && (
                  <div className="space-y-1 mt-1">
                    <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                      <span className="font-semibold">Existing records:</span>{" "}
                      {existingMortality} total from {mortalityReportCount} report{mortalityReportCount !== 1 ? "s" : ""} today
                    </div>
                    {formData.mortality < existingMortality && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 flex items-center gap-1">
                        ⚠️ Lower than existing ({existingMortality}). The mortality record will be updated to {formData.mortality}.
                      </div>
                    )}
                    {formData.mortality > existingMortality && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1.5 flex items-center gap-1">
                        ℹ️ Higher than existing ({existingMortality}). A new record for the difference of {formData.mortality - existingMortality} will be created.
                      </div>
                    )}
                  </div>
                )}
                {errors.mortality && <p className="text-xs text-red-500">{errors.mortality}</p>}
              </div>
              <FieldInput
                id="culls"
                label="Culls"
                icon={<Scissors className="h-3.5 w-3.5 text-orange-400" />}
                type="number"
                min={0}
                value={formData.culls}
                onChange={(v) => handleInputChange("culls", parseInt(v) || 0)}
                error={errors.culls}
                placeholder="0"
              />
            </div>
          </div>

          {/* ── Feed & Water Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              Feed &amp; Water
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="feed_consumed_kg" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Wheat className="h-3.5 w-3.5 text-amber-400" />
                  Feed Consumed (kg)
                  {feedLocked && <Lock className="h-3 w-3 text-amber-600" />}
                </Label>
                <div className="relative">
                  <Input
                    id="feed_consumed_kg"
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.feed_consumed_kg}
                    onChange={(e) => handleInputChange("feed_consumed_kg", parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    disabled={feedLocked || feedLoading}
                    className={cn(
                      "h-9 text-sm",
                      errors.feed_consumed_kg && "border-red-400 focus-visible:ring-red-300",
                      feedLocked && "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                    )}
                  />
                  {feedLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    </div>
                  )}
                </div>
                {feedLocked && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-1">
                    <span className="font-semibold">From feeding schedule:</span>{" "}
                    {feedPerBirdGrams}g per bird × {flockQuantity.toLocaleString()} birds = {formData.feed_consumed_kg} kg
                  </div>
                )}
                {errors.feed_consumed_kg && <p className="text-xs text-red-500">{errors.feed_consumed_kg}</p>}
              </div>
              <FieldInput
                id="water_consumed_liters"
                label="Water Consumed (L)"
                icon={<Droplets className="h-3.5 w-3.5 text-blue-400" />}
                type="number"
                min={0}
                step={0.1}
                value={formData.water_consumed_liters}
                onChange={(v) => handleInputChange("water_consumed_liters", parseFloat(v) || 0)}
                error={errors.water_consumed_liters}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* ── Weight & Environment Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-green-500" />
              Weight &amp; Environment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                id="avg_weight_grams"
                label="Avg Weight (g)"
                icon={<Weight className="h-3.5 w-3.5 text-green-400" />}
                type="number"
                min={0}
                value={formData.avg_weight_grams}
                onChange={(v) => handleInputChange("avg_weight_grams", parseInt(v) || 0)}
                error={errors.avg_weight_grams}
                placeholder="0"
              />
              <FieldInput
                id="humidity"
                label="Humidity (%)"
                icon={<Droplets className="h-3.5 w-3.5 text-teal-400" />}
                type="number"
                min={0}
                max={100}
                value={formData.humidity}
                onChange={(v) => handleInputChange("humidity", parseInt(v) || 0)}
                error={errors.humidity}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FieldInput
                id="min_temperature"
                label="Min Temp (°C)"
                icon={<Thermometer className="h-3.5 w-3.5 text-blue-400" />}
                type="number"
                step={0.1}
                value={formData.min_temperature}
                onChange={(v) => handleInputChange("min_temperature", parseFloat(v) || 0)}
                error={errors.min_temperature}
                placeholder="0"
              />
              <FieldInput
                id="max_temperature"
                label="Max Temp (°C)"
                icon={<Thermometer className="h-3.5 w-3.5 text-red-400" />}
                type="number"
                step={0.1}
                value={formData.max_temperature}
                onChange={(v) => handleInputChange("max_temperature", parseFloat(v) || 0)}
                error={errors.max_temperature}
                placeholder="0"
              />
              <FieldInput
                id="light_hours"
                label="Light Hours"
                icon={<Sun className="h-3.5 w-3.5 text-yellow-400" />}
                type="number"
                min={0}
                max={24}
                step={0.1}
                value={formData.light_hours}
                onChange={(v) => handleInputChange("light_hours", parseFloat(v) || 0)}
                error={errors.light_hours}
                placeholder="0"
              />
            </div>
          </div>

          {/* ── Egg Production Section (layers only) ── */}
          {isLayerType && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                <Egg className="h-4 w-4 text-yellow-600" />
                Egg Production
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  id="eggs_collected"
                  label="Eggs Collected"
                  icon={<Egg className="h-3.5 w-3.5 text-yellow-500" />}
                  type="number"
                  min={0}
                  value={formData.eggs_collected}
                  onChange={(v) => handleInputChange("eggs_collected", parseInt(v) || 0)}
                  error={errors.eggs_collected}
                  placeholder="0"
                />
                <FieldInput
                  id="eggs_broken"
                  label="Eggs Broken"
                  icon={<Egg className="h-3.5 w-3.5 text-red-400" />}
                  type="number"
                  min={0}
                  value={formData.eggs_broken}
                  onChange={(v) => handleInputChange("eggs_broken", parseInt(v) || 0)}
                  error={errors.eggs_broken}
                  placeholder="0"
                />
              </div>
            </div>
          )}

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
              placeholder="Any additional observations or notes..."
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Reusable field input component ── */
interface FieldInputProps {
  id: string
  label: string
  icon: React.ReactNode
  type?: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

function FieldInput({ id, label, icon, type = "number", min, max, step, value, onChange, error, placeholder }: FieldInputProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-gray-600 flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 text-sm",
          error && "border-red-400 focus-visible:ring-red-300"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default AddDailyRecordModal