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
import { Boxes, Building2, CalendarClock, Hash, Package, PackagePlus, StickyNote, Syringe } from "lucide-react"
import { toast } from "react-toastify"
import { cn, formatCurrency, Naira } from "@/lib/utils"
import type { VaccineData, VaccineInventory, VaccineProduct } from "@/lib/types"
import { createVaccineInventory, GetToken, getFarm, getPoultryVaccineData } from "@/lib/request"

type Props = {
  isOpen: boolean
  onClose: () => void
  onCreated?: (item: VaccineInventory) => void
  /** Pre-select this product (and its vaccine) when the modal opens. */
  defaultProductId?: number
}

type CatalogProduct = VaccineProduct & { stock: number }
type CatalogVaccine = { id: number; name: string; products: CatalogProduct[] }

type FormState = {
  poultry_vaccine_id: number
  poultry_vaccine_product_id: number
  quantity: string
  unit_cost: string
  batch_number: string
  manufacture_date: string
  expiry_date: string
  manufacturer: string
  notes: string
}

const emptyForm = (): FormState => ({
  poultry_vaccine_id: 0,
  poultry_vaccine_product_id: 0,
  quantity: "",
  unit_cost: "",
  batch_number: "",
  manufacture_date: "",
  expiry_date: "",
  manufacturer: "",
  notes: "",
})

const todayIso = () => new Date().toISOString().slice(0, 10)

const productStock = (product: VaccineProduct): number =>
  (product.inventories ?? []).reduce(
    (sum, inv) => sum + (Number(inv.available_quantity ?? inv.quantity) || 0),
    0,
  )

