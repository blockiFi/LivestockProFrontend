import { Card } from "@/components/ui/card"
import type { RootState } from "@/store"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import {
  Layers,
  Activity,
  CheckCircle2,
  ShoppingBag,
  XCircle,
  Bird,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type StatKey =
  | "total"
  | "active"
  | "completed"
  | "sold"
  | "terminated"
  | "totalQuantity"

const statTiles: {
  key: StatKey
  label: string
  icon: LucideIcon
  chipClass: string
  valueClass: string
}[] = [
  {
    key: "total",
    label: "Total Flocks",
    icon: Layers,
    chipClass: "bg-slate-100 text-slate-600",
    valueClass: "text-slate-900",
  },
  {
    key: "active",
    label: "Active",
    icon: Activity,
    chipClass: "bg-emerald-50 text-emerald-600",
    valueClass: "text-slate-900",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    chipClass: "bg-blue-50 text-blue-600",
    valueClass: "text-slate-900",
  },
  {
    key: "sold",
    label: "Sold",
    icon: ShoppingBag,
    chipClass: "bg-amber-50 text-amber-600",
    valueClass: "text-slate-900",
  },
  {
    key: "terminated",
    label: "Terminated",
    icon: XCircle,
    chipClass: "bg-rose-50 text-rose-600",
    valueClass: "text-slate-900",
  },
  {
    key: "totalQuantity",
    label: "Total Birds",
    icon: Bird,
    chipClass: "bg-violet-50 text-violet-600",
    valueClass: "text-slate-900",
  },
]

const FlockSummary = () => {
  const statistics = useSelector(
    (state: RootState) => state.statistics.poultryStatistics
  )

  const stats = useMemo(() => {
    const summary = statistics?.summary
    const details = Array.isArray(statistics?.flock_details)
      ? statistics.flock_details
      : []

    const total =
      summary?.total_flocks ??
      details.length ??
      0
    const active =
      summary?.active_flocks ??
      details.filter((f) => f.status === "active").length
    const completed =
      summary?.completed_flocks ??
      details.filter((f) => f.status === "completed").length
    const sold =
      summary?.sold_flocks ??
      details.filter((f) => f.status === "sold").length
    const terminated =
      summary?.culled_flocks ??
      details.filter((f) => f.status === "culled").length

    // Prefer active bird count; fall back to summing active flock quantities from details.
    const totalQuantity =
      summary?.total_birds ??
      details
        .filter((f) => f.status === "active")
        .reduce(
          (sum, f) =>
            sum + Number((f as { actual_quantity?: number }).actual_quantity ?? f.quantity ?? 0),
          0
        )

    return {
      total: Number(total) || 0,
      active: Number(active) || 0,
      completed: Number(completed) || 0,
      sold: Number(sold) || 0,
      terminated: Number(terminated) || 0,
      totalQuantity: Number(totalQuantity) || 0,
    }
  }, [statistics])

  const formatValue = (key: StatKey, value: number) =>
    key === "totalQuantity" ? value.toLocaleString() : String(value)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {statTiles.map(({ key, label, icon: Icon, chipClass, valueClass }) => (
        <Card
          key={key}
          className="p-4 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chipClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xl font-semibold tabular-nums leading-none ${valueClass}`}
              >
                {formatValue(key, stats[key])}
              </p>
              <p className="mt-1.5 text-xs uppercase tracking-wide text-slate-400">
                {label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default FlockSummary
