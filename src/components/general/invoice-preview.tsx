"use client"

import type { Farm, FarmSettings, Invoice } from "@/lib/types"
import { printInvoice } from "@/lib/print-invoice"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

export function InvoicePreview({ invoice , farm, farmSettings }: {invoice: Invoice , farm: Farm | null, farmSettings?: FarmSettings | null}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => printInvoice(invoice, farm, farmSettings)} className="gap-2">
          <Printer className="w-4 h-4" />
          Print Invoice
        </Button>
      </div>

      <div className="mx-auto w-full max-w-[210mm] bg-white p-8 rounded-lg border border-border shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-wide text-blue-600">INVOICE</h1>
              <p className="text-base font-medium text-foreground mt-3">{farm?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{farm?.address}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</p>
              <p className="text-muted-foreground mt-2">Date: {new Date(invoice.date).toLocaleDateString()}</p>
              <p className="text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p className="mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
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
          <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-border">
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-2 uppercase tracking-wide text-xs">Bill To</p>
              <p className="text-base font-medium text-foreground">{invoice.clientName}</p>
              <p className="text-muted-foreground mt-1">{invoice.clientEmail}</p>
            </div>
            <div className="text-sm text-right">
              <p className="font-semibold text-foreground mb-2 uppercase tracking-wide text-xs">From</p>
              <p className="text-base font-medium text-foreground">LiveStockPro Services</p>
              <p className="text-muted-foreground mt-1">Email: billing@livestockpro.com</p>
              <p className="text-muted-foreground">Phone: +234 123 456 7890</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-10 text-sm">
            <thead>
              <tr className="border-b-2 border-blue-600">
                <th className="text-left py-3 font-semibold text-foreground">Description</th>
                <th className="text-center py-3 font-semibold text-foreground w-24">Qty</th>
                <th className="text-right py-3 font-semibold text-foreground w-28">Unit Price</th>
                <th className="text-right py-3 font-semibold text-foreground w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-4 text-foreground">{item.description}</td>
                  <td className="py-4 text-center text-foreground">{item.quantity}</td>
                  <td className="py-4 text-right text-foreground">{formatCurrency(item.unitPrice, { farmSettings, farm })}</td>
                  <td className="py-4 text-right text-foreground font-medium">{formatCurrency(item.total, { farmSettings, farm })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="flex justify-between py-2 border-b border-border text-sm">
                <span className="text-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal, { farmSettings, farm })}</span>
              </div>
              {invoice.taxEnabled !== false && (
                <div className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="text-foreground">Tax ({invoice.taxRate ?? 10}%)</span>
                  <span className="font-medium">{formatCurrency(invoice.tax, { farmSettings, farm })}</span>
                </div>
              )}
              <div className="flex justify-between py-4 bg-blue-50 px-4 rounded mt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-xl text-blue-600">{formatCurrency(invoice.total, { farmSettings, farm })}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-border pt-6 text-sm">
              <p className="font-semibold text-foreground mb-2">Notes</p>
              <p className="text-muted-foreground leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {invoice.paymentInstructions && (
            <div className="border-t border-border pt-6 text-sm mt-6">
              <p className="font-semibold text-foreground mb-2">Payment Instructions</p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{invoice.paymentInstructions}</p>
            </div>
          )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          <p className="font-medium">Thank you for your business!</p>
          <p className="mt-1">Please retain this invoice for your records.</p>
        </div>
      </div>
    </div>
  )
}