const buildCatalog = (vaccines: VaccineData[]): CatalogVaccine[] =>
  vaccines
    .map((vac) => ({
      id: Number(vac.id),
      name: vac.name,
      products: (vac.products ?? [])
        .map((p) => ({ ...p, id: Number(p.id), stock: productStock(p) }))
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

const dosageLabel = (product: VaccineProduct) =>
  product.dosage ? `${product.dosage} ${product.dosage_unit ?? ""}`.trim() : "—"

export default function AddVaccineInventoryModal({ isOpen, onClose, onCreated, defaultProductId }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [catalog, setCatalog] = useState<CatalogVaccine[]>([])
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
        const res = await getPoultryVaccineData(token, farm.id)
        if (cancelled) return
        if (!res.success || !Array.isArray(res.data)) {
          setCatalog([])
          setLoadError("Could not load vaccines. Please try again.")
          return
        }
        const next = buildCatalog(res.data as unknown as VaccineData[])
        setCatalog(next)
        if (defaultProductId) {
          const vaccine = next.find((v) => v.products.some((p) => p.id === defaultProductId))
          const product = vaccine?.products.find((p) => p.id === defaultProductId)
          if (vaccine && product) {
            setForm((prev) => ({
              ...prev,
              poultry_vaccine_id: vaccine.id,
              poultry_vaccine_product_id: product.id,
              manufacturer: product.manufacturer ?? "",
            }))
          }
        }
      } catch {
        if (!cancelled) setLoadError("Could not load vaccines. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isOpen, defaultProductId])

  const selectedVaccine = useMemo(
    () => catalog.find((v) => v.id === form.poultry_vaccine_id),
    [catalog, form.poultry_vaccine_id],
  )
  const products = selectedVaccine?.products ?? []
  const selectedProduct = products.find((p) => p.id === form.poultry_vaccine_product_id)

  const quantity = Number(form.quantity) || 0
  const unitCost = Number(form.unit_cost) || 0
  const totalCost = quantity * unitCost

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const rest = { ...prev }
      delete rest[key]
      return rest
    })
  }

  const handleVaccineChange = (value: string) => {
    const id = Number(value)
    const vaccine = catalog.find((v) => v.id === id)
    const only = vaccine && vaccine.products.length === 1 ? vaccine.products[0] : undefined
    setForm((prev) => ({
      ...prev,
      poultry_vaccine_id: id,
      poultry_vaccine_product_id: only?.id ?? 0,
      manufacturer: only?.manufacturer ?? "",
    }))
    setErrors({})
  }

  const handleProductChange = (value: string) => {
    const id = Number(value)
    const product = products.find((p) => p.id === id)
    setForm((prev) => ({ ...prev, poultry_vaccine_product_id: id, manufacturer: product?.manufacturer ?? "" }))
    setErrors((prev) => {
      const rest = { ...prev }
      delete rest.poultry_vaccine_product_id
      return rest
    })
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.poultry_vaccine_id) next.poultry_vaccine_id = "Select a vaccine"
    if (!form.poultry_vaccine_product_id) next.poultry_vaccine_product_id = "Select a product"
    if (!(quantity > 0)) next.quantity = "Quantity must be greater than 0"
    if (form.unit_cost === "" || unitCost < 0) next.unit_cost = "Enter a unit cost (0 or more)"
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
      const res = await createVaccineInventory(token, farm.id, {
        poultry_vaccine_product_id: form.poultry_vaccine_product_id,
        quantity,
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
      toast.success(`Added ${quantity} to ${selectedProduct?.name ?? "inventory"}`)
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
      title="Add vaccine inventory"
      description="Choose the vaccine and product, then record the batch you received."
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
          disabled={loading || (!!selectedVaccine && products.length === 0)}
        />
      }
    >
      {loadError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{loadError}</p>
      )}

      <FormSection step={1} icon={Syringe} title="Vaccine" description="Which vaccine are you stocking?">
        <FormField label="Vaccine" required error={errors.poultry_vaccine_id}>
          <Select
            value={form.poultry_vaccine_id ? String(form.poultry_vaccine_id) : undefined}
            onValueChange={handleVaccineChange}
            disabled={loading}
          >
            <SelectTrigger className={inputClass(!!errors.poultry_vaccine_id)}>
              <SelectValue placeholder={loading ? "Loading vaccines..." : "Select vaccine"} />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((vaccine) => (
                <SelectItem key={vaccine.id} value={String(vaccine.id)}>
                  <div>
                    <div className="font-medium">{vaccine.name}</div>
                    <div className="text-xs text-slate-500">
                      {vaccine.products.length
                        ? `${vaccine.products.length} product${vaccine.products.length === 1 ? "" : "s"}`
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
        {selectedVaccine && products.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            No products are registered under {selectedVaccine.name}.{" "}
            <Link
              to="/dashboard/poultry/health/vaccination-products"
              className="font-semibold underline"
              onClick={onClose}
            >
              Add a product
            </Link>{" "}
            first, then come back to add stock.
          </div>
        ) : (
          <FormField label="Vaccine product" required error={errors.poultry_vaccine_product_id}>
            <Select
              value={form.poultry_vaccine_product_id ? String(form.poultry_vaccine_product_id) : undefined}
              onValueChange={handleProductChange}
              disabled={!selectedVaccine}
            >
              <SelectTrigger className={inputClass(!!errors.poultry_vaccine_product_id)}>
                <SelectValue placeholder={selectedVaccine ? "Select product" : "Select a vaccine first"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        {product.manufacturer || "Unknown manufacturer"}
                        {" · "}
                        {product.stock > 0 ? `${product.stock} in stock` : "No stock yet"}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
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
                {selectedProduct.stock}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Minimum stock</dt>
              <dd className="font-medium text-slate-900">{Number(selectedProduct.min_stock_level ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Dosage</dt>
              <dd className="font-medium text-slate-900">{dosageLabel(selectedProduct)}</dd>
            </div>
          </dl>
        )}
      </FormSection>

      <FormSection step={3} icon={Boxes} title="Batch details" description="Quantity, cost and dates for the stock received.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Quantity" required htmlFor="vac-inv-qty" error={errors.quantity}>
            <Input
              id="vac-inv-qty"
              type="number"
              min={0}
              step="0.01"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder="e.g. 10"
              className={inputClass(!!errors.quantity)}
            />
          </FormField>

          <FormField label={`Unit cost (${Naira})`} required htmlFor="vac-inv-cost" error={errors.unit_cost}>
            <Input
              id="vac-inv-cost"
              type="number"
              min={0}
              step="0.01"
              value={form.unit_cost}
              onChange={(e) => setField("unit_cost", e.target.value)}
              placeholder="e.g. 2500"
              className={inputClass(!!errors.unit_cost)}
            />
          </FormField>

          <FormSummary className="sm:col-span-2" label="Total cost" value={`${Naira}${formatCurrency(totalCost)}`} />

          <FormField label="Batch number" htmlFor="vac-inv-batch" error={errors.batch_number}>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-batch"
                value={form.batch_number}
                onChange={(e) => setField("batch_number", e.target.value)}
                placeholder="e.g. LAS-2026-01"
                className={cn(inputClass(!!errors.batch_number), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Manufacturer" htmlFor="vac-inv-mfr" hint="Defaults to the product's manufacturer" error={errors.manufacturer}>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-mfr"
                value={form.manufacturer}
                onChange={(e) => setField("manufacturer", e.target.value)}
                className={cn(inputClass(!!errors.manufacturer), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Manufacture date" htmlFor="vac-inv-mfd" error={errors.manufacture_date}>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-mfd"
                type="date"
                max={todayIso()}
                value={form.manufacture_date}
                onChange={(e) => setField("manufacture_date", e.target.value)}
                className={cn(inputClass(!!errors.manufacture_date), "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Expiry date" htmlFor="vac-inv-exp" error={errors.expiry_date}>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-exp"
                type="date"
                min={todayIso()}
                value={form.expiry_date}
                onChange={(e) => setField("expiry_date", e.target.value)}
                className={cn(inputClass(!!errors.expiry_date), "pl-9")}
              />
            </div>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes" htmlFor="vac-inv-notes" error={errors.notes}>
              <div className="relative">
                <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Textarea
                  id="vac-inv-notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Supplier, cold-chain notes, etc."
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
