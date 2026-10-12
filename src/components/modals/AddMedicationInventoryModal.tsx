import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Boxes,
  Building2,
  CalendarClock,
  Hash,
  Package,
  PackagePlus,
  Pill,
  StickyNote,
} from "lucide-react"
import { toast } from "react-toastify"
import { cn, formatCurrency, Naira } from "@/lib/utils"
import type { MedicationData, MedicationInventory, MedicationProduct } from "@/lib/types"
import { createMedicationInventory, GetToken, getFarm, getPoultryMedicationData } from "@/lib/request"
import { formatMedicationDosageSummary } from "@/lib/medicationDosage"
import {
  baseUnitOf,
  formatAmount,
  packNoun,
  productHasPackSize,
  productPackSizeBase,
  stockSummary,
} from "@/lib/medicationPack"

type Props = {
  isOpen: boolean
  onClose: () => void
  onCreated?: (item: MedicationInventory) => void
  /** Pre-select this product (and its medication type) when the modal opens. */
  defaultProductId?: number
}

type CatalogProduct = MedicationProduct & { stock: number; stockLabel: string }
type CatalogType = { id: number; name: string; products: CatalogProduct[] }

type FormState = {
  poultry_medication_id: number
  medication_product_id: number
  quantity: string
  unit_cost: string
  batch_number: string
  manufacture_date: string
  expiry_date: string
  manufacturer: string
  notes: string
}

const emptyForm = (): FormState => ({
  poultry_medication_id: 0,
  medication_product_id: 0,
  quantity: "",
  unit_cost: "",
  batch_number: "",
  manufacture_date: "",
  expiry_date: "",
  manufacturer: "",
  notes: "",
})

const todayIso = () => new Date().toISOString().slice(0, 10)

const productBatches = (product: MedicationProduct): MedicationInventory[] => {
  const raw = product as MedicationProduct & { inventories?: MedicationInventory[] }
  return raw.inventories ?? raw.inventory ?? []
}

const productStock = (product: MedicationProduct): number =>
  productBatches(product).reduce((sum, inv) => sum + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)

