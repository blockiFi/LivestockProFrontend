import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Mail, Phone, Plus, Search, Users } from "lucide-react"

import type { RootState } from "@/store"
import type { Customer } from "@/lib/types"
import { deleteCustomer, getCustomers } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ActionGate } from "@/components/general/ActionGate"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { ACTIONS } from "@/lib/actionPermissions"
import { buildExportFilename, type ExportColumn } from "@/lib/exportData"
import CustomerFormSheet from "@/components/crm/CustomerFormSheet"

const EXPORT_COLUMNS: ExportColumn<Customer>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Company", value: (row) => row.company_name ?? "" },
  { header: "Email", value: (row) => row.email ?? "" },
  { header: "Phone", value: (row) => row.phone ?? "" },
  { header: "City", value: (row) => row.city ?? "" },
  { header: "Status", value: (row) => (row.is_active ? "Active" : "Inactive") },
  { header: "Total Revenue", value: (row) => row.summary?.total_revenue ?? 0 },
]

export default function CustomersPage() {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const loadCustomers = useCallback(async () => {
    if (!token || !farmId) return
    setLoading(true)
    const res = await getCustomers(token, farmId, {
      search: search || undefined,
      active: statusFilter === "all" ? undefined : statusFilter === "active",
    })
    if (res.success && res.data) {
      setCustomers(res.data)
    } else {
      toast.error(res.error?.join(", ") || "Failed to load customers")
    }
    setLoading(false)
  }, [token, farmId, search, statusFilter])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.is_active).length
    const revenue = customers.reduce((sum, customer) => sum + (customer.summary?.total_revenue ?? 0), 0)
    return {
      total: customers.length,
      active,
      revenue,
    }
  }, [customers])

  const handleDelete = async (customer: Customer) => {
    if (!token || !farmId) return
    if (!window.confirm(`Delete ${customer.name}?`)) return
    const res = await deleteCustomer(token, farmId, customer.id)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to delete customer")
      return
    }
    toast.success("Customer deleted")
    void loadCustomers()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage buyers, track purchase history, and link sales to customer records.
          </p>
        </div>
        <ActionGate anyOf={ACTIONS.customers.create}>
          <Button
            className="gap-2"
            onClick={() => {
              setEditingCustomer(null)
              setSheetOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        </ActionGate>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total customers</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active customers</p>
          <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Tracked revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <ExportDataButton
          rows={customers}
          columns={EXPORT_COLUMNS}
          filename={buildExportFilename("customers")}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Last purchase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <Link
                        to={`/dashboard/crm/customers/${customer.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      {customer.company_name && (
                        <p className="text-xs text-muted-foreground">{customer.company_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {customer.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(customer.summary?.total_revenue ?? 0)}</TableCell>
                  <TableCell>{customer.summary?.last_purchase_at ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.is_active ? "default" : "secondary"}>
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/crm/customers/${customer.id}`}>View</Link>
                      </Button>
                      <ActionGate anyOf={ACTIONS.customers.update}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer)
                            setSheetOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      </ActionGate>
                      <ActionGate anyOf={ACTIONS.customers.delete}>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(customer)}>
                          Delete
                        </Button>
                      </ActionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customer={editingCustomer}
        onSaved={() => void loadCustomers()}
      />
    </div>
  )
}
