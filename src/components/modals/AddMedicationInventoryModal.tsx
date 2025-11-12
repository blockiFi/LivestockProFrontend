"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { createMedicationInventory, GetToken, getFarm } from "@/lib/request"
import type { MedicationInventory } from "@/lib/types"

export default function AddMedicationInventoryModal({
  isOpen,
  onClose,
  onCreated,
  existingItems = [],
}: {
  isOpen: boolean
  onClose: () => void
  onCreated?: (item: MedicationInventory) => void
  existingItems?: MedicationInventory[]
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
    const medication_product_id = matchedProduct ? (matchedProduct.medication_product_id ?? ((matchedProduct.product as any)?.id ?? null)) : null

    const payload: any = {
      medication_product_id: medication_product_id ?? 0,
      quantity: Number(form.quantity),
      unit_cost: Number(form.unit_cost) || 0,
      batch_number: form.batch_number || undefined,
      expiry_date: form.expiry_date || undefined,
      notes: form.notes || undefined,
    }

    setIsSubmitting(true)
    try {
      const res = await createMedicationInventory(token, farm.id, payload)
      if (!res.success) {
        const msg = Array.isArray(res.error) ? res.error.join("; ") : String(res.error ?? "Failed to create")
        setFormError(msg)
        toast.error(msg)
        setIsSubmitting(false)
        return
      }

      const created = res.data as MedicationInventory
      toast.success("Medication inventory added")
      onCreated?.(created)
      onClose()
    } catch (err) {
      console.error("Create medication inventory error", err)
      const msg = err instanceof Error ? err.message : "Failed to create medication inventory"
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6 z-10">
        <h2 className="text-lg font-semibold mb-4">Add Medication Inventory</h2>
        {formError && <p className="text-sm text-red-600 mb-2">{formError}</p>}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium">Product</label>
            {categories.length > 0 ? (
              <Select value={form.productName} onValueChange={(v) => setForm({ ...form, productName: v })}>
                <SelectTrigger className="w-full">
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
              <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Manufacturer</label>
            <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} type="number" className="w-full border rounded px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Unit Cost</label>
              <input value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} type="number" className="w-full border rounded px-3 py-2 mt-1" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Expiry Date</label>
            <input value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} type="date" className="w-full border rounded px-3 py-2 mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Batch Number</label>
            <input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Inventory'}</Button>
        </div>
      </form>
    </div>
  )
}
