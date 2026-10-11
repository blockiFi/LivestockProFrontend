import { useState, useEffect } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarIcon,
  ClipboardCheck,
  User,
  Beaker,
  Package,
  DollarSign,
  Syringe,
  Pill,
  StickyNote,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ScheduleItem, VaccineProduct, MedicationProduct, AdministrationMethod, BatchScheduleItem } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { getAdministrationMethods, getVaccineProducts, getMedicationProducts, createBatchScheduleItem, updateBatchScheduleItem } from "@/lib/request"
import { toast } from "react-toastify"

interface ImplementScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleItem: ScheduleItem
  batchScheduleItem?: BatchScheduleItem | null
  batchScheduleId: number
  scheduleType: "medication" | "vaccination"
  currentAge: number
  onSuccess?: () => void
}

const ImplementScheduleModal = ({
  open,
  onOpenChange,
  scheduleItem,
  batchScheduleItem = null,
  batchScheduleId,
  scheduleType,
  currentAge,
  onSuccess,
}: ImplementScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date())
  const [actualDate, setActualDate] = useState<Date | undefined>(undefined)
  const [showScheduledCalendar, setShowScheduledCalendar] = useState(false)
  const [showActualCalendar, setShowActualCalendar] = useState(false)
  
  // Dropdown data
  const [vaccineProducts, setVaccineProducts] = useState<VaccineProduct[]>([])
  const [medicationProducts, setMedicationProducts] = useState<MedicationProduct[]>([])
  const [administrationMethods, setAdministrationMethods] = useState<AdministrationMethod[]>([])
  const [loadingData, setLoadingData] = useState(true)
   const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const [formData, setFormData] = useState({
    administered_by: "",
    poultry_vaccine_product_id: scheduleType === "vaccination" ? scheduleItem.poultry_vaccine_id?.toString() || "" : "",
    vaccine_product_batch_id: "",
    poultry_medication_id: scheduleType === "medication" ? scheduleItem.poultry_medication_id?.toString() || "" : "",
    dosage: scheduleItem.dose?.toString() || "",
    quantity: "",
    cost: "",
    notes: "",
    administration_method_id: "",
    status: "completed" as "scheduled" | "completed" | "missed" | "late",
  })

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      fetchDropdownData()
    }
  }, [open, scheduleType])

  // When modal opens, default scheduled date based on schedule age vs current flock age
  useEffect(() => {
    if (open) {
      if (batchScheduleItem?.scheduled_date) {
        setScheduledDate(new Date(batchScheduleItem.scheduled_date))
      } else {
        const today = new Date()
        if (typeof scheduleItem.age_days === "number" && !Number.isNaN(currentAge)) {
          const offset = scheduleItem.age_days - currentAge
          const scheduled = new Date(today)
          scheduled.setDate(today.getDate() + offset)
          setScheduledDate(scheduled)
        } else {
          setScheduledDate(today)
        }
      }
      setActualDate(undefined)
    }
  }, [open, scheduleItem, currentAge, batchScheduleItem])

  const fetchDropdownData = async () => {
    setLoadingData(true)
    try {
      // Fetch administration methods
      const methodsResponse = await getAdministrationMethods(token, farmId!);
      if (methodsResponse.success && Array.isArray(methodsResponse.data)) {
        setAdministrationMethods(methodsResponse.data);
      } else {
        toast.error("Failed to fetch administration methods");
      }

      // Fetch vaccine or medication products based on type
      if (scheduleType === "vaccination") {
        const vaccineResponse = await getVaccineProducts(token, farmId!, false, scheduleItem.poultry_vaccine_id ?? undefined);
        if (vaccineResponse.success && Array.isArray(vaccineResponse.data)) {
          setVaccineProducts(vaccineResponse.data);
          console.log("Vaccine Products: ", vaccineResponse.data);
        } else {
          const errorMsg = vaccineResponse.error?.join(", ") || "Failed to fetch vaccine products";
          toast.error(errorMsg);
          console.error("Failed to fetch vaccine products:", vaccineResponse);
        }
      } else {
        const medicationResponse = await getMedicationProducts(token, farmId!, false, scheduleItem.poultry_medication_id ?? undefined);
        if (medicationResponse.success && Array.isArray(medicationResponse.data)) {
          setMedicationProducts(medicationResponse.data);
          console.log("Medication Products: ", medicationResponse.data);
        } else {
          const errorMsg = medicationResponse.error?.join(", ") || "Failed to fetch medication products";
          toast.error(errorMsg);
          console.error("Failed to fetch medication products:", medicationResponse);
        }
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      toast.error("An unexpected error occurred while loading data")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmId || !token) {
      toast.error("Farm or authentication missing")
      return
    }

    if (scheduleType === "vaccination" && !formData.poultry_vaccine_product_id) {
      toast.error("Please select a vaccine product")
      return
    }

    if (scheduleType === "medication" && !formData.poultry_medication_id) {
      toast.error("Please select a medication product")
      return
    }

    setLoading(true)

    try {
      const payload = {
        batch_schedule_id: batchScheduleId,
        schedule_item_id: scheduleItem.id,
        scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
        actual_date: actualDate ? format(actualDate, "yyyy-MM-dd") : null,
        status: formData.status,
        administered_by: formData.administered_by || null,
        dosage: formData.dosage ? Number(formData.dosage) : null,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        cost: formData.cost ? Number(formData.cost) : null,
        notes: formData.notes || null,
        administration_method_id: formData.administration_method_id ? Number(formData.administration_method_id) : null,
        ...(scheduleType === "vaccination" && {
          poultry_vaccine_product_id: Number(formData.poultry_vaccine_product_id),
          vaccine_product_batch_id: formData.vaccine_product_batch_id ? Number(formData.vaccine_product_batch_id) : null,
        }),
        ...(scheduleType === "medication" && {
          poultry_medication_id: Number(formData.poultry_medication_id),
        }),
      }

      const result = batchScheduleItem
        ? await updateBatchScheduleItem(token, farmId, scheduleType, batchScheduleItem.id, payload)
        : await createBatchScheduleItem(token, farmId, scheduleType, payload)

      if (!result.success) {
        const msg = Array.isArray(result.error) ? result.error.join(", ") : String(result.error)
        throw new Error(msg || "Failed to implement schedule")
      }

      toast.success("Schedule implemented successfully!")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error implementing schedule:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to implement schedule"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const dateButtonClass = (active: boolean) =>
    cn(
      "flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm transition-colors hover:bg-white",
      active && "border-teal-500 bg-white ring-2 ring-teal-100"
    )

  const iconInput = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Implement ${scheduleType === "vaccination" ? "Vaccination" : "Medication"} Schedule`}
      description={`Record the details of this ${scheduleType} administration for ${scheduleItem.name}.`}
      icon={scheduleType === "vaccination" ? Syringe : Pill}
      tone="schedule"
      size="lg"
      busy={loading}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitLabel="Implement Schedule"
          busyLabel="Implementing..."
          busy={loading}
          icon={ClipboardCheck}
        />
      }
    >
      <FormSection step={1} icon={ClipboardCheck} title="Status & dates" description="Outcome of this dose and when it happened.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Status" required className="md:col-span-2">
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Scheduled date" required>
            <button
              type="button"
              onClick={() => { setShowScheduledCalendar(!showScheduledCalendar); setShowActualCalendar(false) }}
              className={dateButtonClass(showScheduledCalendar)}
            >
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                {format(scheduledDate, "EEE, MMM d, yyyy")}
              </span>
              {showScheduledCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {showScheduledCalendar && (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <Calendar mode="single" selected={scheduledDate} onSelect={(date) => { if (date) { setScheduledDate(date); setShowScheduledCalendar(false) } }} />
              </div>
            )}
          </FormField>

          <FormField label="Actual date">
            <button
              type="button"
              onClick={() => { setShowActualCalendar(!showActualCalendar); setShowScheduledCalendar(false) }}
              className={dateButtonClass(showActualCalendar)}
            >
              <span className={cn("flex items-center gap-2", actualDate ? "font-medium text-slate-900" : "text-slate-400")}>
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                {actualDate ? format(actualDate, "EEE, MMM d, yyyy") : "Pick a date"}
              </span>
              {showActualCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {showActualCalendar && (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <Calendar mode="single" selected={actualDate} onSelect={(date) => { setActualDate(date); setShowActualCalendar(false) }} />
              </div>
            )}
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step={2}
        icon={scheduleType === "vaccination" ? Syringe : Pill}
        title={scheduleType === "vaccination" ? "Vaccine product" : "Medication product"}
        description="Which product was used and how it was given."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {scheduleType === "vaccination" && (
            <FormField label="Vaccine product" required>
              {loadingData ? (
                <div className="flex h-10 items-center text-sm text-slate-500">Loading vaccine products...</div>
              ) : (
                <Select
                  value={formData.poultry_vaccine_product_id}
                  onValueChange={(value) => {
                    handleInputChange("poultry_vaccine_product_id", value)
                    const selectedProduct = vaccineProducts.find(p => p.id.toString() === value)
                    if (selectedProduct?.administration_method_id) {
                      handleInputChange("administration_method_id", selectedProduct.administration_method_id.toString())
                    }
                  }}
                >
                  <SelectTrigger className={formInputClass()}>
                    <SelectValue placeholder="Select vaccine product" />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccineProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}

          {scheduleType === "medication" && (
            <FormField label="Medication product" required>
              {loadingData ? (
                <div className="flex h-10 items-center text-sm text-slate-500">Loading medication products...</div>
              ) : (
                <Select
                  value={formData.poultry_medication_id}
                  onValueChange={(value) => {
                    handleInputChange("poultry_medication_id", value)
                    const selectedProduct = medicationProducts.find(p => p.id.toString() === value)
                    if (selectedProduct?.administration_method_id) {
                      handleInputChange("administration_method_id", selectedProduct.administration_method_id.toString())
                    }
                  }}
                >
                  <SelectTrigger className={formInputClass()}>
                    <SelectValue placeholder="Select medication product" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicationProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}

          <FormField label="Administration method">
            {loadingData ? (
              <div className="flex h-10 items-center text-sm text-slate-500">Loading methods...</div>
            ) : (
              <Select value={formData.administration_method_id} onValueChange={(value) => handleInputChange("administration_method_id", value)}>
                <SelectTrigger className={formInputClass()}>
                  <SelectValue placeholder="Select administration method" />
                </SelectTrigger>
                <SelectContent>
                  {administrationMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name} {method.description && `- ${method.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
      </FormSection>

      <FormSection step={3} icon={Beaker} title="Dosage & cost" description="How much was given and what it cost.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Dosage" htmlFor="dosage">
            <div className="relative">
              <Beaker className={iconInput} />
              <Input id="dosage" type="number" min="0" value={formData.dosage} onChange={(e) => handleInputChange("dosage", e.target.value)} placeholder="e.g., 10" className={formInputClass(false, "pl-9")} />
            </div>
          </FormField>
          <FormField label="Quantity" htmlFor="quantity">
            <div className="relative">
              <Package className={iconInput} />
              <Input id="quantity" type="number" min="0" step="0.01" value={formData.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} placeholder="e.g., 100" className={formInputClass(false, "pl-9")} />
            </div>
          </FormField>
          <FormField label="Cost" htmlFor="cost">
            <div className="relative">
              <DollarSign className={iconInput} />
              <Input id="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={(e) => handleInputChange("cost", e.target.value)} placeholder="e.g., 50.00" className={formInputClass(false, "pl-9")} />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={4} icon={User} title="Administration & notes" description="Who administered it and any observations.">
        <div className="space-y-4">
          <FormField label="Administered by" htmlFor="administered_by">
            <div className="relative">
              <User className={iconInput} />
              <Input id="administered_by" value={formData.administered_by} onChange={(e) => handleInputChange("administered_by", e.target.value)} placeholder="Enter name of person who administered" maxLength={255} className={formInputClass(false, "pl-9")} />
            </div>
          </FormField>
          <FormField label="Notes" htmlFor="notes">
            <div className="relative">
              <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Add any additional notes or observations..." rows={3} className={formTextareaClass(false, "pl-9")} />
            </div>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}

export default ImplementScheduleModal
