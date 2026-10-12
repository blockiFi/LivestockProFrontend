import { useEffect, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  Beaker,
  Building2,
  Clock,
  ImageIcon,
  Package,
  Pill,
  Syringe,
  Warehouse,
} from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import type { AdministrationMethod, MedicationData } from "@/lib/types"
import { GetToken, getAdministrationMethods, getFarm } from "@/lib/request"
import { DosageRatioFields } from "@/components/poultry/health/DosageRatioFields"
import {
  emptyMedicationDosageRatios,
  type MedicationDosageRatios,
} from "@/lib/medicationDosage"

export type MedicationProductFormValues = {
  poultry_medication_id: number | null
  name: string
  manufacturer: string
  administration_method_id: number | null
  withdrawal_period: number
  withdrawal_period_unit: "days" | "hours"
  image_url?: string
  min_stock_level: number
  dosage_ratios: MedicationDosageRatios
}

const emptyForm = (): MedicationProductFormValues => ({
  poultry_medication_id: null,
  name: "",
  manufacturer: "",
  administration_method_id: null,
  withdrawal_period: 0,
  withdrawal_period_unit: "days",
  image_url: "",
  min_stock_level: 0,
  dosage_ratios: emptyMedicationDosageRatios(),
})

type Props = {
  medications: MedicationData[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: MedicationProductFormValues) => Promise<boolean>
  editing?: boolean
  initialValues?: MedicationProductFormValues
  idPrefix?: string
}

export default function AddMedicationProductModal({
  medications,
  isOpen,
  onClose,
  onSubmit,
  editing = false,
  initialValues,
  idPrefix = "med-product",
}: Props) {
  const [formData, setFormData] = useState<MedicationProductFormValues>(emptyForm)
  const [adminMethods, setAdminMethods] = useState<AdministrationMethod[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFormData(initialValues ?? emptyForm())
    setTouched(false)
    setSubmitting(false)

    const load = async () => {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) return
      try {
        const res = await getAdministrationMethods(token, farm.id)
        if (res.success) setAdminMethods(res.data || [])
        else setAdminMethods([])
      } catch {
        setAdminMethods([])
      }
    }
    void load()
  }, [isOpen, initialValues])

  const setField = <K extends keyof MedicationProductFormValues>(
    key: K,
    value: MedicationProductFormValues[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }))

  const missingRequired =
    !formData.name.trim() ||
    !formData.manufacturer.trim() ||
    !formData.poultry_medication_id ||
    !formData.administration_method_id

  const handleClose = () => {
    if (submitting) return
    setFormData(emptyForm())
    setTouched(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (missingRequired) {
      toast.error("Please complete all required fields")
      return
    }
    try {
      setSubmitting(true)
      const ok = await onSubmit(formData)
      if (ok) handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (invalid?: boolean) => formInputClass(!!invalid && touched)

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title={editing ? "Edit medication product" : "Add new medication"}
      description={
        editing
          ? "Update product details, stock thresholds, and label mix ratios."
          : "Register a product for inventory with optional preventive and treatment label rates."
      }
      icon={Pill}
      tone="health"
      size="lg"
      busy={submitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel={editing ? "Save changes" : "Add medication"}
          busyLabel={editing ? "Saving..." : "Adding..."}
          busy={submitting}
        />
      }
    >
      <FormSection
        icon={Package}
        title="Product identity"
        description="How this product appears in inventory and usage logs."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Product name" required htmlFor={`${idPrefix}-name`}>
            <div className="relative">
              <Pill className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Oxytetracycline 10%"
                className={cn(inputClass(!formData.name.trim()), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Manufacturer" required htmlFor={`${idPrefix}-mfr`}>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${idPrefix}-mfr`}
                value={formData.manufacturer}
                onChange={(e) => setField("manufacturer", e.target.value)}
                placeholder="e.g. VetPharm"
                className={cn(inputClass(!formData.manufacturer.trim()), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Medication type" required>
            <Select
              value={
                formData.poultry_medication_id == null
                  ? undefined
                  : String(formData.poultry_medication_id)
              }
              onValueChange={(v) => setField("poultry_medication_id", Number(v))}
            >
              <SelectTrigger className={inputClass(!formData.poultry_medication_id)}>
                <SelectValue placeholder="Select medication type" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Administration method" required>
            <div className="relative">
              <Select
                value={
                  formData.administration_method_id == null
                    ? undefined
                    : String(formData.administration_method_id)
                }
                onValueChange={(v) => setField("administration_method_id", Number(v))}
              >
                <SelectTrigger className={cn(inputClass(!formData.administration_method_id), "pl-9")}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {adminMethods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Syringe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        icon={Warehouse}
        title="Stock & withdrawal"
        description="Inventory alerts and food-safety withdrawal period."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Minimum stock"
            htmlFor={`${idPrefix}-min-stock`}
            hint="Alert when available quantity falls to this level"
          >
            <div className="relative">
              <AlertTriangle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${idPrefix}-min-stock`}
                type="number"
                min={0}
                value={formData.min_stock_level}
                onChange={(e) =>
                  setField("min_stock_level", Number.parseInt(e.target.value, 10) || 0)
                }
                className={cn(inputClass(), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Withdrawal period" htmlFor={`${idPrefix}-withdrawal`}>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${idPrefix}-withdrawal`}
                type="number"
                min={0}
                value={formData.withdrawal_period}
                onChange={(e) =>
                  setField("withdrawal_period", Number.parseInt(e.target.value, 10) || 0)
                }
                className={cn(inputClass(), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Withdrawal unit">
            <Select
              value={formData.withdrawal_period_unit}
              onValueChange={(v: "days" | "hours") => setField("withdrawal_period_unit", v)}
            >
              <SelectTrigger className={inputClass()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            className="sm:col-span-3"
            label="Image URL"
            htmlFor={`${idPrefix}-image`}
            hint="Optional product image link"
          >
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${idPrefix}-image`}
                value={formData.image_url || ""}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="https://..."
                className={cn(inputClass(), "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        icon={Beaker}
        title="Label mix ratios"
        description="Optional preventive and treatment rates from the product label."
      >
        <div className="grid grid-cols-1 gap-3">
          <DosageRatioFields
            idPrefix={`${idPrefix}-preventive`}
            title="Preventive"
            description="Routine / prophylactic mix rate"
            tone="preventive"
            value={formData.dosage_ratios.preventive}
            onChange={(preventive) =>
              setFormData((prev) => ({
                ...prev,
                dosage_ratios: { ...prev.dosage_ratios, preventive },
              }))
            }
          />
          <DosageRatioFields
            idPrefix={`${idPrefix}-treatment`}
            title="Treatment"
            description="Therapeutic mix rate when treating"
            tone="treatment"
            value={formData.dosage_ratios.treatment}
            onChange={(treatment) =>
              setFormData((prev) => ({
                ...prev,
                dosage_ratios: { ...prev.dosage_ratios, treatment },
              }))
            }
          />
        </div>
      </FormSection>
    </FormModal>
  )
}
