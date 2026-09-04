import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

import type { RootState } from "@/store"
import type { Customer } from "@/lib/types"
import { deleteCustomer, getCustomers } from "@/lib/crmRequest"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ActionGate } from "@/components/general/ActionGate"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { ACTIONS } from "@/lib/actionPermissions"
import { buildExportFilename, type ExportColumn } from "@/lib/exportData"
import CustomerFormSheet from "@/components/crm/CustomerFormSheet"
import { CardGridSkeleton, TableSkeleton } from "@/components/general/skeletons"

const EXPORT_COLUMNS: ExportColumn<Customer>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Company", value: (row) => row.company_name ?? "" },
  { header: "Email", value: (row) => row.email ?? "" },
  { header: "Phone", value: (row) => row.phone ?? "" },
  { header: "City", value: (row) => row.city ?? "" },
  { header: "Status", value: (row) => (row.is_active ? "Active" : "Inactive") },
  { header: "Total Revenue", value: (row) => row.summary?.total_revenue ?? 0 },
  {
    header: "Outstanding",
    value: (row) => row.summary?.payment_analysis?.outstanding ?? 0,
  },
]

type StatusFilter = "all" | "active" | "inactive" | "outstanding"
type SortKey = "name" | "revenue" | "outstanding" | "recent"
type ViewMode = "table" | "grid"

function customerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function transactionCount(customer: Customer): number {
  const s = customer.summary
  if (!s) return 0
  return (s.product_sale_count ?? 0) + (s.flock_sale_count ?? 0) + (s.invoice_count ?? 0)
}

function outstandingAmount(customer: Customer): number {
  return customer.summary?.payment_analysis?.outstanding ?? 0
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  iconBg,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  iconBg: string
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={cn("w-1.5 shrink-0", accent)} />
          <div className="flex flex-1 items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums truncate">{value}</p>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomerAvatar({ name, active }: { name: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
        active
          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-500"
      )}
    >
      {customerInitials(name) || "?"}
    </div>
  )
}

