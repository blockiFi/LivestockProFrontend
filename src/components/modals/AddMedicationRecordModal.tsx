import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Pill,
  User,
  Beaker,
  Package,
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
    else if (selectedBatch && formData.dosage > inventoryQty(selectedBatch))
      newErrors.dosage = `Only ${inventoryQty(selectedBatch)} available in this batch`
    if (!formData.dosage_unit.trim()) newErrors.dosage_unit = "Unit is required"
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
        quantity: amount,
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Medication Record</DialogTitle>
            <DialogDescription className="text-purple-100">
              Choose medication type, product, then inventory batch. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              Administration Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-purple-500 ring-2 ring-purple-100",
              )}
            >
              <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.date
                  ? format(new Date(formData.date + "T12:00:00"), "EEEE, MMMM d, yyyy")
                  : "Select administration date"}
              </span>
              {showCalendar ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date + "T12:00:00") : undefined}
                  onSelect={handleDateChange}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-500" />
              Medication Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-purple-400" />
                  Medication type *
                </Label>
                <Select
                  value={formData.poultry_medication_id ? String(formData.poultry_medication_id) : undefined}
                  onValueChange={handleMedicationTypeChange}
                  disabled={catalogLoading && catalog.length === 0}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.poultry_medication_id && "border-red-400")}>
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
                {errors.poultry_medication_id && (
                  <p className="text-xs text-red-500">{errors.poultry_medication_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-purple-400" />
                  Medication product *
                </Label>
                <Select
                  value={selectedProductId ? String(selectedProductId) : undefined}
                  onValueChange={handleProductChange}
                  disabled={!formData.poultry_medication_id}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.medication_product_id && "border-red-400")}>
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
                              ? `${product.totalStock} in stock (${product.batches.length} batch${product.batches.length === 1 ? "" : "es"})`
                              : "Out of stock"}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.medication_product_id && (
                  <p className="text-xs text-red-500">{errors.medication_product_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-purple-400" />
                  Inventory batch *
                </Label>
                <Select
                  value={
                    formData.poultry_medication_inventory_id
                      ? String(formData.poultry_medication_inventory_id)
                      : undefined
                  }
                  onValueChange={handleInventoryChange}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger
                    className={cn("h-9 text-sm", errors.poultry_medication_inventory_id && "border-red-400")}
                  >
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
                      const qty = inventoryQty(inventory)
                      return (
                        <SelectItem key={inventory.id} value={String(inventory.id)}>
                          <div>
                            <div className="font-medium">Batch: {inventory.batch_number || "—"}</div>
                            <div className="text-xs text-gray-500">
                              {inventory.expiry_date
                                ? `Exp: ${format(new Date(inventory.expiry_date), "MMM dd, yyyy")} | `
                                : ""}
                              Qty: {qty} | {inventory.manufacturer || selectedProduct?.manufacturer || ""}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.poultry_medication_inventory_id && (
                  <p className="text-xs text-red-500">{errors.poultry_medication_inventory_id}</p>
                )}
              </div>
            </div>
            {catalogError && <p className="text-xs text-amber-700">{catalogError}</p>}
            {selectedType && productsForMedication.length === 0 && !catalogLoading && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                No products are registered under {selectedType.name}. Add one under Health → Medications first.
              </p>
            )}
            {selectedProduct && inventoriesForProduct.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {selectedProduct.name} has no usable stock (empty or expired). Add inventory before recording usage.
              </p>
            )}
            {labelHint && labelHint !== "—" && (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                Label: {labelHint}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Administration Info
            </h3>
            <div className="space-y-1">
              <Label htmlFor="administered_by" className="text-xs text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Administered By *
              </Label>
              <Input
                id="administered_by"
                type="text"
                value={formData.administered_by}
                onChange={(e) => handleInputChange("administered_by", e.target.value)}
                placeholder="e.g., Dr. Smith, Farm Manager"
                className={cn("h-9 text-sm", errors.administered_by && "border-red-400")}
              />
              {errors.administered_by && <p className="text-xs text-red-500">{errors.administered_by}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-blue-400" />
                Administration Method *
              </Label>
              <Select
                value={
                  formData.administration_method_id ? String(formData.administration_method_id) : undefined
                }
                onValueChange={(value) => handleInputChange("administration_method_id", Number.parseInt(value, 10))}
              >
                <SelectTrigger className={cn("h-9 text-sm", errors.administration_method_id && "border-red-400")}>
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
              {errors.administration_method_id && (
                <p className="text-xs text-red-500">{errors.administration_method_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-green-500" />
              Amount Used
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dosage" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-green-400" />
                  Amount used *
                </Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.dosage || ""}
                  onChange={(e) => handleInputChange("dosage", Number.parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 10"
                  className={cn("h-9 text-sm", errors.dosage && "border-red-400")}
                />
                {errors.dosage && <p className="text-xs text-red-500">{errors.dosage}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Unit *</Label>
                <Select
                  value={formData.dosage_unit || undefined}
                  onValueChange={(value) => handleInputChange("dosage_unit", value)}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.dosage_unit && "border-red-400")}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICINE_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dosage_unit && <p className="text-xs text-red-500">{errors.dosage_unit}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Purpose</Label>
                <Select
                  value={formData.purpose || "none"}
                  onValueChange={(value) => handleInputChange("purpose", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500">This amount is deducted from inventory.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the medication administration..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Medication Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMedicationRecordModal
