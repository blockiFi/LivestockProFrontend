import { useState, useEffect, useMemo } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "../ui/form-modal"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
      title="Add Mortality Record"
      description="Record mortality data for this flock. Fields marked with * are required."
      icon={Skull}
      tone="flock"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel="Create Record"
          busyLabel="Creating..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={CalendarIcon} title="Date" description="When the losses were recorded.">
        <FormField label="Date" required error={errors.date}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              formInputClass(!!errors.date),
              "flex w-full items-center justify-between border px-3 text-sm hover:bg-white",
              showCalendar && "border-sky-500 ring-2 ring-sky-100"
            )}
          >
            <span className={formData.date ? "font-medium text-slate-900" : "text-slate-400"}>
              {formData.date
                ? format(new Date(formData.date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                : "Select date"}
            </span>
            {showCalendar
              ? <ChevronUp className="h-4 w-4 text-slate-500" />
              : <ChevronDown className="h-4 w-4 text-slate-500" />
            }
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.date ? new Date(formData.date + 'T12:00:00') : undefined}
                onSelect={handleDateChange}
              />
            </div>
          )}
        </FormField>
      </FormSection>

      <FormSection step={2} icon={Skull} title="Mortality Details" description="How many birds were lost and their average weight.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Mortality Count"
            required
            htmlFor="mortality_count"
            error={errors.mortality_count}
            hint={birdCountOnDate > 0 ? `Maximum on this date: ${birdCountOnDate}` : undefined}
          >
            <div className="relative">
              <Skull className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="mortality_count"
                type="number"
                min="1"
                max={birdCountOnDate > 0 ? birdCountOnDate : undefined}
                value={formData.mortality_count}
                onChange={(e) => handleInputChange("mortality_count", parseInt(e.target.value) || 0)}
                placeholder={`Enter mortality count (max: ${birdCountOnDate})`}
                className={formInputClass(!!errors.mortality_count, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Average Weight (kg)" required htmlFor="average_weight" error={errors.average_weight}>
            <div className="relative">
              <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="average_weight"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.average_weight}
                onChange={(e) => handleInputChange("average_weight", parseFloat(e.target.value) || 0)}
                placeholder="Enter average weight"
                className={formInputClass(!!errors.average_weight, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={3} icon={Bird} title="Flock Information" description="Calculated from the flock's history up to this date.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Bird Count on Date"
            htmlFor="bird_count"
            error={errors.bird_count}
            hint={`Arrival (${flock?.quantity || 0}) minus mortality/culls before ${formData.date}`}
          >
            <div className="relative">
              <Bird className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="bird_count"
                type="number"
                value={birdCountOnDate}
                disabled
                className={formInputClass(!!errors.bird_count, "pl-9")}
              />
            </div>
          </FormField>

          <FormField
            label="Mortality Percentage"
            htmlFor="mortality_percentage"
            hint="Auto-calculated from count & bird count on date"
          >
            <div className="relative">
              <TrendingDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="mortality_percentage"
                type="number"
                step="0.01"
                value={formData.mortality_percentage.toFixed(2)}
                disabled
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={4} icon={StickyNote} title="Notes" description="Suspected cause, symptoms or other observations.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Enter any additional notes about this mortality record"
            rows={3}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default AddMortalityRecordModal
