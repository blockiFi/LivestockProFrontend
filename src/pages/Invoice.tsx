import { useCallback, useEffect, useMemo, useState } from "react"
import { useLoaderData, useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import type { Farm, FarmSettings, FarmStatsDataType, Invoice } from "@/lib/types"
import type { RootState } from "@/store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Printer, Eye, Trash2 } from "lucide-react"
import { CreateInvoiceModal } from "@/components/modals/CreateIvoiceModal"
import { InvoicePreview } from "@/components/general/invoice-preview"
import { formatCurrency } from "@/lib/currency"
import { printInvoice } from "@/lib/print-invoice"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { deleteInvoice, getInvoices, mapApiInvoiceToUi, updateInvoice } from "@/lib/crmRequest"

const statusToApi = (status: Invoice["status"]) => status.toLowerCase() as "pending" | "paid" | "overdue"

export function InvoicesPage() {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentFarm, farmSettings } = useLoaderData() as {
    currentFarm: Farm | null
    farmStats: FarmStatsDataType | null
    farmSettings?: FarmSettings | null
  }

  const defaultCustomerId = useMemo(() => {
    const raw = searchParams.get("customerId")
    return raw ? Number(raw) : null
  }, [searchParams])

  const loadInvoices = useCallback(async () => {
    if (!token || !farmId) return
    setLoading(true)
    const res = await getInvoices(token, farmId, {
      status: statusFilter === "all" ? undefined : statusFilter.toLowerCase(),
    })
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to load invoices")
      setLoading(false)
      return
    }
    const rows = Array.isArray(res.data) ? res.data : res.data.data ?? []
    setInvoices(rows.map((invoice) => mapApiInvoiceToUi(invoice, farmSettings)))
    setLoading(false)
  }, [token, farmId, statusFilter, farmSettings])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    if (defaultCustomerId) {
      setShowCreateModal(true)
    }
  }, [defaultCustomerId])

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

  const handleDeleteInvoice = async (id: number) => {
    if (!token || !farmId) return
    if (!window.confirm("Delete this invoice?")) return
    const res = await deleteInvoice(token, farmId, id)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to delete invoice")
      return
    }
    toast.success("Invoice deleted")
    void loadInvoices()
  }

  const handleStatusChange = async (invoice: Invoice, status: Invoice["status"]) => {
    if (!token || !farmId) return
    const res = await updateInvoice(token, farmId, invoice.id, { status: statusToApi(status) })
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to update invoice status")
      return
    }
    toast.success("Invoice status updated")
    void loadInvoices()
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    printInvoice(invoice, currentFarm, farmSettings)
  }

  const closeCreateModal = (open: boolean) => {
    setShowCreateModal(open)
    if (!open && searchParams.has("customerId")) {
      searchParams.delete("customerId")
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create, manage, and track your farm invoices</p>
        </div>
        <ActionGate anyOf={ACTIONS.invoices.create}>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </ActionGate>
      </div>

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

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
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
                    <p className="font-semibold text-foreground">
                      {formatCurrency(invoice.total, { farmSettings, farm: currentFarm })}
                    </p>
                    <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                  </div>
                  <ActionGate anyOf={ACTIONS.invoices.update}>
                    <Select
                      value={invoice.status}
                      onValueChange={(value) => void handleStatusChange(invoice, value as Invoice["status"])}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </ActionGate>
                  <div className="md:hidden">
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
                <Button variant="ghost" size="sm" onClick={() => handlePrintInvoice(invoice)}>
                  <Printer className="w-4 h-4" />
                </Button>
                <ActionGate anyOf={ACTIONS.invoices.delete}>
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteInvoice(invoice.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </ActionGate>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateInvoiceModal
        open={showCreateModal}
        onOpenChange={closeCreateModal}
        onCreated={() => void loadInvoices()}
        farmSettings={farmSettings}
        defaultCustomerId={defaultCustomerId}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[210mm] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoicePreview farm={currentFarm} farmSettings={farmSettings} invoice={selectedInvoice} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
