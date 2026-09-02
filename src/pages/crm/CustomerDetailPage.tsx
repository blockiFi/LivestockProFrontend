import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { ArrowLeft, FileText, Mail, Phone, Receipt } from "lucide-react"

import type { RootState } from "@/store"
import type { Customer, CustomerHistoryItem, CustomerSummary } from "@/lib/types"
import { getCustomer, getCustomerHistory } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CustomerFormSheet from "@/components/crm/CustomerFormSheet"

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [history, setHistory] = useState<CustomerHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState("all")

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
    const type = tab === "all" ? undefined : tab
    const res = await getCustomerHistory(token, farmId, Number(customerId), { type: type as "product" | "flock" | "invoice" | undefined })
    if (res.success && res.data) {
      setHistory(res.data.data ?? [])
    }
  }, [token, farmId, customerId, tab])

  useEffect(() => {
    void loadCustomer()
  }, [loadCustomer])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading customer...</div>
  }

  if (!customer || !summary) {
    return <div className="p-6 text-muted-foreground">Customer not found.</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" className="gap-2 px-0" onClick={() => navigate("/dashboard/crm/customers")}>
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
              <Badge variant={customer.is_active ? "default" : "secondary"}>
                {customer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {customer.company_name && <p className="mt-1 text-muted-foreground">{customer.company_name}</p>}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {customer.email}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit customer
          </Button>
          <Button asChild className="gap-2">
            <Link to={`/dashboard/invoices?customerId=${customer.id}`}>
              <Receipt className="h-4 w-4" />
              Create invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.total_revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Product sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.product_sale_count}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flock sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.flock_sale_count}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.invoice_count}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="product">Product sales</TabsTrigger>
              <TabsTrigger value="flock">Flock sales</TabsTrigger>
              <TabsTrigger value="invoice">Invoices</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        No history for this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{item.date ?? "—"}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CustomerFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSaved={(updated) => {
          setCustomer(updated)
          void loadCustomer()
        }}
      />
    </div>
  )
}
