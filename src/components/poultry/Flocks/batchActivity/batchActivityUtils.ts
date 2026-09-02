import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bird,
  ClipboardList,
  Droplets,
  Egg,
  HeartPulse,
  Pill,
  Scale,
  ShoppingBag,
  Skull,
  Syringe,
  Wheat,
} from "lucide-react"

import type { BatchActivityCategory, BatchActivityRow } from "@/lib/request"

export type FeedKind = "consumed" | "planned" | "missed"

export type CategoryMeta = {
  label: string
  icon: LucideIcon
  accent: string
  bg: string
  ring: string
  dot: string
}

export const CATEGORY_META: Record<BatchActivityCategory, CategoryMeta> = {
  feeding: {
    label: "Feeding",
    icon: Wheat,
    accent: "text-amber-700",
    bg: "from-amber-50 to-orange-50",
    ring: "ring-amber-200/80",
    dot: "bg-amber-500",
  },
  feed_consumption: {
    label: "Feed consumption",
    icon: Wheat,
    accent: "text-amber-700",
    bg: "from-amber-50 to-yellow-50",
    ring: "ring-amber-200/80",
    dot: "bg-amber-600",
  },
  medication: {
    label: "Medication",
    icon: Pill,
    accent: "text-violet-700",
    bg: "from-violet-50 to-purple-50",
    ring: "ring-violet-200/80",
    dot: "bg-violet-500",
  },
  deworming: {
    label: "Deworming",
    icon: Pill,
    accent: "text-fuchsia-700",
    bg: "from-fuchsia-50 to-pink-50",
    ring: "ring-fuchsia-200/80",
    dot: "bg-fuchsia-500",
  },
  vaccination: {
    label: "Vaccination",
    icon: Syringe,
    accent: "text-sky-700",
    bg: "from-sky-50 to-cyan-50",
    ring: "ring-sky-200/80",
    dot: "bg-sky-500",
  },
  mortality: {
    label: "Mortality",
    icon: Skull,
    accent: "text-rose-700",
    bg: "from-rose-50 to-red-50",
    ring: "ring-rose-200/80",
    dot: "bg-rose-500",
  },
  weighing: {
    label: "Weighing",
    icon: Scale,
    accent: "text-slate-700",
    bg: "from-slate-50 to-gray-50",
    ring: "ring-slate-200/80",
    dot: "bg-slate-500",
  },
  egg_production: {
    label: "Egg production",
    icon: Egg,
    accent: "text-yellow-700",
    bg: "from-yellow-50 to-amber-50",
    ring: "ring-yellow-200/80",
    dot: "bg-yellow-500",
  },
  water_consumption: {
    label: "Water",
    icon: Droplets,
    accent: "text-cyan-700",
    bg: "from-cyan-50 to-blue-50",
    ring: "ring-cyan-200/80",
    dot: "bg-cyan-500",
  },
  transfer: {
    label: "Transfer",
    icon: Bird,
    accent: "text-indigo-700",
    bg: "from-indigo-50 to-blue-50",
    ring: "ring-indigo-200/80",
    dot: "bg-indigo-500",
  },
  sale: {
    label: "Sale",
    icon: ShoppingBag,
    accent: "text-emerald-700",
    bg: "from-emerald-50 to-green-50",
    ring: "ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
  task: {
    label: "Task",
    icon: ClipboardList,
    accent: "text-blue-700",
    bg: "from-blue-50 to-indigo-50",
    ring: "ring-blue-200/80",
    dot: "bg-blue-500",
  },
  daily_record: {
    label: "Daily record",
    icon: Activity,
    accent: "text-teal-700",
    bg: "from-teal-50 to-emerald-50",
    ring: "ring-teal-200/80",
    dot: "bg-teal-500",
  },
}

const DEFAULT_META: CategoryMeta = {
  label: "Activity",
  icon: HeartPulse,
  accent: "text-slate-700",
  bg: "from-slate-50 to-gray-50",
  ring: "ring-slate-200/80",
  dot: "bg-slate-400",
}

export function getCategoryMeta(category: BatchActivityCategory): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_META
}

export function isPlannedFeed(row: BatchActivityRow): boolean {
  return row.source_type === "planned_feeding"
}

export function isFeedActivity(row: BatchActivityRow): boolean {
  return row.category === "feeding" || row.category === "feed_consumption"
}

export function getFeedKind(row: BatchActivityRow): FeedKind | null {
  if (!isFeedActivity(row)) return null
  if (isPlannedFeed(row)) {
    return row.status === "missed" ? "missed" : "planned"
  }
  return "consumed"
}

export function groupActivitiesByDate(
  rows: BatchActivityRow[],
  sortDir: "asc" | "desc"
): { date: string; rows: BatchActivityRow[] }[] {
  const map = new Map<string, BatchActivityRow[]>()
  for (const row of rows) {
    const list = map.get(row.date) ?? []
    list.push(row)
    map.set(row.date, list)
  }

  const dates = Array.from(map.keys()).sort((a, b) =>
    sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  )

  return dates.map((date) => ({ date, rows: map.get(date) ?? [] }))
}
