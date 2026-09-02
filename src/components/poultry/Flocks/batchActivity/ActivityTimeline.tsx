import type { ReactNode } from "react"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { BatchActivityRow } from "@/lib/request"
import { formatDate, cn } from "@/lib/utils"
import {
  getCategoryMeta,
  getFeedKind,
  groupActivitiesByDate,
  isFeedActivity,
} from "./batchActivityUtils"

type Props = {
  rows: BatchActivityRow[]
  loading: boolean
  sortDir: "asc" | "desc"
  emptyState: ReactNode
}

export default function ActivityTimeline({ rows, loading, sortDir, emptyState }: Props) {
  const grouped = groupActivitiesByDate(rows, sortDir)

  if (loading && rows.length === 0) {
    return <>{emptyState}</>
  }

  if (rows.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <div className="relative space-y-8">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent sm:left-[19px]" />

      {grouped.map(({ date, rows: dayRows }) => (
        <section key={date} className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-md shadow-indigo-200/50 sm:h-9 sm:w-9">
              <span className="text-[10px] font-bold text-white sm:text-xs">
                {format(parseISO(date), "d")}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">{formatDate(date)}</p>
            <p className="text-xs text-muted-foreground">
              {dayRows.length} {dayRows.length === 1 ? "activity" : "activities"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dayRows.map((row) => (
              <ActivityCard key={row.id} row={row} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ActivityCard({ row }: { row: BatchActivityRow }) {
  const meta = getCategoryMeta(row.category)
  const Icon = meta.icon
  const feedKind = getFeedKind(row)
  const isFeed = isFeedActivity(row)

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        isFeed && feedKind === "consumed" && "border-amber-200/90 ring-1 ring-amber-100",
        isFeed && feedKind === "planned" && "border-indigo-300/80 border-dashed bg-indigo-50/20",
        isFeed && feedKind === "missed" && "border-amber-300/80 border-dashed bg-amber-50/30",
        !isFeed && `ring-1 ${meta.ring}`
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isFeed && feedKind === "consumed" && "bg-gradient-to-b from-amber-400 to-orange-500",
          isFeed && feedKind === "planned" && "bg-gradient-to-b from-indigo-300 to-indigo-500 opacity-60",
          isFeed && feedKind === "missed" && "bg-gradient-to-b from-amber-400 to-rose-400",
          !isFeed && meta.dot
        )}
      />

      <div className={cn("bg-gradient-to-br px-4 py-3", !isFeed && meta.bg, isFeed && feedKind === "consumed" && "from-amber-50/90 to-orange-50/50", isFeed && feedKind === "planned" && "from-indigo-50/60 to-violet-50/30", isFeed && feedKind === "missed" && "from-amber-50/80 to-rose-50/40")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
                isFeed && feedKind === "consumed" && "bg-amber-500 text-white",
                isFeed && feedKind === "planned" && "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 ring-dashed",
                isFeed && feedKind === "missed" && "bg-amber-100 text-amber-800",
                !isFeed && "bg-white/80 " + meta.accent
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
                {row.activity}
              </p>
              <Badge variant="secondary" className="mt-1.5 capitalize text-[10px] font-medium">
                {meta.label}
              </Badge>
            </div>
          </div>
          <StatusBadge status={row.status} feedKind={feedKind} />
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-3">
        {isFeed && row.quantity != null && (
          <FeedQuantityDisplay kind={feedKind!} quantity={row.quantity} unit={row.unit ?? "kg"} />
        )}

        {!isFeed && row.quantity != null && (
          <div className="inline-flex items-baseline gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {row.quantity.toLocaleString()}
            </span>
            {row.unit && <span className="text-xs text-muted-foreground">{row.unit}</span>}
          </div>
        )}

        {row.description && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{row.description}</p>
        )}

        {row.performed_by && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.performed_by}</span>
          </p>
        )}
      </div>
    </article>
  )
}

function FeedQuantityDisplay({
  kind,
  quantity,
  unit,
}: {
  kind: "consumed" | "planned" | "missed"
  quantity: number
  unit: string
}) {
  const isConsumed = kind === "consumed"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
        isConsumed
          ? "bg-gradient-to-r from-amber-100/80 to-orange-50 border border-amber-200/60"
          : "bg-gradient-to-r from-indigo-50/80 to-violet-50/50 border border-dashed border-indigo-200/70"
      )}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {isConsumed ? "Consumed" : kind === "missed" ? "Missed (planned)" : "Planned"}
        </p>
        <p className="text-xl font-bold tabular-nums text-slate-900">
          {quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
        </p>
      </div>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isConsumed ? "bg-amber-500/15 text-amber-700" : "bg-indigo-500/10 text-indigo-600"
        )}
      >
        {isConsumed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : kind === "missed" ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <Clock className="h-5 w-5" />
        )}
      </div>
    </div>
  )
}

function StatusBadge({
  status,
  feedKind,
}: {
  status: string
  feedKind: "consumed" | "planned" | "missed" | null
}) {
  if (feedKind === "consumed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
        <CheckCircle2 className="h-3 w-3" />
        Fed
      </span>
    )
  }

  if (feedKind === "planned") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
        <Clock className="h-3 w-3" />
        Planned
      </span>
    )
  }

  if (feedKind === "missed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
        <AlertCircle className="h-3 w-3" />
        Missed
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        status === "completed" && "bg-emerald-50 text-emerald-700",
        status === "scheduled" && "bg-blue-50 text-blue-700",
        ["missed", "overdue", "late"].includes(status) && "bg-amber-50 text-amber-700",
        !["completed", "scheduled", "missed", "overdue", "late"].includes(status) &&
          "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  )
}
