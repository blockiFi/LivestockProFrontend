import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  PieChart,
} from "lucide-react"

import type { CustomerPaymentAnalysis as PaymentAnalysis } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Props = {
  analysis: PaymentAnalysis
}

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    card: "from-emerald-50 to-white border-emerald-100",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    card: "from-amber-50 to-white border-amber-100",
  },
  partial: {
    label: "Partial",
    icon: CreditCard,
    bar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    card: "from-blue-50 to-white border-blue-100",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    card: "from-red-50 to-white border-red-100",
  },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

function PaymentStatusBadge({ status }: { status?: string }) {
  const key = (status?.toLowerCase() ?? "pending") as StatusKey
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending
  return (
    <Badge variant="outline" className={cn("capitalize font-normal", config.badge)}>
      {status ?? "pending"}
    </Badge>
  )
}

export { PaymentStatusBadge }

export default function CustomerPaymentAnalysis({ analysis }: Props) {
  const { buckets, total_amount, outstanding, collection_rate, by_source } = analysis

  const statusRows: StatusKey[] = ["paid", "pending", "partial", "overdue"]

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold">Payment analysis</CardTitle>
          </div>
          {total_amount > 0 ? (
            <Badge variant="outline" className="w-fit font-normal border-indigo-200 bg-indigo-50 text-indigo-700">
              {collection_rate}% collected
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collection overview */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total billed
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(total_amount)}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Collected</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700 tabular-nums">
                  {formatCurrency(buckets.paid.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Outstanding</p>
                <p className="mt-1 text-lg font-semibold text-amber-700 tabular-nums">
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </div>
          </div>

          {total_amount > 0 && (
            <div className="mt-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {statusRows.map((status) => {
                  const pct = (buckets[status].amount / total_amount) * 100
                  if (pct <= 0) return null
                  return (
                    <div
                      key={status}
                      className={cn("h-full transition-all", STATUS_CONFIG[status].bar)}
                      style={{ width: `${pct}%` }}
                      title={`${STATUS_CONFIG[status].label}: ${pct.toFixed(1)}%`}
                    />
                  )
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {statusRows.map((status) => {
                  const config = STATUS_CONFIG[status]
                  if (buckets[status].count === 0) return null
                  return (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={cn("h-2 w-2 rounded-full", config.bar)} />
                      {config.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status buckets */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statusRows.map((status) => {
            const config = STATUS_CONFIG[status]
            const Icon = config.icon
            const bucket = buckets[status]
            const share = total_amount > 0 ? (bucket.amount / total_amount) * 100 : 0

            return (
              <div
                key={status}
                className={cn(
                  "rounded-xl border bg-gradient-to-br p-4",
                  config.card
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.badge)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {bucket.count} {bucket.count === 1 ? "txn" : "txns"}
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {config.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(bucket.amount)}
                </p>
                {total_amount > 0 && (
                  <p className="mt-1 text-xs text-slate-500">{share.toFixed(1)}% of total</p>
                )}
              </div>
            )
          })}
        </div>

        {/* By source breakdown */}
        {(by_source.product_sales || by_source.flock_sales || by_source.invoices) && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Breakdown by source
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <SourceBreakdown
                title="Product sales"
                buckets={by_source.product_sales}
                statuses={["paid", "pending", "partial"]}
              />
              <SourceBreakdown
                title="Flock sales"
                buckets={by_source.flock_sales}
                statuses={["paid"]}
              />
              <SourceBreakdown
                title="Invoices"
                buckets={by_source.invoices}
                statuses={["paid", "pending", "partial", "overdue"]}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SourceBreakdown({
  title,
  buckets,
  statuses,
}: {
  title: string
  buckets: Record<string, { count: number; amount: number }>
  statuses: string[]
}) {
  const total = statuses.reduce((sum, s) => sum + (buckets[s]?.amount ?? 0), 0)
  const hasData = statuses.some((s) => (buckets[s]?.count ?? 0) > 0)

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
        No {title.toLowerCase()}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5 mb-2">{formatCurrency(total)} total</p>
      <div className="space-y-1.5">
        {statuses.map((status) => {
          const bucket = buckets[status]
          if (!bucket || bucket.count === 0) return null
          const key = status as StatusKey
          const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending
          return (
            <div key={status} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className={cn("h-1.5 w-1.5 rounded-full", config.bar)} />
                <span className="capitalize">{status}</span>
                <span className="text-slate-400">({bucket.count})</span>
              </span>
              <span className="font-medium text-slate-800 tabular-nums">
                {formatCurrency(bucket.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
