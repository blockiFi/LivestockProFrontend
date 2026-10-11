import { useEffect, useMemo, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "../ui/form-modal"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Egg,
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
      title={isEditMode ? "Edit Egg Report" : "Add Egg Report"}
      description="Record daily egg collection for this flock. Fields marked with * are required."
      icon={Egg}
      tone="flock"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel={isEditMode ? "Update Report" : "Create Report"}
          busyLabel="Saving..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={CalendarIcon} title="Report date" description="The day these eggs were collected.">
        <FormField label="Report Date" required error={errors.date}>
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
                ? format(new Date(`${formData.date}T12:00:00`), "EEEE, MMMM d, yyyy")
                : "Select date"}
            </span>
            {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.date ? new Date(`${formData.date}T12:00:00`) : undefined}
                onSelect={handleDateChange}
                disabled={(date) => date > new Date()}
              />
            </div>
          )}
        </FormField>
      </FormSection>

      <FormSection step={2} icon={Egg} title="Production" description="Eggs collected, broken and their average weight.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Eggs Collected" required htmlFor="eggs_collected" error={errors.eggs_collected}>
            <div className="relative">
              <Egg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="eggs_collected"
                type="number"
                min="0"
                value={formData.eggs_collected}
                onChange={(e) => handleInputChange("eggs_collected", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={formInputClass(!!errors.eggs_collected, "pl-9")}
              />
            </div>
          </FormField>
          <FormField label="Broken Eggs" htmlFor="eggs_broken" error={errors.eggs_broken}>
            <div className="relative">
              <AlertTriangle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="eggs_broken"
                type="number"
                min="0"
                value={formData.eggs_broken}
                onChange={(e) => handleInputChange("eggs_broken", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={formInputClass(!!errors.eggs_broken, "pl-9")}
              />
            </div>
          </FormField>
          <FormField label="Avg Egg Weight (g)" htmlFor="average_egg_weight" error={errors.average_egg_weight}>
            <div className="relative">
              <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="average_egg_weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.average_egg_weight}
                onChange={(e) => handleInputChange("average_egg_weight", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={formInputClass(!!errors.average_egg_weight, "pl-9")}
              />
            </div>
          </FormField>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FormSummary label="Bird count on date" value={birdCount.toLocaleString()} />
          <FormSummary
            label={
              <span className="inline-flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Hen-day production
              </span>
            }
            value={`${previewProductionPct.toFixed(2)}%`}
          />
        </div>
      </FormSection>

      <FormSection step={3} icon={StickyNote} title="Notes" description="Anything worth remembering about this collection.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Optional notes about this collection"
            rows={3}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default AddEggRecordModal
