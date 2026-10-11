"use client"
import React, { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Boxes, Building2, CalendarClock, Hash, PackagePlus, StickyNote, Syringe } from "lucide-react"
import { toast } from "react-toastify"
import { Naira } from "@/lib/utils"
import { createVaccineInventory, GetToken, getFarm } from "@/lib/request"
import type { VaccineInventory } from "@/lib/types"

export default function AddVaccineInventoryModal({
  isOpen,
  onClose,
  onCreated,
  existingItems = [],
}: {
  isOpen: boolean
  onClose: () => void
  onCreated?: (item: VaccineInventory) => void
  existingItems?: VaccineInventory[]
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
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setForm({ productName: "", manufacturer: "", quantity: "", unit_cost: "", expiry_date: "", batch_number: "", notes: "" })
      setFormError(null)
    }
  }, [isOpen])

  const categories = Array.from(new Set(existingItems.map((item) => ((item.product as any)?.name ?? "").toString()))).filter((c) => !!c)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.productName || !form.quantity) {
      setFormError("Product name and quantity are required")
      return
    }

    const farm = getFarm()
    const token = GetToken()
    if (!farm || !token) {
      setFormError("Unable to determine active farm or auth token")
      return
    }

    const matchedProduct = existingItems.find((it) => ((it.product as any)?.name ?? "") === form.productName)
    const poultry_vaccine_product_id = matchedProduct ? (matchedProduct.poultry_vaccine_product_id ?? ((matchedProduct.product as any)?.id ?? null)) : null

    const payload: any = {
      poultry_vaccine_product_id: poultry_vaccine_product_id ?? 0,
      quantity: Number(form.quantity),
      unit_cost: Number(form.unit_cost) || 0,
      batch_number: form.batch_number || undefined,
      expiry_date: form.expiry_date || undefined,
      notes: form.notes || undefined,
    }

    setIsSubmitting(true)
    try {
      const res = await createVaccineInventory(token, farm.id, payload)
      if (!res.success) {
        const msg = Array.isArray(res.error) ? res.error.join("; ") : String(res.error ?? "Failed to create")
        setFormError(msg)
        toast.error(msg)
        setIsSubmitting(false)
        return
      }

      const created = res.data as VaccineInventory
      toast.success("Vaccine inventory added")
      onCreated?.(created)
      onClose()
    } catch (err) {
      console.error("Create inventory error", err)
      const msg = err instanceof Error ? err.message : "Failed to create inventory"
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Add Vaccine Inventory"
      description="Record a batch of vaccine received into stock."
      icon={PackagePlus}
      tone="inventory"
      size="md"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitLabel="Add Inventory"
          busyLabel="Adding..."
          busy={isSubmitting}
        />
      }
    >
      {formError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
      )}

      <FormSection step={1} icon={Syringe} title="Product" description="Which vaccine product is this stock for?">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Product" required htmlFor="vac-inv-product">
            {categories.length > 0 ? (
              <Select value={form.productName} onValueChange={(v) => setForm({ ...form, productName: v })}>
                <SelectTrigger id="vac-inv-product" className={formInputClass()}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="vac-inv-product"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className={formInputClass()}
              />
            )}
          </FormField>

          <FormField label="Manufacturer" htmlFor="vac-inv-mfr">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-mfr"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection step={2} icon={Boxes} title="Batch details" description="Quantity, cost and batch information.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Quantity" required htmlFor="vac-inv-qty">
            <Input
              id="vac-inv-qty"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              type="number"
              className={formInputClass()}
            />
          </FormField>

          <FormField label={`Unit Cost (${Naira})`} htmlFor="vac-inv-cost">
            <Input
              id="vac-inv-cost"
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
              type="number"
              className={formInputClass()}
            />
          </FormField>

          <FormField label="Expiry Date" htmlFor="vac-inv-exp">
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-exp"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                type="date"
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Batch Number" htmlFor="vac-inv-batch">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="vac-inv-batch"
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Notes" htmlFor="vac-inv-notes" className="sm:col-span-2">
            <div className="relative">
              <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Textarea
                id="vac-inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={formTextareaClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}
