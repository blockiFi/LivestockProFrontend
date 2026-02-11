import { useState } from "react"
import type { Farm, FarmStatsDataType, Invoice } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Printer, Eye, Trash2 } from "lucide-react"
import { CreateInvoiceModal } from "@/components/modals/CreateIvoiceModal"
import { InvoicePreview } from "@/components/general/invoice-preview"
import { useLoaderData } from "react-router-dom"


 const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "INV-2024-001",
    date: "2024-10-15",
    dueDate: "2024-10-29",
    status: "Paid",
    clientName: "Green Valley Poultry Farm",
    clientEmail: "contact@greenvalley.com",
    items: [
      {
        description: "Feed Supply - Premium Layer Mix",
        quantity: 50,
        unitPrice: 120,
        total: 6000,
      },
      {
        description: "Veterinary Consultation Services",
        quantity: 2,
        unitPrice: 500,
        total: 1000,
      },
      {
        description: "Health Monitoring Equipment",
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
      },
    ],
    subtotal: 9500,
    tax: 950,
    total: 10450,
    notes: "Payment terms: Net 14 days. Thank you for your business.",
  },
  {
    id: 2,
    invoiceNumber: "INV-2024-002",
    date: "2024-10-18",
    dueDate: "2024-11-01",
    status: "Pending",
    clientName: "Sunrise Poultry Enterprises",
    clientEmail: "billing@sunrisepoultry.com",
    items: [
      {
        description: "Feed Supply - Broiler Starter",
        quantity: 75,
        unitPrice: 100,
        total: 7500,
      },
      {
        description: "Vaccination Services",
        quantity: 1,
        unitPrice: 1200,
        total: 1200,
      },
    ],
    subtotal: 8700,
    tax: 870,
    total: 9570,
    notes: "Invoice due upon receipt.",
  },
  {
    id: 3,
    invoiceNumber: "INV-2024-003",
    date: "2024-10-20",
    dueDate: "2024-11-03",
    status: "Overdue",
    clientName: "Rural Farm Cooperative",
    clientEmail: "accounts@ruralcoop.com",
    items: [
      {
        description: "Feed Supply - Layer Maintenance",
        quantity: 100,
        unitPrice: 95,
        total: 9500,
      },
    ],
    subtotal: 9500,
    tax: 950,
    total: 10450,
    notes: "Payment due by November 3rd.",
  },
]

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const { currentFarm } = useLoaderData() as { currentFarm: Farm | null; farmStats: FarmStatsDataType | null }
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "Paid").length,
    pending: invoices.filter((i) => i.status === "Pending").length,
    overdue: invoices.filter((i) => i.status === "Overdue").length,
  }

  const handleCreateInvoice = (newInvoice: Omit<Invoice, "id">) => {
    const invoice: Invoice = {
      ...newInvoice,
      id: invoices.length + 1,
    }
    setInvoices([invoice, ...invoices])
    setShowCreateModal(false)
  }

  const handleDeleteInvoice = (id: number) => {
    setInvoices(invoices.filter((i) => i.id !== id))
  }

  const handlePrint = () => {
    if (selectedInvoice) {
      window.print()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create, manage, and track your farm invoices</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-600 text-white rounded-lg p-4">
          <p className="text-sm opacity-90">Total Invoices</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-600 text-white rounded-lg p-4">
          <p className="text-sm opacity-90">Paid</p>
          <p className="text-3xl font-bold">{stats.paid}</p>
        </div>
        <div className="bg-yellow-600 text-white rounded-lg p-4">
          <p className="text-sm opacity-90">Pending</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-red-600 text-white rounded-lg p-4">
          <p className="text-sm opacity-90">Overdue</p>
          <p className="text-3xl font-bold">{stats.overdue}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search invoices by number or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">₦{invoice.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice)
                    setShowPreview(true)
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice)
                    setTimeout(() => window.print(), 100)
                  }}
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateInvoice={handleCreateInvoice}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="no-print">Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoicePreview  farm={currentFarm} invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
