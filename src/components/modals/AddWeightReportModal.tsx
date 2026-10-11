import { useState } from "react"
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
  Scale,
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
      title="Add Weight Report"
      description="Record weight data for this flock. Fields marked with * are required."
      icon={Scale}
      tone="flock"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel="Create Report"
          busyLabel="Creating..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={CalendarIcon} title="Report date" description="The day the birds were weighed.">
        <FormField label="Report Date" required error={errors.report_date}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              formInputClass(!!errors.report_date),
              "flex w-full items-center justify-between border px-3 text-sm hover:bg-white",
              showCalendar && "border-sky-500 ring-2 ring-sky-100"
            )}
          >
            <span className={formData.report_date ? "font-medium text-slate-900" : "text-slate-400"}>
              {formData.report_date
                ? format(new Date(formData.report_date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                : "Select date"}
            </span>
            {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.report_date ? new Date(formData.report_date + 'T12:00:00') : undefined}
                onSelect={handleDateChange}
              />
            </div>
          )}
        </FormField>
      </FormSection>

      <FormSection step={2} icon={Weight} title="Weight Measurements" description="Lightest, heaviest and average weight of the sample.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Min Weight (kg)" required htmlFor="min_weight" error={errors.min_weight}>
            <div className="relative">
              <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="min_weight" type="number" step="0.01" min="0.01" value={formData.min_weight} onChange={(e) => handleInputChange("min_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={formInputClass(!!errors.min_weight, "pl-9")} />
            </div>
          </FormField>
          <FormField label="Max Weight (kg)" required htmlFor="max_weight" error={errors.max_weight}>
            <div className="relative">
              <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="max_weight" type="number" step="0.01" min="0.01" value={formData.max_weight} onChange={(e) => handleInputChange("max_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={formInputClass(!!errors.max_weight, "pl-9")} />
            </div>
          </FormField>
          <FormField label="Average Weight (kg)" required htmlFor="average_weight" error={errors.average_weight}>
            <div className="relative">
              <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="average_weight" type="number" step="0.01" min="0.01" value={formData.average_weight} onChange={(e) => handleInputChange("average_weight", parseFloat(e.target.value) || 0)} placeholder="0.00" className={formInputClass(!!errors.average_weight, "pl-9")} />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={3} icon={Bird} title="Sampling Info" description="How many birds were weighed out of the flock.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Sample Size"
            required
            htmlFor="sample_size"
            error={errors.sample_size}
            hint={`Birds weighed (max: ${formData.number_of_birds})`}
          >
            <div className="relative">
              <Bird className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="sample_size" type="number" min="1" max={formData.number_of_birds} value={formData.sample_size} onChange={(e) => handleInputChange("sample_size", parseInt(e.target.value) || 0)} placeholder="Enter sample size" className={formInputClass(!!errors.sample_size, "pl-9")} />
            </div>
          </FormField>
          <FormField
            label="Current Bird Count"
            htmlFor="number_of_birds"
            error={errors.number_of_birds}
            hint={`Original: ${flock?.quantity || 0}, after mortality: ${currentBirdCount}`}
          >
            <div className="relative">
              <Bird className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="number_of_birds" type="number" value={formData.number_of_birds} disabled className={formInputClass(!!errors.number_of_birds, "pl-9")} />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={4} icon={StickyNote} title="Notes" description="Uniformity, health or feeding observations.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Enter any additional notes about this weight report" rows={3} className={formTextareaClass()} />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default AddWeightReportModal
