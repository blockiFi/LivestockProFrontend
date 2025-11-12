"use client"

import type { Invoice } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          Print Invoice
        </Button>
      </div>

      <div className="bg-white p-8 rounded-lg border border-border print:border-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 print:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">INVOICE</h1>
            <p className="text-sm text-muted-foreground mt-1">LiveStockPro Farm Management</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{invoice.invoiceNumber}</p>
            <p className="text-muted-foreground">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            <p className="text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p className="mt-2">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  invoice.status === "Paid"
                    ? "bg-green-100 text-green-800"
                    : invoice.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {invoice.status}
              </span>
            </p>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Bill To:</p>
            <p className="text-foreground">{invoice.clientName}</p>
            <p className="text-muted-foreground">{invoice.clientEmail}</p>
          </div>
          <div className="text-sm text-right">
            <p className="font-semibold text-foreground mb-1">LiveStockPro Services</p>
            <p className="text-muted-foreground">Email: billing@livestockpro.com</p>
            <p className="text-muted-foreground">Phone: +234 123 456 7890</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 font-semibold text-foreground">Description</th>
              <th className="text-center py-3 font-semibold text-foreground w-24">Quantity</th>
              <th className="text-right py-3 font-semibold text-foreground w-24">Unit Price</th>
              <th className="text-right py-3 font-semibold text-foreground w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-border hover:bg-gray-50">
                <td className="py-4 text-foreground">{item.description}</td>
                <td className="py-4 text-center text-foreground">{item.quantity}</td>
                <td className="py-4 text-right text-foreground">₦{item.unitPrice.toLocaleString()}</td>
                <td className="py-4 text-right text-foreground font-medium">₦{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-foreground">Subtotal:</span>
              <span className="font-medium">₦{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-foreground">Tax (10%):</span>
              <span className="font-medium">₦{invoice.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 bg-blue-50 px-3 rounded">
              <span className="font-semibold text-foreground">Total:</span>
              <span className="font-bold text-lg text-blue-600">₦{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-border pt-6 text-sm">
            <p className="font-semibold text-foreground mb-2">Notes:</p>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">Please retain this invoice for your records.</p>
        </div>
      </div>
    </div>
  )
}
