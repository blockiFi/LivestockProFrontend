"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { createFeedInventory, GetToken, getFarm, getFeedTypes, getFeedProducts } from "@/lib/request"

import type { FeedInventoryType } from "@/lib/types"

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
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedTypes, setFeedTypes] = useState<any[]>([])
  const [selectedFeedType, setSelectedFeedType] = useState<string | number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm({ productName: "", manufacturer: "", quantity: "", unit_cost: "", expiry_date: "", batch_number: "", notes: "" })
      setFormError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) return

    // fetch feed types for the farm (poultryTypeId=0 to fetch all)
    ;(async () => {
      try {
        const res: any = await getFeedTypes(token, farm.id, 0, false)

        if (res.success) {
          setFeedTypes(res.data || [])
          console.log("Feed types fetched:", res.data);
        } else if (existingItems && existingItems.length) {
            console.log("Using fallback feed types from existing items");
          // fallback: derive feed types from existing items
          const fallback = Array.from(new Set(existingItems.map((it: any) => (it.poultry_feed_type?.id ? JSON.stringify({ id: it.poultry_feed_type.id, name: it.poultry_feed_type.name }) : null)).filter(Boolean))).map((s: any) => JSON.parse(s))
          if (fallback.length) setFeedTypes(fallback)
        }
      } catch (err) {
        console.error("Error fetching feed types", err)
      }
    })()
    // fetch all products for the farm once on open
    ;(async () => {
      try {
        const prodRes: any = await getFeedProducts(GetToken() || '', (farm as any).id, undefined, false)
        if (prodRes && prodRes.success) {
          setProducts(prodRes.data || [])
          console.log('Feed products fetched:', prodRes.data)
        }
      } catch (err) {
        console.error('Error fetching feed products on open', err)
      }
    })()
  }, [isOpen])

  // when feed type changes we will filter products client-side; clear selected product and form
  useEffect(() => {
    setSelectedProduct(null)
    setForm((f) => ({ ...f, productName: '', manufacturer: '', unit_cost: '' }))
  }, [selectedFeedType])

  const filteredProducts = selectedFeedType ? products.filter((p: any) => Number(p.poultry_feed_type_id) === Number(selectedFeedType)) : products

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.quantity) {
      setFormError("Quantity is required")
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
      quantity: Number(form.quantity),
      unit_cost: Number(form.unit_cost) || 0,
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6 z-10">
        <h2 className="text-lg font-semibold mb-4">Add Feed Inventory</h2>
        {formError && <p className="text-sm text-red-600 mb-2">{formError}</p>}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium">Feed Type</label>
            <Select value={selectedFeedType !== null ? String(selectedFeedType) : 'none'} onValueChange={(v) => setSelectedFeedType(v === 'none' ? null : Number(v))}>
              <SelectTrigger className="w-full">
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
          </div>

          <div>
            <label className="text-sm font-medium">Product</label>
            <Select value={selectedProduct !== null ? String(selectedProduct) : 'none'} onValueChange={(v) => setSelectedProduct(v === 'none' ? null : Number(v))}>
              <SelectTrigger className="w-full">
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
