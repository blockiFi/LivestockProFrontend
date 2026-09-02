import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bird,
  ClipboardList,
  Droplets,
  Egg,
  Layers,
  Pill,
  ShoppingBag,
  Skull,
  Syringe,
  Wheat,
  Shield,
} from "lucide-react"

import type { BatchActivitySummary } from "@/lib/request"
import { SUMMARY_LABELS } from "@/lib/batchActivityExport"
import { cn } from "@/lib/utils"

type Props = {
  summary: BatchActivitySummary
}

type StatConfig = {
  key: keyof BatchActivitySummary
  icon: LucideIcon
  gradient: string
  iconBg: string
}

const STAT_CONFIG: StatConfig[] = [
  { key: "total_activities", icon: Layers, gradient: "from-slate-500 to-slate-700", iconBg: "bg-slate-500/10 text-slate-700" },
  { key: "feed_consumed_kg", icon: Wheat, gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/10 text-amber-700" },
  { key: "feed_planned_kg", icon: Wheat, gradient: "from-indigo-500 to-violet-600", iconBg: "bg-indigo-500/10 text-indigo-700" },
  { key: "medication_count", icon: Pill, gradient: "from-violet-500 to-purple-600", iconBg: "bg-violet-500/10 text-violet-700" },
  { key: "vaccination_count", icon: Syringe, gradient: "from-sky-500 to-cyan-600", iconBg: "bg-sky-500/10 text-sky-700" },
  { key: "mortality_count", icon: Skull, gradient: "from-rose-500 to-red-600", iconBg: "bg-rose-500/10 text-rose-700" },
  { key: "egg_total", icon: Egg, gradient: "from-yellow-500 to-amber-600", iconBg: "bg-yellow-500/10 text-yellow-700" },
  { key: "water_liters", icon: Droplets, gradient: "from-cyan-500 to-blue-600", iconBg: "bg-cyan-500/10 text-cyan-700" },
  { key: "tasks_completed", icon: ClipboardList, gradient: "from-blue-500 to-indigo-600", iconBg: "bg-blue-500/10 text-blue-700" },
  { key: "birds_sold", icon: ShoppingBag, gradient: "from-emerald-500 to-green-600", iconBg: "bg-emerald-500/10 text-emerald-700" },
  { key: "transfer_count", icon: Bird, gradient: "from-indigo-500 to-blue-600", iconBg: "bg-indigo-500/10 text-indigo-700" },
  { key: "feeding_count", icon: Activity, gradient: "from-orange-500 to-amber-600", iconBg: "bg-orange-500/10 text-orange-700" },
  { key: "deworming_count", icon: Shield, gradient: "from-fuchsia-500 to-pink-600", iconBg: "bg-fuchsia-500/10 text-fuchsia-700" },
]

const HIDDEN_FROM_GRID = new Set(["feed_consumed_kg", "feed_planned_kg"])

export default function SummaryStatGrid({ summary }: Props) {
  const entries = STAT_CONFIG.filter((cfg) => {
    if (HIDDEN_FROM_GRID.has(cfg.key)) return false
    const value = summary[cfg.key]
    return value != null && value !== 0
  })

  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {entries.map(({ key, icon: Icon, gradient, iconBg }) => {
        const value = summary[key]
        const label = SUMMARY_LABELS[key] ?? key

        return (
          <div
            key={key}
            className="group relative overflow-hidden rounded-xl border bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", gradient)} />
            <div className="flex items-start justify-between gap-2 pt-1">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 leading-tight line-clamp-2">
                  {label}
                </p>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900">
                  {typeof value === "number" ? value.toLocaleString() : String(value)}
                </p>
              </div>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
