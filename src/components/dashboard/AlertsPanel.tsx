import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FarmAlerts } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AlertTriangle, Bell, Info, LoaderCircle } from "lucide-react"
import { Link } from "react-router-dom"

type Props = {
  alerts: FarmAlerts | null
  compact?: boolean
  maxItems?: number
  loading?: boolean
}

const severityStyles: Record<string, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
}

const categoryLabels: Record<string, string> = {
  low_stock: "Low stock",
  expiring: "Expiring",
  upcoming_schedule: "Schedule",
  missed_feeding: "Missed feeding",
  mortality_spike: "Mortality",
  overdue_task: "Task",
}

const AlertsPanel = ({ alerts, compact = false, maxItems = 8, loading = false }: Props) => {
  const allItems = alerts?.items ?? []
  const items = allItems.slice(0, maxItems)
  const counts = alerts?.counts ?? { critical: 0, warning: 0, info: 0 }
  const total = Math.max(
    counts.critical + counts.warning + counts.info,
    allItems.length,
  )
  const hiddenCount = Math.max(0, allItems.length - items.length)

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-slate-500" />
            Alerts
            {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
          </CardTitle>
          <div className="flex gap-1.5">
            {counts.critical > 0 && (
              <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                {counts.critical} critical
              </Badge>
            )}
            {counts.warning > 0 && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {counts.warning} warning
              </Badge>
            )}
            {counts.info > 0 && !compact && (
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                {counts.info} info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(compact ? "pt-0" : "")}>
        {loading && total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading alerts…</p>
        ) : total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No active alerts for this farm.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((item) => {
                const inner = (
                  <div className="flex items-start gap-2">
                    {item.severity === "critical" || item.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium leading-snug">{item.title}</p>
                        {item.category && categoryLabels[item.category] ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide opacity-80"
                          >
                            {categoryLabels[item.category]}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs opacity-80">{item.detail}</p>
                    </div>
                  </div>
                )
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      severityStyles[item.severity] ?? severityStyles.info,
                      item.link && "hover:opacity-90",
                    )}
                  >
                    {item.link ? (
                      <Link to={item.link} className="block">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                )
              })}
            </ul>
            {hiddenCount > 0 ? (
              <p className="mt-3 text-center text-xs text-slate-500">
                +{hiddenCount} more alert{hiddenCount === 1 ? "" : "s"} not shown
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsPanel
