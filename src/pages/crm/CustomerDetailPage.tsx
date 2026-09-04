import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import {
  ArrowLeft,
  Bird,
  Building2,
  Calendar,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  Search,
  StickyNote,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import type { RootState } from "@/store"
import type { Customer, CustomerHistoryItem, CustomerSummary } from "@/lib/types"
import { getCustomer, getCustomerHistory } from "@/lib/crmRequest"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CustomerFormSheet from "@/components/crm/CustomerFormSheet"
import CustomerSaleDetailSheet from "@/components/crm/CustomerSaleDetailSheet"
import CustomerPaymentAnalysis, { PaymentStatusBadge } from "@/components/crm/CustomerPaymentAnalysis"
import RecordPaymentModal from "@/components/crm/RecordPaymentModal"
import Pagination from "@/components/general/Pagination"
import { CardGridSkeleton, TableSkeleton } from "@/components/general/skeletons"

const HISTORY_PER_PAGE = 10

function customerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function resolvePaymentStatus(item: CustomerHistoryItem): string {
  if (item.payment_status) return item.payment_status
  if (item.type === "invoice") return String(item.meta?.status ?? "pending")
  if (item.type === "flock") return "paid"
  return String(item.meta?.payment_status ?? "paid")
}

function itemBalanceDue(item: CustomerHistoryItem): number {
  if (item.balance_due != null) return Number(item.balance_due)
  const paid = Number(item.amount_paid ?? item.meta?.amount_paid ?? 0)
  return Math.max(0, Number(item.amount) - paid)
}

function canTopUp(item: CustomerHistoryItem): boolean {
  return (item.type === "product" || item.type === "invoice") && itemBalanceDue(item) > 0
}

function historyTypeMeta(type: CustomerHistoryItem["type"]) {
  switch (type) {
    case "product":
      return {
        label: "Product",
        icon: Package,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        rowHover: "hover:bg-emerald-50/40",
      }
    case "flock":
      return {
        label: "Flock",
        icon: Bird,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        rowHover: "hover:bg-blue-50/40",
      }
    default:
      return {
        label: "Invoice",
        icon: Receipt,
        badge: "bg-violet-50 text-violet-700 border-violet-200",
        rowHover: "hover:bg-violet-50/40",
      }
  }
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

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const activeFarm = useSelector((state: RootState) => state.authentication.activeFarm)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [history, setHistory] = useState<CustomerHistoryItem[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedSale, setSelectedSale] = useState<CustomerHistoryItem | null>(null)
  const [saleDetailOpen, setSaleDetailOpen] = useState(false)
  const [paymentItem, setPaymentItem] = useState<CustomerHistoryItem | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const openPaymentModal = (item: CustomerHistoryItem) => {
    setPaymentItem(item)
    setPaymentOpen(true)
  }

  const loadCustomer = useCallback(async () => {
    if (!token || !farmId || !customerId) return
    setLoading(true)
    const res = await getCustomer(token, farmId, Number(customerId))
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to load customer")
      setLoading(false)
      return
    }
    setCustomer(res.data.customer)
    setSummary(res.data.summary)
    setLoading(false)
  }, [token, farmId, customerId])

  const loadHistory = useCallback(async () => {
    if (!token || !farmId || !customerId) return
    setHistoryLoading(true)
    const type = tab === "all" ? undefined : tab
    const res = await getCustomerHistory(token, farmId, Number(customerId), {
      type: type as "product" | "flock" | "invoice" | undefined,
      page: historyPage,
      per_page: HISTORY_PER_PAGE,
    })
    if (res.success && res.data) {
      setHistory(res.data.data ?? [])
      setHistoryTotalPages(res.data.last_page ?? 1)
    }
    setHistoryLoading(false)
  }, [token, farmId, customerId, tab, historyPage])

  const refreshAfterPayment = useCallback(async () => {
    await Promise.all([loadCustomer(), loadHistory()])
  }, [loadCustomer, loadHistory])

  useEffect(() => {
    void loadCustomer()
  }, [loadCustomer])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    setHistoryPage(1)
  }, [tab, search])

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return history
    return history.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.date ?? "").includes(q) ||
        String(item.amount).includes(q) ||
        resolvePaymentStatus(item).toLowerCase().includes(q)
    )
  }, [history, search])

  const openSaleDetail = (item: CustomerHistoryItem) => {
    setSelectedSale(item)
    setSaleDetailOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <CardGridSkeleton count={4} columns={4} />
        <TableSkeleton rows={6} columns={4} />
      </div>
    )
  }

  if (!customer || !summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <Users className="h-12 w-12 text-slate-300" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Customer not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This customer may have been removed or you may not have access.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/crm/customers")}>
          Back to customers
        </Button>
      </div>
    )
  }

  const locationParts = [customer.city, customer.state, customer.country?.name].filter(Boolean)
  const location = locationParts.join(", ")

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Back nav */}
        <Button
          variant="ghost"
          className="gap-2 -ml-2 text-slate-600 hover:text-slate-900"
          onClick={() => navigate("/dashboard/crm/customers")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Button>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-slate-50 to-emerald-50/30" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-xl font-bold text-white shadow-lg shadow-indigo-200">
                {customerInitials(customer.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{customer.name}</h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      customer.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    )}
                  >
                    {customer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {customer.company_name ? (
                  <p className="mt-1 flex items-center gap-1.5 text-slate-600">
                    <Building2 className="h-4 w-4 shrink-0" />
                    {customer.company_name}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3">
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </a>
                  ) : null}
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit customer
              </Button>
              <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Link to={`/dashboard/invoices?customerId=${customer.id}`}>
                  <Receipt className="h-4 w-4" />
                  Create invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total revenue"
            value={formatCurrency(summary.total_revenue)}
            subtitle={
              summary.last_purchase_at
                ? `Last purchase ${formatDate(summary.last_purchase_at)}`
                : "No purchases yet"
            }
            icon={TrendingUp}
            accent="bg-indigo-500"
            iconBg="bg-indigo-100 text-indigo-700"
          />
          <StatCard
            title="Product sales"
            value={String(summary.product_sale_count)}
            subtitle={formatCurrency(summary.product_revenue)}
            icon={Package}
            accent="bg-emerald-500"
            iconBg="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Flock sales"
            value={String(summary.flock_sale_count)}
            subtitle={formatCurrency(summary.flock_revenue)}
            icon={Bird}
            accent="bg-blue-500"
            iconBg="bg-blue-100 text-blue-700"
          />
          <StatCard
            title="Invoices"
            value={String(summary.invoice_count)}
            subtitle={formatCurrency(summary.invoice_total)}
            icon={Receipt}
            accent="bg-violet-500"
            iconBg="bg-violet-100 text-violet-700"
          />
        </div>

        {summary.payment_analysis ? (
          <CustomerPaymentAnalysis analysis={summary.payment_analysis} />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile sidebar */}
          <Card className="border-slate-200/80 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Customer profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {location ? (
                <div className="flex items-start gap-3 py-2.5 border-b border-slate-100">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Location</p>
                    <p className="text-sm text-slate-800 mt-0.5">{location}</p>
                    {customer.address ? (
                      <p className="text-xs text-slate-500 mt-0.5">{customer.address}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {customer.country ? (
                <div className="flex items-start gap-3 py-2.5 border-b border-slate-100">
                  <Globe className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Country</p>
                    <p className="text-sm text-slate-800 mt-0.5">{customer.country.name}</p>
                  </div>
                </div>
              ) : null}

              {customer.created_at ? (
                <div className="flex items-start gap-3 py-2.5 border-b border-slate-100">
                  <Calendar className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Customer since</p>
                    <p className="text-sm text-slate-800 mt-0.5">{formatDate(customer.created_at)}</p>
                  </div>
                </div>
              ) : null}

              {customer.notes ? (
                <div className="flex items-start gap-3 py-2.5">
                  <StickyNote className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-2">No notes on file.</p>
              )}
            </CardContent>
          </Card>

          {/* Purchase history */}
          <Card className="border-slate-200/80 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Purchase history</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Click any row to view sale details
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search history..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-4 h-9">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="product" className="text-xs sm:text-sm">Products</TabsTrigger>
                  <TabsTrigger value="flock" className="text-xs sm:text-sm">Flock</TabsTrigger>
                  <TabsTrigger value="invoice" className="text-xs sm:text-sm">Invoices</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-0">
                  {historyLoading ? (
                    <TableSkeleton rows={5} columns={6} />
                  ) : (
                    <>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                              <TableHead className="font-semibold text-slate-600">Date</TableHead>
                              <TableHead className="font-semibold text-slate-600">Type</TableHead>
                              <TableHead className="font-semibold text-slate-600">Description</TableHead>
                              <TableHead className="font-semibold text-slate-600">Payment</TableHead>
                              <TableHead className="text-right font-semibold text-slate-600">Amount</TableHead>
                              <TableHead className="w-10" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredHistory.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center">
                                  <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                                  <p className="font-medium text-slate-600">No transactions found</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {search ? "Try a different search term." : "Sales and invoices will appear here."}
                                  </p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredHistory.map((item) => {
                                const typeMeta = historyTypeMeta(item.type)
                                const TypeIcon = typeMeta.icon
                                return (
                                  <TableRow
                                    key={`${item.type}-${item.id}`}
                                    className={cn(
                                      "cursor-pointer transition-colors group",
                                      typeMeta.rowHover
                                    )}
                                    onClick={() => openSaleDetail(item)}
                                  >
                                    <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                                      {item.date ? formatDate(item.date) : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={cn("gap-1 font-normal", typeMeta.badge)}>
                                        <TypeIcon className="h-3 w-3" />
                                        {typeMeta.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-700 max-w-[180px] truncate">
                                      {item.description}
                                    </TableCell>
                                    <TableCell>
                                      <PaymentStatusBadge status={resolvePaymentStatus(item)} />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900 tabular-nums">
                                      {formatCurrency(item.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-end gap-1">
                                        {canTopUp(item) && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                            title="Record payment"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openPaymentModal(item)
                                            }}
                                          >
                                            <Wallet className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {!search && historyTotalPages > 1 && (
                        <div className="mt-4">
                          <Pagination
                            currentPage={historyPage}
                            totalPages={historyTotalPages}
                            onPageChange={setHistoryPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSaved={(updated) => {
          setCustomer(updated)
          void loadCustomer()
        }}
      />

      <CustomerSaleDetailSheet
        item={selectedSale}
        open={saleDetailOpen}
        onOpenChange={setSaleDetailOpen}
        farm={activeFarm ?? null}
        onRecordPayment={(item) => {
          setSaleDetailOpen(false)
          openPaymentModal(item)
        }}
      />

      {customer && (
        <RecordPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          customerId={customer.id}
          item={paymentItem}
          onSuccess={() => void refreshAfterPayment()}
        />
      )}
    </div>
  )
}
