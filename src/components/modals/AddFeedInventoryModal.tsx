"use client"
import React, { useMemo, useState, useEffect } from "react"
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
import { Boxes, Building2, CalendarClock, Hash, PackagePlus, Scale, StickyNote, Wheat } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { createFeedInventory, GetToken, getFarm, getFeedTypes, getFeedProducts } from "@/lib/request"
import { bagsToKg, FEED_BAG_KG, formatBagsFromKg } from "@/lib/feed-bags"

import type { FeedInventoryType } from "@/lib/types"

type EntryMode = "bag" | "kg"

export default function AddFeedInventoryModal({
  isOpen,
  onClose,
  onCreated,
  existingItems = [],
}: {
  isOpen: boolean
  onClose: () => void
  onCreated?: (item: FeedInventoryType) => void
  existingItems?: FeedInventoryType[]
}) {
  const [form, setForm] = useState({
    productName: "",
    manufacturer: "",
    quantity: "",
    unit_cost: "",
    expiry_date: "",
    batch_number: "",
    notes: "",
  })
  const [entryMode, setEntryMode] = useState<EntryMode>("bag")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedTypes, setFeedTypes] = useState<any[]>([])
  const [selectedFeedType, setSelectedFeedType] = useState<string | number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm({ productName: "", manufacturer: "", quantity: "", unit_cost: "", expiry_date: "", batch_number: "", notes: "" })
      setEntryMode("bag")
      setFormError(null)
      setSelectedFeedType(null)
      setSelectedProduct(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) return

    const deriveFallbackTypes = () => {
      const byId = new Map<number, { id: number; name: string }>()
      for (const it of existingItems || []) {
        const ft =
          (it as any).poultry_feed_type ||
          (it as any).feed_type ||
          null
        if (ft?.id) {
          byId.set(Number(ft.id), { id: Number(ft.id), name: String(ft.name || `Feed type #${ft.id}`) })
        } else if ((it as any).poultry_feed_type_id) {
          const id = Number((it as any).poultry_feed_type_id)
          if (!byId.has(id)) byId.set(id, { id, name: `Feed type #${id}` })
        }
      }
      return Array.from(byId.values())
    }

    // fetch feed types for the farm (poultryTypeId=0 to fetch all)
    ;(async () => {
      try {
        const res: any = await getFeedTypes(token, farm.id, 0, false)

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFeedTypes(res.data)
        } else {
          const fallback = deriveFallbackTypes()
          setFeedTypes(fallback)
          if (!res.success) {
            console.error("Feed types fetch failed:", res.error)
          }
        }
      } catch (err) {
        console.error("Error fetching feed types", err)
        setFeedTypes(deriveFallbackTypes())
      }
    })()
    // fetch all products for the farm once on open
    ;(async () => {
      try {
        const prodRes: any = await getFeedProducts(GetToken() || '', (farm as any).id, undefined, false)
        if (prodRes && prodRes.success) {
          setProducts(prodRes.data || [])
        }
      } catch (err) {
        console.error('Error fetching feed products on open', err)
      }
    })()
  }, [isOpen, existingItems])

  // when feed type changes we will filter products client-side; clear selected product and form
  useEffect(() => {
    setSelectedProduct(null)
    setForm((f) => ({ ...f, productName: '', manufacturer: '', unit_cost: '' }))
  }, [selectedFeedType])

  const filteredProducts = selectedFeedType ? products.filter((p: any) => Number(p.poultry_feed_type_id) === Number(selectedFeedType)) : products

  const quantityValue = Number(form.quantity)
  const costValue = Number(form.unit_cost)

  const quantityKg = useMemo(() => {
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) return 0
    return entryMode === "bag" ? bagsToKg(quantityValue) : quantityValue
  }, [entryMode, quantityValue])

  const unitCostPerKg = useMemo(() => {
    if (!Number.isFinite(costValue) || costValue < 0) return 0
    return entryMode === "bag" ? costValue / FEED_BAG_KG : costValue
  }, [costValue, entryMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.quantity || !Number.isFinite(quantityValue) || quantityValue <= 0) {
      setFormError(entryMode === "bag" ? "Number of bags is required" : "Quantity in kg is required")
      return
    }

    if (form.unit_cost && (!Number.isFinite(costValue) || costValue < 0)) {
      setFormError(entryMode === "bag" ? "Cost per bag must be a valid number" : "Cost per kg must be a valid number")
      return
    }

    const farm = getFarm()
    const token = GetToken()
    if (!farm || !token) {
      setFormError("Unable to determine active farm or auth token")
      return
    }

    const payload: any = {
      poultry_feed_type_id: selectedFeedType ? Number(selectedFeedType) : undefined,
      poultry_feed_product_id: selectedProduct ? Number(selectedProduct) : undefined,
      quantity: quantityKg,
      unit_cost: unitCostPerKg,
      batch_number: form.batch_number || undefined,
      expiry_date: form.expiry_date || undefined,
      notes: form.notes || undefined,
    }

    setIsSubmitting(true)
    try {
      const res = await createFeedInventory(token, farm.id, payload)
      if (!res.success) {
        const msg = Array.isArray(res.error) ? res.error.join("; ") : String(res.error ?? "Failed to create")
        setFormError(msg)
        toast.error(msg)
        setIsSubmitting(false)
        return
      }

      const created = res.data as FeedInventoryType
      toast.success("Feed inventory added")
      onCreated?.(created)
      onClose()
    } catch (err) {
      console.error("Create feed inventory error", err)
      const msg = err instanceof Error ? err.message : "Failed to create feed inventory"
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalValue = quantityKg * unitCostPerKg

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Add feed inventory"
      description="Pick the feed and product, then record the stock you received."
      icon={PackagePlus}
      tone="feed"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitLabel="Add inventory"
          busyLabel="Adding..."
          busy={isSubmitting}
        />
      }
    >
      {formError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
      )}

      <FormSection step={1} icon={Wheat} title="Feed" description="Which feed type and product is this stock for?">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Feed type">
            <Select value={selectedFeedType !== null ? String(selectedFeedType) : 'none'} onValueChange={(v) => setSelectedFeedType(v === 'none' ? null : Number(v))}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select type</SelectItem>
                {feedTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Product">
            <Select value={selectedProduct !== null ? String(selectedProduct) : 'none'} onValueChange={(v) => setSelectedProduct(v === 'none' ? null : Number(v))}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select product</SelectItem>
                {filteredProducts.length === 0 ? (
                  <SelectItem value="no_products" disabled>
                    No products available
                  </SelectItem>
                ) : (
                  filteredProducts.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.sku ? `(${p.sku})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Manufacturer" htmlFor="feed-inv-mfr" className="sm:col-span-2">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="feed-inv-mfr"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step={2}
        icon={Scale}
        title="Quantity & cost"
        description="Enter stock in bags or kilograms."
        action={
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setEntryMode("bag")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition",
                entryMode === "bag" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Bags ({FEED_BAG_KG}kg)
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("kg")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition",
                entryMode === "kg" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
              )}
            >
              Kilograms
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={entryMode === "bag" ? `Bags (${FEED_BAG_KG}kg each)` : "Quantity (kg)"}
            htmlFor="feed-inv-qty"
            required
            hint={
              quantityKg > 0
                ? entryMode === "bag"
                  ? `Total: ${quantityKg} kg`
                  : `Equals ${formatBagsFromKg(quantityKg)}`
                : undefined
            }
          >
            <Input
              id="feed-inv-qty"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              type="number"
              min="0"
              step={entryMode === "bag" ? "1" : "0.01"}
              placeholder={entryMode === "bag" ? "e.g. 10" : "e.g. 250"}
              className={formInputClass()}
            />
          </FormField>

          <FormField
            label={entryMode === "bag" ? "Cost per bag" : "Cost per kg"}
            htmlFor="feed-inv-cost"
            hint={
              Number.isFinite(costValue) && costValue > 0
                ? entryMode === "bag"
                  ? `≈ ₦${unitCostPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} / kg`
                  : `≈ ₦${(costValue * FEED_BAG_KG).toLocaleString(undefined, { maximumFractionDigits: 2 })} / bag`
                : undefined
            }
          >
            <Input
              id="feed-inv-cost"
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              placeholder={entryMode === "bag" ? "e.g. 12500" : "e.g. 500"}
              className={formInputClass()}
            />
          </FormField>

          {quantityKg > 0 && Number.isFinite(costValue) && costValue > 0 && (
            <FormSummary
              className="sm:col-span-2"
              label={`${quantityKg} kg (${formatBagsFromKg(quantityKg)}) at ₦${unitCostPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}/kg`}
              value={`₦${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            />
          )}
        </div>
      </FormSection>

      <FormSection step={3} icon={Boxes} title="Batch details" description="Optional tracking details for this stock.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Batch number" htmlFor="feed-inv-batch">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="feed-inv-batch"
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Expiry date" htmlFor="feed-inv-exp">
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="feed-inv-exp"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Notes" htmlFor="feed-inv-notes" className="sm:col-span-2">
            <div className="relative">
              <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Textarea
                id="feed-inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Supplier, storage notes, etc."
                className={formTextareaClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}