const buildCatalog = (medications: MedicationData[]): CatalogType[] =>
  medications
    .map((med) => ({
      id: Number(med.id),
      name: med.name,
      products: (med.products ?? [])
        .map((p) => ({
          ...p,
          id: Number(p.id),
          stock: productStock(p),
          stockLabel: stockSummary(productBatches(p), p),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

/** Flatten a server error payload (field map or list) into per-field messages. */
const parseServerErrors = (error: unknown): { fields: Record<string, string>; message: string } => {
  if (error && typeof error === "object" && !Array.isArray(error)) {
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(error as Record<string, unknown>)) {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value)
    }
    return { fields, message: Object.values(fields)[0] ?? "Failed to add inventory" }
  }
  const list = Array.isArray(error) ? error.filter(Boolean).map(String) : []
  return { fields: {}, message: list.join("; ") || "Failed to add inventory" }
}

export default function AddMedicationInventoryModal({ isOpen, onClose, onCreated, defaultProductId }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [catalog, setCatalog] = useState<CatalogType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(emptyForm())
    setErrors({})
    setLoadError(null)
    let cancelled = false

    const load = async () => {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) {
        setLoadError("Unable to determine active farm or auth token")
        return
      }
      setLoading(true)
      try {
        const res = await getPoultryMedicationData(token, farm.id)
        if (cancelled) return
        if (!res.success || !Array.isArray(res.data)) {
          setCatalog([])
          setLoadError("Could not load medications. Please try again.")
          return
        }
        const next = buildCatalog(res.data as unknown as MedicationData[])
        setCatalog(next)
        if (defaultProductId) {
          const type = next.find((t) => t.products.some((p) => p.id === defaultProductId))
          const product = type?.products.find((p) => p.id === defaultProductId)
          if (type && product) {
            setForm((prev) => ({
              ...prev,
              poultry_medication_id: type.id,
              medication_product_id: product.id,
              manufacturer: product.manufacturer ?? "",
            }))
          }
        }
      } catch {
        if (!cancelled) setLoadError("Could not load medications. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isOpen, defaultProductId])

  const selectedType = useMemo(
    () => catalog.find((t) => t.id === form.poultry_medication_id),
    [catalog, form.poultry_medication_id],
  )
  const products = selectedType?.products ?? []
  const selectedProduct = products.find((p) => p.id === form.medication_product_id)

  const quantity = Number(form.quantity) || 0
  const unitCost = Number(form.unit_cost) || 0
  const totalCost = quantity * unitCost

  const hasPackSize = productHasPackSize(selectedProduct)
  const packType = selectedProduct?.pack_type ?? null
  const packWord = packNoun(packType, 1)
  const packSizeBase = productPackSizeBase(selectedProduct)
  const contentUnit = baseUnitOf(selectedProduct?.pack_size_unit)
  const contentSummary =
    hasPackSize && quantity > 0 && packSizeBase && contentUnit
      ? `${Number(quantity.toFixed(2))} ${packNoun(packType, quantity)} × ${formatAmount(
          Number(selectedProduct!.pack_size),
          selectedProduct!.pack_size_unit!,
        )} = ${formatAmount(quantity * packSizeBase, contentUnit)}`
      : null

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const rest = { ...prev }
      delete rest[key]
      return rest
    })
  }

  const handleTypeChange = (value: string) => {
    const id = Number(value)
    const type = catalog.find((t) => t.id === id)
    const only = type && type.products.length === 1 ? type.products[0] : undefined
    setForm((prev) => ({
      ...prev,
      poultry_medication_id: id,
      medication_product_id: only?.id ?? 0,
      manufacturer: only?.manufacturer ?? "",
    }))
    setErrors({})
  }

  const handleProductChange = (value: string) => {
    const id = Number(value)
    const product = products.find((p) => p.id === id)
    setForm((prev) => ({ ...prev, medication_product_id: id, manufacturer: product?.manufacturer ?? "" }))
    setErrors((prev) => {
      const rest = { ...prev }
      delete rest.medication_product_id
      return rest
    })
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.poultry_medication_id) next.poultry_medication_id = "Select a medication type"
    if (!form.medication_product_id) next.medication_product_id = "Select a product"
    else if (!hasPackSize) next.medication_product_id = "Set the pack size on this product before adding stock."
    if (!(quantity > 0)) next.quantity = `Enter the number of ${packNoun(packType, 2)} (more than 0)`
    if (form.unit_cost === "" || unitCost < 0) next.unit_cost = `Enter the cost per ${packWord} (0 or more)`
    if (form.expiry_date && form.expiry_date < todayIso()) next.expiry_date = "Expiry date cannot be in the past"
    if (form.expiry_date && form.manufacture_date && form.expiry_date <= form.manufacture_date)
      next.expiry_date = "Expiry date must be after the manufacture date"
    if (form.manufacture_date && form.manufacture_date > todayIso())
      next.manufacture_date = "Manufacture date cannot be in the future"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) {
      toast.error("Unable to determine active farm or auth token")
      return
    }

    setSubmitting(true)
    try {
      const res = await createMedicationInventory(token, farm.id, {
        medication_product_id: form.medication_product_id,
        packs_received: quantity,
        unit_cost: unitCost,
        batch_number: form.batch_number.trim() || undefined,
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date || null,
        manufacturer: form.manufacturer.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      if (!res.success || !res.data) {
        const { fields, message } = parseServerErrors(res.error)
        setErrors(fields)
        toast.error(message)
        return
      }
      toast.success(
        `Added ${Number(quantity.toFixed(2))} ${packNoun(packType, quantity)} to ${selectedProduct?.name ?? "inventory"}`,
      )
      onCreated?.(res.data)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = formInputClass

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Add medication inventory"
      description="Choose the medication and product, then record the batch you received."
      icon={PackagePlus}
      tone="inventory"
      size="lg"
      busy={submitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel="Add inventory"
          busyLabel="Adding..."
          busy={submitting}
          disabled={loading || (!!selectedType && products.length === 0) || (!!selectedProduct && !hasPackSize)}
        />
      }
    >
      {loadError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{loadError}</p>
      )}

      <FormSection step={1} icon={Pill} title="Medication" description="Which kind of medication are you stocking?">
        <FormField label="Medication type" required error={errors.poultry_medication_id}>
          <Select
            value={form.poultry_medication_id ? String(form.poultry_medication_id) : undefined}
            onValueChange={handleTypeChange}
            disabled={loading}
          >
            <SelectTrigger className={inputClass(!!errors.poultry_medication_id)}>
              <SelectValue placeholder={loading ? "Loading medications..." : "Select medication type"} />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-slate-500">
                      {type.products.length
                        ? `${type.products.length} product${type.products.length === 1 ? "" : "s"}`
                        : "No products yet"}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <FormSection step={2} icon={Package} title="Product" description="The specific product this batch is for.">
        {selectedType && products.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            No products are registered under {selectedType.name}.{" "}
            <Link to="/dashboard/poultry/health/medication-products" className="font-semibold underline" onClick={onClose}>
              Add a product
            </Link>{" "}
            first, then come back to add stock.
          </div>
        ) : (
          <FormField label="Medication product" required error={errors.medication_product_id}>
            <Select
              value={form.medication_product_id ? String(form.medication_product_id) : undefined}
              onValueChange={handleProductChange}
              disabled={!selectedType}
            >
              <SelectTrigger className={inputClass(!!errors.medication_product_id)}>
                <SelectValue placeholder={selectedType ? "Select product" : "Select a medication type first"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        {product.manufacturer || "Unknown manufacturer"}
                        {" · "}
                        {product.stock > 0 ? `${product.stockLabel} in stock` : "No stock yet"}
                        {product.pack_label ? ` · ${product.pack_label}` : " · No pack size"}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        {selectedProduct && !hasPackSize && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            {selectedProduct.name} has no pack size yet, so stock can't be measured.{" "}
            <Link to="/dashboard/poultry/health/medication-products" className="font-semibold underline" onClick={onClose}>
              Edit product
            </Link>{" "}
            to set what one pack contains (e.g. a sachet of 100 g), then come back.
          </div>
        )}

        {selectedProduct && (
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Manufacturer</dt>
              <dd className="font-medium text-slate-900">{selectedProduct.manufacturer || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Current stock</dt>
              <dd className={cn("font-medium", selectedProduct.stock > 0 ? "text-emerald-700" : "text-slate-900")}>
                {selectedProduct.stock > 0 ? selectedProduct.stockLabel : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Pack size</dt>
              <dd className="font-medium text-slate-900">{selectedProduct.pack_label || "Not set"}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-slate-500">Label dosage</dt>
              <dd className="font-medium text-slate-900">
                {formatMedicationDosageSummary(selectedProduct as unknown as Record<string, unknown>)}
              </dd>
            </div>
          </dl>
        )}
      </FormSection>

      <FormSection step={3} icon={Boxes} title="Batch details" description="Quantity, cost and dates for the stock received.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={`Number of ${packNoun(packType, 2)}`}
            required
            htmlFor="med-inv-qty"
            error={errors.quantity}
          >
            <Input
              id="med-inv-qty"
              type="number"
              min={0}
              step="0.01"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder="e.g. 2"
              className={inputClass(!!errors.quantity)}
            />
          </FormField>

          <FormField label={`Cost per ${packWord} (${Naira})`} required htmlFor="med-inv-cost" error={errors.unit_cost}>
            <Input
              id="med-inv-cost"
              type="number"
              min={0}
              step="0.01"
              value={form.unit_cost}
              onChange={(e) => setField("unit_cost", e.target.value)}
              placeholder="e.g. 1500"
              className={inputClass(!!errors.unit_cost)}
            />
          </FormField>

          <FormSummary
            className="sm:col-span-2"
            label={contentSummary ?? "Total cost"}
            value={`${Naira}${formatCurrency(totalCost)}`}
          />

          <FormField label="Batch number" htmlFor="med-inv-batch" error={errors.batch_number}>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="med-inv-batch"
                value={form.batch_number}
                onChange={(e) => setField("batch_number", e.target.value)}
                placeholder="e.g. OXY-2026-01"
                className={cn(inputClass(!!errors.batch_number), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Manufacturer" htmlFor="med-inv-mfr" hint="Defaults to the product's manufacturer" error={errors.manufacturer}>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="med-inv-mfr"
                value={form.manufacturer}
                onChange={(e) => setField("manufacturer", e.target.value)}
                className={cn(inputClass(!!errors.manufacturer), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Manufacture date" htmlFor="med-inv-mfd" error={errors.manufacture_date}>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="med-inv-mfd"
                type="date"
                max={todayIso()}
                value={form.manufacture_date}
                onChange={(e) => setField("manufacture_date", e.target.value)}
                className={cn(inputClass(!!errors.manufacture_date), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Expiry date" htmlFor="med-inv-exp" error={errors.expiry_date}>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="med-inv-exp"
                type="date"
                min={todayIso()}
                value={form.expiry_date}
                onChange={(e) => setField("expiry_date", e.target.value)}
                className={cn(inputClass(!!errors.expiry_date), "pl-9")}
              />
            </div>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes" htmlFor="med-inv-notes" error={errors.notes}>
              <div className="relative">
                <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Textarea
                  id="med-inv-notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Supplier, storage instructions, etc."
                  className={formTextareaClass(false, "pl-9")}
                />
              </div>
            </FormField>
          </div>
        </div>
      </FormSection>
    </FormModal>
  )
}
