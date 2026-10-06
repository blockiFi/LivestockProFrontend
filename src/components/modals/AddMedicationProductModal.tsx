import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  Beaker,
  Building2,
  Clock,
  ImageIcon,
  Loader2,
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
  idPrefix?: string
}

function FieldShell({
  label,
  required,
  htmlFor,
  children,
  hint,
}: {
  label: string
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-5">
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function AddMedicationProductModal({
  medications,
  isOpen,
  onClose,
  onSubmit,
  editing = false,
  idPrefix = "med-product",
}: Props) {
  const [formData, setFormData] = useState<MedicationProductFormValues>(emptyForm)
  const [adminMethods, setAdminMethods] = useState<AdministrationMethod[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFormData(emptyForm())
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
  }, [isOpen])

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

  const inputClass = (invalid?: boolean) =>
    cn(
      "h-10 rounded-xl border-slate-200 bg-slate-50/60 transition focus-visible:bg-white",
      invalid && touched && "border-rose-300 focus-visible:ring-rose-200",
    )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 px-6 py-5 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 35%)",
            }}
          />
          <DialogHeader className="relative space-y-1 text-left">
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Pill className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              {editing ? "Edit medication product" : "Add new medication"}
            </DialogTitle>
            <DialogDescription className="text-sm text-teal-50/90">
              {editing
                ? "Update product details, stock thresholds, and label mix ratios."
                : "Register a product for inventory with optional preventive and treatment label rates."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
            <SectionCard
              icon={Package}
              title="Product identity"
              description="How this product appears in inventory and usage logs."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldShell label="Product name" required htmlFor={`${idPrefix}-name`}>
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
                </FieldShell>

                <FieldShell label="Manufacturer" required htmlFor={`${idPrefix}-mfr`}>
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
                </FieldShell>

                <FieldShell label="Medication type" required>
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
                </FieldShell>

                <FieldShell label="Administration method" required>
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
                </FieldShell>
              </div>
            </SectionCard>

            <SectionCard
              icon={Warehouse}
              title="Stock & withdrawal"
              description="Inventory alerts and food-safety withdrawal period."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FieldShell
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
                </FieldShell>

                <FieldShell label="Withdrawal period" htmlFor={`${idPrefix}-withdrawal`}>
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
                </FieldShell>

                <FieldShell label="Withdrawal unit">
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
                </FieldShell>

                <div className="sm:col-span-3">
                  <FieldShell
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
                  </FieldShell>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Beaker}
              title="Label mix ratios"
              description="Optional preventive and treatment rates from the product label."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
            </SectionCard>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-teal-700 text-white hover:bg-teal-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editing ? "Saving..." : "Adding..."}
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Add medication"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
