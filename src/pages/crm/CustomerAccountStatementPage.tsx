import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { ArrowLeft, Download, Filter } from "lucide-react"

import type { RootState } from "@/store"
import type { CustomerAccount, CustomerAccountTransaction } from "@/lib/types"
import {
  exportCustomerAccountStatement,
  getCustomer,
  getCustomerAccountStatement,
} from "@/lib/crmRequest"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Pagination from "@/components/general/Pagination"
import { TableSkeleton } from "@/components/general/skeletons"

export default function CustomerAccountStatementPage() {
  const { customerId } = useParams()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [customerName, setCustomerName] = useState("")
  const [account, setAccount] = useState<CustomerAccount | null>(null)
  const [openingBalance, setOpeningBalance] = useState<number | null>(null)
  const [rows, setRows] = useState<CustomerAccountTransaction[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState("all")
  const [direction, setDirection] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [search, setSearch] = useState("")

  const id = Number(customerId)

  const load = useCallback(async () => {
    if (!token || !farmId || !id) return
    setLoading(true)
    const [customerRes, statementRes] = await Promise.all([
      getCustomer(token, farmId, id),
      getCustomerAccountStatement(token, farmId, id, {
        page,
        per_page: 20,
        type: type === "all" ? undefined : type,
        direction: direction === "all" ? undefined : direction,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
      }),
    ])
    setLoading(false)

    if (customerRes.success && customerRes.data) {
      setCustomerName(customerRes.data.customer.name)
    }
    if (!statementRes.success || !statementRes.data) {
      toast.error(statementRes.error?.join(", ") || "Failed to load statement")
      return
    }
    setAccount(statementRes.data.account)
    setOpeningBalance(statementRes.data.opening_balance)
    setRows(statementRes.data.transactions)
    setLastPage(statementRes.data.meta.last_page)
  }, [token, farmId, id, page, type, direction, dateFrom, dateTo, search])

  useEffect(() => {
    void load()
  }, [load])

  const handleExport = async () => {
    if (!token || !farmId || !id) return
    const blob = await exportCustomerAccountStatement(token, farmId, id, {
      type: type === "all" ? undefined : type,
      direction: direction === "all" ? undefined : direction,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
    })
    if (!blob) {
      toast.error("Export failed")
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customer-${id}-account-statement.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link to={`/dashboard/crm/customers/${id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to customer
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900">Account Statement</h1>
          <p className="text-sm text-slate-500">{customerName}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void handleExport()}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Current Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(Number(account?.balance ?? 0))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(Number(account?.total_credited ?? 0))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Used</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(Number(account?.total_debited ?? 0))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setPage(1); setType(v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="top_up">Top up</SelectItem>
                <SelectItem value="sale_payment">Sale payment</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="reversal">Reversal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => { setPage(1); setDirection(v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value) }} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value) }} />
          </div>
          <div className="space-y-1">
            <Label>Search</Label>
            <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Reference, note..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {openingBalance != null ? (
            <p className="mb-3 text-sm text-slate-600">
              Opening balance: <span className="font-medium">{formatCurrency(openingBalance)}</span>
            </p>
          ) : null}
          {loading ? (
            <TableSkeleton rows={8} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const amount = Number(row.amount)
                      const isCredit = row.direction === "credit"
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{formatDate(row.occurred_at ?? row.created_at)}</TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{row.description || row.reference || "—"}</div>
                            <div className="text-xs text-slate-500">
                              {row.reference}
                              {row.sales_record_id ? ` · Sale #${row.sales_record_id}` : ""}
                              {row.payment_method ? ` · ${row.payment_method}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.type.replaceAll("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-emerald-700">
                            {isCredit ? formatCurrency(amount) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-rose-700">
                            {!isCredit ? formatCurrency(amount) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(row.balance_after))}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={lastPage}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
