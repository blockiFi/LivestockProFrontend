import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import type { FarmSettings, InvoiceItem } from "@/lib/types"
import type { RootState } from "@/store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/currency"
import CustomerPicker, { type CustomerSelection } from "@/components/crm/CustomerPicker"
import { createInvoice, getCustomer } from "@/lib/crmRequest"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  farmSettings?: FarmSettings | null
  defaultCustomerId?: number | null
}

const emptyCustomer = (): CustomerSelection => ({
  customer_id: null,
  customer_name: "",
  customer_phone: "",
})

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onCreated,
  farmSettings,
  defaultCustomerId = null,
}: CreateInvoiceModalProps) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [customer, setCustomer] = useState<CustomerSelection>(emptyCustomer())
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const taxRate = useMemo(() => Number(farmSettings?.invoice_tax_rate ?? 10), [farmSettings?.invoice_tax_rate])
  const taxEnabled = farmSettings?.invoice_tax_enabled ?? true

  useEffect(() => {
    if (!open) return
    setDueDate("")
    setNotes("")
    setItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
    if (!defaultCustomerId) {
      setCustomer(emptyCustomer())
      return
    }
    setCustomer({ customer_id: defaultCustomerId, customer_name: "", customer_phone: "" })
    if (!token || !farmId) return
    void getCustomer(token, farmId, defaultCustomerId).then((res) => {
      if (!res.success || !res.data?.customer) return
      setCustomer({
        customer_id: res.data.customer.id,
        customer_name: res.data.customer.name,
        customer_phone: res.data.customer.phone ?? "",
      })
    })
  }, [open, defaultCustomerId, token, farmId])

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    if (field === "description") {
      item.description = String(value)
    } else if (field === "quantity") {
      item.quantity = Number(value)
    } else if (field === "unitPrice") {
      item.unitPrice = Number(value)
    }
    item.total = item.quantity * item.unitPrice
    newItems[index] = item
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = taxEnabled ? Math.round(subtotal * (taxRate / 100)) : 0
  const total = subtotal + tax

  const handleCreate = async () => {
    if (!token || !farmId) return
    if (!customer.customer_id) {
      toast.error("Please select a customer for this invoice")
      return
    }
    if (!dueDate) {
      toast.error("Due date is required")
      return
    }
    if (items.length === 0 || items.some((item) => !item.description.trim() || item.quantity <= 0)) {
      toast.error("Add at least one valid line item")
      return
    }

    setSubmitting(true)
    const res = await createInvoice(token, farmId, {
      customer_id: customer.customer_id,
      invoice_date: today,
      due_date: dueDate,
      status: "pending",
      notes: notes.trim() || null,
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    })
    setSubmitting(false)

    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to create invoice")
      return
    }

    toast.success("Invoice created")
    onOpenChange(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null
          if (
            target?.closest(
              '[data-slot="popover-content"], [data-slot="sheet-content"], [data-slot="sheet-overlay"], [data-slot="select-content"], [data-radix-popper-content-wrapper]'
            )
          ) {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null
          if (
            target?.closest(
              '[data-slot="popover-content"], [data-slot="sheet-content"], [data-slot="sheet-overlay"], [data-slot="select-content"], [data-radix-popper-content-wrapper]'
            )
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-muted-foreground">Invoice number</p>
            <p className="text-lg font-semibold text-blue-600">Assigned automatically on save</p>
          </div>

          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-foreground">Client information</h3>
            <CustomerPicker value={customer} onChange={setCustomer} />
            <Input type="date" placeholder="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">Line items</h3>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add item
              </Button>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[1fr_88px_112px_112px_40px] sm:gap-3 sm:items-end px-1">
              <Label className="text-xs font-medium text-muted-foreground">Name</Label>
              <Label className="text-xs font-medium text-muted-foreground">Quantity</Label>
              <Label className="text-xs font-medium text-muted-foreground">Unit price</Label>
              <Label className="text-xs font-medium text-muted-foreground">Total</Label>
              <span className="sr-only">Remove</span>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 sm:grid-cols-[1fr_88px_112px_112px_40px] sm:items-end rounded-lg border bg-slate-50/50 p-3 sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor={`invoice-item-name-${index}`} className="text-xs sm:sr-only">
                      Name
                    </Label>
                    <Input
                      id={`invoice-item-name-${index}`}
                      placeholder="Item name"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <div className="space-y-1.5">
                      <Label htmlFor={`invoice-item-qty-${index}`} className="text-xs sm:sr-only">
                        Quantity
                      </Label>
                      <Input
                        id={`invoice-item-qty-${index}`}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`invoice-item-price-${index}`} className="text-xs sm:sr-only">
                        Unit price
                      </Label>
                      <Input
                        id={`invoice-item-price-${index}`}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:sr-only">Total</Label>
                    <div className="flex h-10 items-center justify-between rounded-md border bg-white px-3 sm:justify-end">
                      <span className="text-xs text-muted-foreground sm:hidden">Total</span>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(item.total, { farmSettings })}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end sm:justify-center">
                    {items.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => removeItem(index)}
                        aria-label="Remove line item"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    ) : (
                      <div className="hidden sm:block sm:h-10 sm:w-10" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-muted-foreground">
              Tax {taxEnabled ? `(${taxRate}%)` : "disabled"} is calculated server-side from farm settings.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal, { farmSettings })}</span>
            </div>
            {taxEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated tax ({taxRate}%):</span>
                <span className="font-medium">{formatCurrency(tax, { farmSettings })}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Estimated total:</span>
              <span className="text-blue-600">{formatCurrency(total, { farmSettings })}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Notes (optional)</label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? "Creating..." : "Create invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
