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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Pill,
  User,
  Beaker,
  Syringe,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type {
  Medication,
  MedicationData,
  MedicationInventory,
  MedicationProduct,
  AdministrationMethod,
} from "@/lib/types"
import {
  MEDICINE_UNITS,
  formatMedicationDosageSummary,
  suggestedMedicineUnit,
} from "@/lib/medicationDosage"
import { GetToken, getPoultryMedicationData } from "@/lib/request"
import {
  FAMILY_UNITS,
  batchRemainingLabel,
  isUnitAwareBatch,
  packBreakdown,
  stockSummary,
  toBase,
  unitFamily,
} from "@/lib/medicationPack"

type MedicationOption = Medication | MedicationData

interface AddMedicationRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: MedicationRecordFormData) => Promise<void>
  flockId: number
  farmId: number
  medications?: MedicationOption[]
  medicationInventories?: MedicationInventory[]
  administrationMethods?: AdministrationMethod[]
}

export interface MedicationRecordFormData {
  farm_id: number
  flock_id: number
  poultry_medication_id: number
  poultry_medication_inventory_id: number
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  purpose?: "preventive" | "treatment" | ""
  quantity: number
  notes: string
  administration_method_id: number
}

const emptyForm = (farmId: number, flockId: number): MedicationRecordFormData => ({
  farm_id: farmId,
  flock_id: flockId,
  poultry_medication_id: 0,
  poultry_medication_inventory_id: 0,
  date: format(new Date(), "yyyy-MM-dd"),
  administered_by: "",
  dosage: 0,
  dosage_unit: "ml",
  purpose: "",
  quantity: 0,
  notes: "",
  administration_method_id: 0,
})

type CatalogProduct = MedicationProduct & { batches: MedicationInventory[]; totalStock: number }
type CatalogType = { id: number; name: string; description: string; products: CatalogProduct[] }

const inventoryQty = (inv: MedicationInventory): number =>
  Number(inv.available_quantity ?? inv.quantity ?? 0) || 0

const isUsableBatch = (inv: MedicationInventory): boolean => {
  if (inventoryQty(inv) <= 0) return false
  if (inv.status === "expired" || inv.status === "out_of_stock") return false
  if (inv.expiry_date && new Date(inv.expiry_date).getTime() < Date.now()) return false
  return true
}

/** Build type → product → batch catalog from `/medications/data` (or props as fallback). */
const buildCatalog = (
  medications: MedicationOption[],
  flatInventories: MedicationInventory[],
): CatalogType[] =>
  medications.map((med) => {
    const rawProducts = (med as MedicationData).products ?? []
    const products: CatalogProduct[] = (Array.isArray(rawProducts) ? rawProducts : []).map((p) => {
      const raw = p as MedicationProduct & { inventories?: MedicationInventory[] }
      const nested = raw.inventories ?? raw.inventory ?? []
      const source = nested.length
        ? nested
        : flatInventories.filter((inv) => Number(inv.medication_product_id) === Number(p.id))
      const batches = source
        .map((inv) => ({
          ...inv,
          id: Number(inv.id),
          medication_product_id: Number(inv.medication_product_id ?? p.id),
          quantity: Number(inv.quantity ?? 0),
          available_quantity: Number(inv.available_quantity ?? inv.quantity ?? 0),
          product: inv.product ?? p,
        }))
        .filter(isUsableBatch)
        .sort((a, b) => {
          const ea = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity
          const eb = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity
          return ea - eb
        })
      return {
        ...p,
        id: Number(p.id),
        poultry_medication_id: Number(p.poultry_medication_id),
        administration_method_id: Number(p.administration_method_id),
        batches,
        totalStock: batches.reduce((sum, inv) => sum + inventoryQty(inv), 0),
      }
    })
    return {
      id: Number(med.id),
      name: med.name,
      description: med.description ?? "",
      products: products.sort((a, b) => b.totalStock - a.totalStock || a.name.localeCompare(b.name)),
    }
  })

const AddMedicationRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  flockId,
  farmId,
  medications = [],
  medicationInventories = [],
  administrationMethods = [],
}: AddMedicationRecordModalProps) => {
  const [formData, setFormData] = useState<MedicationRecordFormData>(emptyForm(farmId, flockId))
  const [selectedProductId, setSelectedProductId] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [catalogSource, setCatalogSource] = useState<MedicationOption[] | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      const token = GetToken()
      if (!token || !farmId) return
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const res = await getPoultryMedicationData(token, farmId)
        if (cancelled) return
        if (res.success && Array.isArray(res.data)) {
          setCatalogSource(res.data as unknown as MedicationData[])
        } else {
          setCatalogSource(null)
          setCatalogError("Could not load medication products. Showing cached list.")
        }
      } catch {
        if (!cancelled) {
          setCatalogSource(null)
          setCatalogError("Could not load medication products. Showing cached list.")
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isOpen, farmId])

  const catalog = useMemo(
    () => buildCatalog(catalogSource ?? medications, medicationInventories),
    [catalogSource, medications, medicationInventories],
  )

  const selectedType = useMemo(
    () => catalog.find((t) => t.id === formData.poultry_medication_id),
    [catalog, formData.poultry_medication_id],
  )

  const productsForMedication = selectedType?.products ?? []

  const selectedProduct = useMemo(
    () => productsForMedication.find((p) => p.id === selectedProductId),
    [productsForMedication, selectedProductId],
  )

  const inventoriesForProduct = selectedProduct?.batches ?? []

  const selectedBatch = inventoriesForProduct.find(
    (inv) => inv.id === formData.poultry_medication_inventory_id,
  )

  const labelHint = selectedProduct ? formatMedicationDosageSummary(selectedProduct) : null

  // Unit-aware batches hold stock in g, ml or tablet; usage must be in a unit of the same family.
  const batchUnit = selectedBatch && isUnitAwareBatch(selectedBatch) ? selectedBatch.content_unit ?? null : null
  const batchFamily = unitFamily(batchUnit)
  const allowedUnits = batchFamily
    ? MEDICINE_UNITS.filter((u) => FAMILY_UNITS[batchFamily].includes(u.value))
    : MEDICINE_UNITS
  const packType = selectedProduct?.pack_type ?? null
  const batchPackBase = selectedBatch ? Number(selectedBatch.pack_size_base) || null : null
  const deductAmount =
    batchUnit && formData.dosage > 0 && formData.dosage_unit
      ? toBase(formData.dosage, formData.dosage_unit)
      : formData.dosage
  const batchRemaining = selectedBatch ? inventoryQty(selectedBatch) : 0
  const remainingLabel = selectedBatch ? batchRemainingLabel(selectedBatch, packType) : null
  const afterUseLabel =
    batchUnit && deductAmount != null && deductAmount > 0 && deductAmount <= batchRemaining + 1e-6
      ? packBreakdown(batchRemaining - deductAmount, batchPackBase, packType, batchUnit)
      : null

  useEffect(() => {
    if (!batchFamily) return
    if (unitFamily(formData.dosage_unit) === batchFamily) return
    const suggested = suggestedMedicineUnit(selectedProduct)
    const next = suggested && unitFamily(suggested) === batchFamily ? suggested : FAMILY_UNITS[batchFamily][0]
    setFormData((prev) => ({ ...prev, dosage_unit: next }))
  }, [batchFamily, formData.dosage_unit, selectedProduct])

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const { [field]: _unused, ...rest } = prev
      return rest
    })
  }

  const handleInputChange = (field: keyof MedicationRecordFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const handleMedicationTypeChange = (medicationId: string) => {
    const id = Number.parseInt(medicationId, 10)
    const type = catalog.find((t) => t.id === id)
    const onlyProduct =
      type && type.products.length === 1 && type.products[0].totalStock > 0 ? type.products[0] : undefined
    setSelectedProductId(onlyProduct?.id ?? 0)
    setFormData((prev) => ({
      ...prev,
      poultry_medication_id: id,
      poultry_medication_inventory_id:
        onlyProduct && onlyProduct.batches.length === 1 ? onlyProduct.batches[0].id : 0,
      dosage_unit: onlyProduct ? suggestedMedicineUnit(onlyProduct) || prev.dosage_unit : prev.dosage_unit,
      administration_method_id: onlyProduct?.administration_method_id
        ? Number(onlyProduct.administration_method_id)
        : 0,
    }))
    clearError("poultry_medication_id")
    clearError("medication_product_id")
    clearError("poultry_medication_inventory_id")
  }

  const handleProductChange = (productId: string) => {
    const id = Number.parseInt(productId, 10)
    const product = productsForMedication.find((p) => p.id === id)
    setSelectedProductId(id)
    setFormData((prev) => ({
      ...prev,
      poultry_medication_inventory_id: product?.batches.length === 1 ? product.batches[0].id : 0,
      dosage_unit: suggestedMedicineUnit(product) || prev.dosage_unit,
      administration_method_id: product?.administration_method_id
        ? Number(product.administration_method_id)
        : prev.administration_method_id,
    }))
    clearError("medication_product_id")
    clearError("poultry_medication_inventory_id")
  }

  const handleInventoryChange = (inventoryId: string) => {
    const id = Number.parseInt(inventoryId, 10)
    setFormData((prev) => ({
      ...prev,
      poultry_medication_inventory_id: id,
    }))
    clearError("poultry_medication_inventory_id")
  }

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    const validDate = new Date(date)
    validDate.setHours(12, 0, 0, 0)
    setFormData((prev) => ({ ...prev, date: format(validDate, "yyyy-MM-dd") }))
    setShowCalendar(false)
    clearError("date")
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = "Administration date is required"
    if (!formData.poultry_medication_id) newErrors.poultry_medication_id = "Please select a medication type"
    if (!selectedProductId) newErrors.medication_product_id = "Please select a medication product"
    if (!formData.poultry_medication_inventory_id)
      newErrors.poultry_medication_inventory_id = "Please select an inventory batch"
    if (!formData.administered_by.trim()) newErrors.administered_by = "Administered by is required"
    if (formData.dosage <= 0) newErrors.dosage = "Amount used must be greater than 0"
    else if (selectedBatch && deductAmount != null && deductAmount > batchRemaining + 1e-6)
      newErrors.dosage = `Only ${remainingLabel} left in this batch`
    if (!formData.dosage_unit.trim()) newErrors.dosage_unit = "Unit is required"
    else if (batchFamily && unitFamily(formData.dosage_unit) !== batchFamily)
      newErrors.dosage_unit = `This product is measured in ${batchUnit}. Use ${FAMILY_UNITS[batchFamily].join(" or ")}.`
    if (!formData.administration_method_id)
      newErrors.administration_method_id = "Please select administration method"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetLocalState = () => {
    setFormData(emptyForm(farmId, flockId))
    setSelectedProductId(0)
    setErrors({})
    setShowCalendar(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const amount = formData.dosage
      await onSubmit({
        ...formData,
        dosage: amount,
        quantity: deductAmount ?? amount,
        purpose: formData.purpose || undefined,
      })
      resetLocalState()
      onClose()
    } catch (error) {
      console.error("Error creating medication record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetLocalState()
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      resetLocalState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, farmId, flockId])

  // If medication type changes and current product is no longer in list, clear it
  useEffect(() => {
    if (selectedProductId && !productsForMedication.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(0)
      setFormData((prev) => ({ ...prev, poultry_medication_inventory_id: 0 }))
    }
  }, [productsForMedication, selectedProductId])

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
      title="Add Medication Record"
      description="Choose medication type, product, then inventory batch. Fields marked with * are required."
      icon={Pill}
      tone="health"
      size="xl"
      busy={isSubmitting}
      dismissible={false}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel="Add Medication Record"
          busyLabel="Adding..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={CalendarIcon} title="Administration date" description="When was the medication given?">
        <FormField label="Administration Date" required error={errors.date}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              formInputClass(!!errors.date),
              "flex w-full items-center justify-between border px-3 text-sm transition-colors hover:bg-white",
              showCalendar && "border-purple-500 ring-2 ring-purple-100",
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span className={formData.date ? "font-medium text-slate-900" : "text-slate-400"}>
                {formData.date
                  ? format(new Date(formData.date + "T12:00:00"), "EEEE, MMMM d, yyyy")
                  : "Select administration date"}
              </span>
            </span>
            {showCalendar ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.date ? new Date(formData.date + "T12:00:00") : undefined}
                onSelect={handleDateChange}
              />
            </div>
          )}
        </FormField>
      </FormSection>

      <FormSection step={2} icon={Pill} title="Medication details" description="Pick the type, product and stock batch to draw from.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Medication type" required error={errors.poultry_medication_id}>
            <Select
              value={formData.poultry_medication_id ? String(formData.poultry_medication_id) : undefined}
              onValueChange={handleMedicationTypeChange}
              disabled={catalogLoading && catalog.length === 0}
            >
              <SelectTrigger className={formInputClass(!!errors.poultry_medication_id)}>
                <SelectValue placeholder={catalogLoading ? "Loading types..." : "Select type"} />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((type) => {
                  const inStock = type.products.filter((p) => p.totalStock > 0).length
                  return (
                    <SelectItem key={type.id} value={String(type.id)}>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-gray-500">
                          {type.products.length
                            ? `${inStock} of ${type.products.length} product${type.products.length === 1 ? "" : "s"} in stock`
                            : "No products yet"}
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Medication product" required error={errors.medication_product_id}>
            <Select
              value={selectedProductId ? String(selectedProductId) : undefined}
              onValueChange={handleProductChange}
              disabled={!formData.poultry_medication_id}
            >
              <SelectTrigger className={formInputClass(!!errors.medication_product_id)}>
                <SelectValue
                  placeholder={
                    formData.poultry_medication_id
                      ? productsForMedication.length
                        ? "Select product"
                        : "No products available"
                      : "Select type first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {productsForMedication.map((product) => (
                  <SelectItem
                    key={product.id}
                    value={String(product.id)}
                    disabled={product.totalStock <= 0}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        {product.manufacturer}
                        {" · "}
                        {product.totalStock > 0
                          ? `${stockSummary(product.batches, product)} in stock (${product.batches.length} batch${product.batches.length === 1 ? "" : "es"})`
                          : "Out of stock"}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Inventory batch" required error={errors.poultry_medication_inventory_id}>
            <Select
              value={
                formData.poultry_medication_inventory_id
                  ? String(formData.poultry_medication_inventory_id)
                  : undefined
              }
              onValueChange={handleInventoryChange}
              disabled={!selectedProductId}
            >
              <SelectTrigger className={formInputClass(!!errors.poultry_medication_inventory_id)}>
                <SelectValue
                  placeholder={
                    selectedProductId
                      ? inventoriesForProduct.length
                        ? "Select batch"
                        : "No inventory for this product"
                      : "Select product first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {inventoriesForProduct.map((inventory) => {
                  const qty = batchRemainingLabel(inventory, selectedProduct?.pack_type)
                  return (
                    <SelectItem key={inventory.id} value={String(inventory.id)}>
                      <div>
                        <div className="font-medium">Batch: {inventory.batch_number || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {inventory.expiry_date
                            ? `Exp: ${format(new Date(inventory.expiry_date), "MMM dd, yyyy")} | `
                            : ""}
                          Left: {qty} | {inventory.manufacturer || selectedProduct?.manufacturer || ""}
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="mt-3 space-y-2">
          {catalogError && <p className="text-xs text-amber-700">{catalogError}</p>}
          {selectedType && productsForMedication.length === 0 && !catalogLoading && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No products are registered under {selectedType.name}. Add one under Health → Medications first.
            </p>
          )}
          {selectedProduct && inventoriesForProduct.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {selectedProduct.name} has no usable stock (empty or expired). Add inventory before recording usage.
            </p>
          )}
          {labelHint && labelHint !== "—" && (
            <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
              Label: {labelHint}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection step={3} icon={User} title="Administration info" description="Who gave it and how.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Administered By" required htmlFor="administered_by" error={errors.administered_by}>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="administered_by"
                type="text"
                value={formData.administered_by}
                onChange={(e) => handleInputChange("administered_by", e.target.value)}
                placeholder="e.g., Dr. Smith, Farm Manager"
                className={formInputClass(!!errors.administered_by, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Administration Method" required error={errors.administration_method_id}>
            <div className="relative">
              <Select
                value={
                  formData.administration_method_id ? String(formData.administration_method_id) : undefined
                }
                onValueChange={(value) => handleInputChange("administration_method_id", Number.parseInt(value, 10))}
              >
                <SelectTrigger className={formInputClass(!!errors.administration_method_id, "pl-9")}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {administrationMethods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        {method.description ? (
                          <div className="text-xs text-gray-500">{method.description}</div>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Syringe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={4} icon={Beaker} title="Amount used" description="This amount is deducted from inventory.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Amount used" required htmlFor="dosage" error={errors.dosage}>
            <div className="relative">
              <Beaker className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="dosage"
                type="number"
                step="0.0001"
                min="0"
                value={formData.dosage || ""}
                onChange={(e) => handleInputChange("dosage", Number.parseFloat(e.target.value) || 0)}
                placeholder="e.g. 10"
                className={formInputClass(!!errors.dosage, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Unit" required error={errors.dosage_unit}>
            <Select
              value={formData.dosage_unit || undefined}
              onValueChange={(value) => handleInputChange("dosage_unit", value)}
            >
              <SelectTrigger className={formInputClass(!!errors.dosage_unit)}>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {allowedUnits.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Purpose">
            <Select
              value={formData.purpose || "none"}
              onValueChange={(value) => handleInputChange("purpose", value === "none" ? "" : value)}
            >
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="preventive">Preventive</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        {selectedBatch && remainingLabel && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
            Batch {selectedBatch.batch_number || "—"}: <span className="font-medium text-slate-900">{remainingLabel} left</span>
            {afterUseLabel && (
              <>
                {" · after this: "}
                <span className="font-medium text-slate-900">{afterUseLabel}</span>
              </>
            )}
          </p>
        )}
      </FormSection>

      <FormSection icon={StickyNote} title="Notes" description="Anything else worth recording.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Additional notes about the medication administration..."
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default AddMedicationRecordModal
