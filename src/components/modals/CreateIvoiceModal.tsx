
import { useEffect, useMemo, useState } from "react"
import type { FarmSettings, Invoice, InvoiceItem } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateInvoice: (invoice: Omit<Invoice, "id">) => void
  farmSettings?: FarmSettings | null
}

export function CreateInvoiceModal({ open, onOpenChange, onCreateInvoice, farmSettings }: CreateInvoiceModalProps) {
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentInstructions, setPaymentInstructions] = useState(farmSettings?.invoice_payment_instructions ?? "")
  const [taxEnabled, setTaxEnabled] = useState(farmSettings?.invoice_tax_enabled ?? true)
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
  const taxRate = useMemo(() => Number(farmSettings?.invoice_tax_rate ?? 10), [farmSettings?.invoice_tax_rate])

  const today = new Date().toISOString().split("T")[0]
  const invoiceNumber = `${farmSettings?.invoice_prefix ?? "INV"}-${new Date().getFullYear()}-${String(farmSettings?.invoice_next_number ?? Math.floor(Math.random() * 1000)).padStart(3, "0")}`

  useEffect(() => {
    if (open) {
      setPaymentInstructions(farmSettings?.invoice_payment_instructions ?? "")
      setTaxEnabled(farmSettings?.invoice_tax_enabled ?? true)
    }
  }, [farmSettings?.invoice_payment_instructions, farmSettings?.invoice_tax_enabled, open])

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    if (field === "quantity" || field === "unitPrice") {
      ;(newItems[index] as any)[field] = Number(value)
    } else {
      ;(newItems[index] as any)[field] = value as string
    }

    // Calculate total
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice

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

  const handleCreate = () => {
    if (!clientName || !clientEmail || !dueDate || items.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    onCreateInvoice({
      invoiceNumber,
      date: today,
      dueDate,
      status: "Pending",
      clientName,
      clientEmail,
      items,
      subtotal,
      tax,
      taxRate,
      taxEnabled,
      total,
      notes,
      paymentInstructions: paymentInstructions.trim() || undefined,
    })

    // Reset form
    setClientName("")
    setClientEmail("")
    setDueDate("")
    setNotes("")
    setPaymentInstructions(farmSettings?.invoice_payment_instructions ?? "")
    setTaxEnabled(farmSettings?.invoice_tax_enabled ?? true)
    setItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Number Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="text-lg font-semibold text-blue-600">{invoiceNumber}</p>
          </div>

          {/* Client Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-foreground">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input
                placeholder="Client Email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <Input type="date" placeholder="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Line Items */}
          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Line Items</h3>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                    className="w-24"
                  />
                  <div className="text-right min-w-24">
                    <p className="text-sm font-medium">{formatCurrency(item.total, { farmSettings })}</p>
                  </div>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Checkbox
                id="tax-enabled"
                checked={taxEnabled}
                onCheckedChange={(checked) => setTaxEnabled(checked === true)}
              />
              <label htmlFor="tax-enabled" className="text-sm font-medium text-foreground cursor-pointer">
                Apply tax ({taxRate}%)
              </label>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal, { farmSettings })}</span>
            </div>
            {taxEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span className="font-medium">{formatCurrency(tax, { farmSettings })}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(total, { farmSettings })}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Notes (Optional)</label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Payment Instructions */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Payment Instructions (Optional)</label>
            <Textarea
              placeholder="Bank name, account number, payment reference, etc."
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