function ContactLine({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{value}</span>
    </span>
  )
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadCustomers = useCallback(async () => {
    if (!token || !farmId) return
    setLoading(true)
    const res = await getCustomers(token, farmId, {
      search: debouncedSearch || undefined,
      active:
        statusFilter === "all" || statusFilter === "outstanding"
          ? undefined
          : statusFilter === "active",
    })
    if (res.success && res.data) {
      setCustomers(res.data)
    } else {
      toast.error(res.error?.join(", ") || "Failed to load customers")
    }
    setLoading(false)
  }, [token, farmId, debouncedSearch, statusFilter])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    let list = [...customers]
    if (statusFilter === "outstanding") {
      list = list.filter((c) => outstandingAmount(c) > 0)
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return (b.summary?.total_revenue ?? 0) - (a.summary?.total_revenue ?? 0)
        case "outstanding":
          return outstandingAmount(b) - outstandingAmount(a)
        case "recent": {
          const aDate = a.summary?.last_purchase_at ?? ""
          const bDate = b.summary?.last_purchase_at ?? ""
          return bDate.localeCompare(aDate)
        }
        default:
          return a.name.localeCompare(b.name)
      }
    })
    return list
  }, [customers, statusFilter, sortBy])

  const stats = useMemo(() => {
    const active = customers.filter((c) => c.is_active).length
    const revenue = customers.reduce((sum, c) => sum + (c.summary?.total_revenue ?? 0), 0)
    const outstanding = customers.reduce((sum, c) => sum + outstandingAmount(c), 0)
    const withBalance = customers.filter((c) => outstandingAmount(c) > 0).length
    return { total: customers.length, active, revenue, outstanding, withBalance }
  }, [customers])

  const openCreate = () => {
    setEditingCustomer(null)
    setSheetOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setSheetOpen(true)
  }

  const handleDelete = async () => {
    if (!token || !farmId || !deleteTarget) return
    setDeleting(true)
    const res = await deleteCustomer(token, farmId, deleteTarget.id)
    setDeleting(false)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to delete customer")
      return
    }
    toast.success("Customer deleted")
    setDeleteTarget(null)
    void loadCustomers()
  }

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
        <CardGridSkeleton count={4} columns={4} />
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-slate-50 to-emerald-50/30" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customers</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Manage buyers, track revenue and outstanding balances, and open full purchase history for each customer.
                </p>
              </div>
            </div>
            <ActionGate anyOf={ACTIONS.customers.create}>
              <Button className="gap-2 shrink-0 shadow-sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            </ActionGate>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total customers"
            value={String(stats.total)}
            subtitle={`${stats.active} active`}
            icon={Users}
            accent="bg-indigo-500"
            iconBg="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            title="Active customers"
            value={String(stats.active)}
            subtitle={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of total` : undefined}
            icon={UserCheck}
            accent="bg-emerald-500"
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Tracked revenue"
            value={formatCurrency(stats.revenue)}
            subtitle="Product & flock sales"
            icon={TrendingUp}
            accent="bg-violet-500"
            iconBg="bg-violet-50 text-violet-600"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats.outstanding)}
            subtitle={stats.withBalance > 0 ? `${stats.withBalance} with balance due` : "All caught up"}
            icon={Wallet}
            accent="bg-amber-500"
            iconBg="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Toolbar */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-10 pl-10 bg-white"
                  placeholder="Search by name, email, phone, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                  <SelectTrigger className="h-10 w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All customers</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                    <SelectItem value="outstanding">With balance due</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
                  <SelectTrigger className="h-10 w-full sm:w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A–Z)</SelectItem>
                    <SelectItem value="revenue">Revenue (high–low)</SelectItem>
                    <SelectItem value="outstanding">Outstanding (high–low)</SelectItem>
                    <SelectItem value="recent">Recent activity</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                  <Button
                    type="button"
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode("table")}
                    title="Table view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode("grid")}
                    title="Card view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
                <ExportDataButton
                  rows={filteredCustomers}
                  columns={EXPORT_COLUMNS}
                  filename={buildExportFilename("customers")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : filteredCustomers.length === 0 ? (
          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">No customers found</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "Add your first customer to start tracking sales and payments."}
                </p>
              </div>
              {!search && statusFilter === "all" && (
                <ActionGate anyOf={ACTIONS.customers.create}>
                  <Button className="gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add customer
                  </Button>
                </ActionGate>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const balance = outstandingAmount(customer)
              const location = [customer.city, customer.country?.name].filter(Boolean).join(", ")
              const txCount = transactionCount(customer)
              return (
                <Card
                  key={customer.id}
                  className="group cursor-pointer border-slate-200/80 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                  onClick={() => navigate(`/dashboard/crm/customers/${customer.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <CustomerAvatar name={customer.name} active={customer.is_active} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                            {customer.name}
                          </p>
                          {customer.company_name ? (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {customer.company_name}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/crm/customers/${customer.id}`}>View profile</Link>
                          </DropdownMenuItem>
                          <ActionGate anyOf={ACTIONS.customers.update}>
                            <DropdownMenuItem onClick={() => openEdit(customer)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </ActionGate>
                          <ActionGate anyOf={ACTIONS.customers.delete}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(customer)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </ActionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {customer.phone ? <ContactLine icon={Phone} value={customer.phone} /> : null}
                      {customer.email ? <ContactLine icon={Mail} value={customer.email} /> : null}
                      {location ? <ContactLine icon={MapPin} value={location} /> : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">Revenue</p>
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(customer.summary?.total_revenue ?? 0)}
                        </p>
                      </div>
                      {balance > 0 ? (
                        <div className="text-right">
                          <p className="text-xs text-amber-600">Outstanding</p>
                          <p className="font-semibold text-amber-700 tabular-nums">{formatCurrency(balance)}</p>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-normal",
                            customer.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          )}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{txCount} transaction{txCount !== 1 ? "s" : ""}</span>
                      {customer.summary?.last_purchase_at ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(customer.summary.last_purchase_at)}
                        </span>
                      ) : (
                        <span>No purchases yet</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Contact</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Revenue</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right hidden lg:table-cell">
                      Outstanding
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Last activity</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const balance = outstandingAmount(customer)
                    const txCount = transactionCount(customer)
                    return (
                      <TableRow
                        key={customer.id}
                        className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                        onClick={() => navigate(`/dashboard/crm/customers/${customer.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CustomerAvatar name={customer.name} active={customer.is_active} />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                                {customer.name}
                              </p>
                              {customer.company_name ? (
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                  <Building2 className="h-3 w-3 shrink-0" />
                                  {customer.company_name}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400">
                                  {txCount} transaction{txCount !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {customer.phone ? (
                              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{customer.phone}</span>
                              </p>
                            ) : null}
                            {customer.email ? (
                              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{customer.email}</span>
                              </p>
                            ) : null}
                            {!customer.phone && !customer.email ? (
                              <span className="text-sm text-slate-400">—</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-slate-900 tabular-nums">
                            {formatCurrency(customer.summary?.total_revenue ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          {balance > 0 ? (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700 tabular-nums">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {formatCurrency(balance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-600 text-sm">
                          {customer.summary?.last_purchase_at ? (
                            formatDate(customer.summary.last_purchase_at)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal",
                              customer.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem asChild>
                                  <Link to={`/dashboard/crm/customers/${customer.id}`}>View profile</Link>
                                </DropdownMenuItem>
                                <ActionGate anyOf={ACTIONS.customers.update}>
                                  <DropdownMenuItem onClick={() => openEdit(customer)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </ActionGate>
                                <ActionGate anyOf={ACTIONS.customers.delete}>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setDeleteTarget(customer)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </ActionGate>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {!loading && filteredCustomers.length > 0 ? (
          <p className="text-center text-xs text-slate-500">
            Showing {filteredCustomers.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </p>
        ) : null}
      </div>

      <CustomerFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customer={editingCustomer}
        onSaved={() => void loadCustomers()}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete customer?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>. Sales and invoice records linked to
              this customer will not be deleted, but the customer profile will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting..." : "Delete customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
