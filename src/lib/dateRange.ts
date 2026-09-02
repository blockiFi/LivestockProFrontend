import type { DetailedFlockRecord } from "@/lib/types"

export type ActivityDateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_7"
  | "this_month"
  | "last_30"
  | "custom"

/** Presets shared with expenditure views (subset of activity presets). */
export type ExpenditureDateRangePreset = "all" | "this_month" | "last_30" | "last_90" | "custom"

export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseLocalIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toIso(d: Date): string {
  return toLocalIsoDate(d)
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function resolveActivityDateRange(
  preset: ActivityDateRangePreset,
  customFrom: string,
  customTo: string
): { dateFrom: string; dateTo: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === "today") {
    return { dateFrom: toIso(today), dateTo: toIso(today) }
  }

  if (preset === "yesterday") {
    const y = new Date(today)
    y.setDate(y.getDate() - 1)
    return { dateFrom: toIso(y), dateTo: toIso(y) }
  }

  if (preset === "this_week") {
    return { dateFrom: toIso(startOfWeek(today)), dateTo: toIso(today) }
  }

  if (preset === "last_7") {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  if (preset === "last_30") {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  return { dateFrom: customFrom, dateTo: customTo }
}

export function resolveExpenditureDateRange(
  preset: ExpenditureDateRangePreset,
  customFrom: string,
  customTo: string
): { dateFrom: string; dateTo: string } {
  const today = new Date()

  if (preset === "all") {
    return { dateFrom: "", dateTo: "" }
  }

  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  if (preset === "last_30") {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  if (preset === "last_90") {
    const start = new Date(today)
    start.setDate(start.getDate() - 90)
    return { dateFrom: toIso(start), dateTo: toIso(today) }
  }

  return { dateFrom: customFrom, dateTo: customTo }
}

export function formatDateRangeLabel(from: string, to: string): string {
  if (!from && !to) return "All time"
  if (from === to) return formatDisplayDate(from)

  const start = new Date(from)
  const end = new Date(to)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  if (start.getFullYear() === end.getFullYear()) {
    const startLabel = start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    return `${startLabel} – ${fmt(end)}`
  }

  return `${fmt(start)} – ${fmt(end)}`
}

function formatDisplayDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getBatchWeek(arrivalDate: string, referenceDate?: string): number {
  const arrival = new Date(arrivalDate)
  arrival.setHours(0, 0, 0, 0)
  const ref = referenceDate ? new Date(referenceDate) : new Date()
  ref.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.floor((ref.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)))

  return Math.max(1, Math.floor(days / 7) + 1)
}

export function buildBatchBadgeLabel(
  flock: Pick<DetailedFlockRecord, "batch_number" | "name"> & {
    poultry_type?: { name?: string | null } | null
  },
  dateFrom: string,
  dateTo: string,
  batchWeek?: number
): string {
  const batchLabel = flock.batch_number
    ? `Batch #${flock.batch_number}`
    : flock.name || "Batch"
  const typeLabel = flock.poultry_type?.name ?? "Flock"
  const weekLabel = batchWeek != null ? `Week ${batchWeek}` : null
  const rangeLabel = formatDateRangeLabel(dateFrom, dateTo)

  return [batchLabel, typeLabel, weekLabel, rangeLabel].filter(Boolean).join(" · ")
}

export const ACTIVITY_DATE_PRESET_OPTIONS: { value: ActivityDateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_7", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
]
