
import { useState } from "react"
import type { Invoice, InvoiceItem } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateInvoice: (invoice: Omit<Invoice, "id">) => void
}

export function CreateInvoiceModal({ open, onOpenChange, onCreateInvoice }: CreateInvoiceModalProps) {
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])

  const today = new Date().toISOString().split("T")[0]
  const invoiceNumber = `INV-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`

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
  const tax = Math.round(subtotal * 0.1)
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
      total,
      notes,
    })

    // Reset form
    setClientName("")
    setClientEmail("")
    setDueDate("")
    setNotes("")
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
                    <p className="text-sm font-medium">₦{item.total.toLocaleString()}</p>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%):</span>
              <span className="font-medium">₦{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">₦{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Notes (Optional)</label>
            <textarea
              placeholder="Add any additional notes or payment terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-border rounded-md text-sm"
              rows={3}
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
