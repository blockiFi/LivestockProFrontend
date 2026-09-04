import { addDays, format, parseISO } from "date-fns"
import type { MissedFeedingDay, ScheduleImportItemDraft } from "./types"

export type FeedingRangeLike = {
  start_day?: number | null
  end_day?: number | null
  feeding_day?: number | null
  is_open_ended?: boolean
  open_ended?: boolean
}

export type FeedingImportLayout = "range" | "per_day"

export type FeedingTimeSlot = { time: string; percentage: number }

export const DEFAULT_FEEDING_TIMES: FeedingTimeSlot[] = [
  { time: "08:00", percentage: 50 },
  { time: "17:00", percentage: 50 },
]

/**
 * Normalize API / legacy feeding_times into editable { time, percentage } slots.
 * Handles JSON strings, legacy string arrays (["08:00", "17:00"]), and missing percentages.
 */
export function normalizeFeedingTimesForUi(
  raw: unknown,
  fallback: FeedingTimeSlot[] = DEFAULT_FEEDING_TIMES
): FeedingTimeSlot[] {
  let value: unknown = raw

  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return fallback.map((t) => ({ ...t }))
    }
  }

  if (!Array.isArray(value) || value.length === 0) {
    return fallback.map((t) => ({ ...t }))
  }

  const normalized: FeedingTimeSlot[] = value.map((entry) => {
    if (typeof entry === "string") {
      return { time: entry, percentage: 0 }
    }
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>
      const time = String(obj.time ?? obj.feeding_time ?? "08:00")
      const pct = Number(obj.percentage ?? obj.percent ?? 0)
      return { time, percentage: Number.isFinite(pct) ? pct : 0 }
    }
    return { time: "08:00", percentage: 0 }
  })

  const total = normalized.reduce((sum, slot) => sum + slot.percentage, 0)
  if (total > 0) {
    return normalized
  }

  const count = normalized.length
  const base = Math.floor((100 / count) * 100) / 100
  let remainder = 100
  return normalized.map((slot, index) => {
    const percentage =
      index === count - 1 ? Math.round(remainder * 100) / 100 : base
    remainder -= percentage
    return { ...slot, percentage }
  })
}

/** Format as "Day 1–7", "Day 50+", or "Day 3". */
export function formatFeedingDayRange(
  start: number | null | undefined,
  end: number | null | undefined
): string {
  if (start == null || Number.isNaN(Number(start))) {
    return "—"
  }
  const s = Number(start)
  if (end == null) {
    return `Day ${s}+`
  }
  const e = Number(end)
  if (e === s) {
    return `Day ${s}`
  }
  return `Day ${s}–${e}`
}

export function resolveRangeBounds(item: FeedingRangeLike): {
  start_day: number
  end_day: number | null
} {
  const start = Number(item.start_day ?? item.feeding_day ?? 1)
  if (item.is_open_ended || item.open_ended) {
    return { start_day: start, end_day: null }
  }
  // Explicit null end_day from API means open-ended when start_day is set.
  if (item.end_day === null && item.start_day != null) {
    return { start_day: start, end_day: null }
  }
  if (item.end_day != null) {
    return { start_day: start, end_day: Number(item.end_day) }
  }
  // Legacy single-day row (feeding_day only).
  return { start_day: start, end_day: start }
}

export function coversFeedingDay(item: FeedingRangeLike, day: number): boolean {
  const { start_day, end_day } = resolveRangeBounds(item)
  if (day < start_day) return false
  if (end_day == null) return true
  return day <= end_day
}

export type RangeValidationResult = {
  errors: string[]
  warnings: string[]
}

/**
 * Client-side mirror of FeedingScheduleRangeService::validateRanges.
 */
export function validateFeedingRanges(
  ranges: Array<{ start_day: number; end_day: number | null; id?: string | number }>
): RangeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const normalized = ranges
    .map((r, index) => ({
      key: r.id ?? `index:${index}`,
      start_day: Number(r.start_day),
      end_day: r.end_day == null ? null : Number(r.end_day),
    }))
    .filter((r) => !Number.isNaN(r.start_day))

  for (const r of normalized) {
    if (r.start_day < 1) {
      errors.push(`Range starting at day ${r.start_day} must have start_day >= 1.`)
    }
    if (r.end_day != null && r.end_day < r.start_day) {
      errors.push(`Range starting at day ${r.start_day} has end_day before start_day.`)
    }
  }

  const sorted = [...normalized].sort((a, b) => {
    if (a.start_day !== b.start_day) return a.start_day - b.start_day
    return (a.end_day ?? Number.MAX_SAFE_INTEGER) - (b.end_day ?? Number.MAX_SAFE_INTEGER)
  })

  const openEnded = sorted.filter((r) => r.end_day == null)
  if (openEnded.length > 1) {
    errors.push("Only one open-ended range is allowed per schedule.")
  }
  if (openEnded.length === 1) {
    const last = sorted[sorted.length - 1]
    if (last && last.key !== openEnded[0].key) {
      errors.push("An open-ended range must be the last (highest start_day) range.")
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]
      const b = sorted[j]
      const aEnd = a.end_day ?? Number.MAX_SAFE_INTEGER
      const bEnd = b.end_day ?? Number.MAX_SAFE_INTEGER
      if (a.start_day <= bEnd && b.start_day <= aEnd) {
        errors.push(
          `Ranges overlap: ${formatFeedingDayRange(a.start_day, a.end_day)} and ${formatFeedingDayRange(b.start_day, b.end_day)}.`
        )
      }
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    if (current.end_day == null) continue
    const expectedNext = current.end_day + 1
    if (next.start_day > expectedNext) {
      warnings.push(
        `Gap between Day ${current.end_day} and Day ${next.start_day} (no feeding rate).`
      )
    }
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}

/** Parse "Week 1-2" or "W3" into start/end days (week 1 = days 1–7). */
export function parseWeekHelper(input: string): { start_day: number; end_day: number } | null {
  const trimmed = input.trim().toLowerCase()
  const rangeMatch = trimmed.match(/^w(?:eek)?\s*(\d+)\s*[-–to]+\s*(\d+)$/i)
  if (rangeMatch) {
    const w1 = Math.max(1, parseInt(rangeMatch[1], 10))
    const w2 = Math.max(w1, parseInt(rangeMatch[2], 10))
    return { start_day: (w1 - 1) * 7 + 1, end_day: w2 * 7 }
  }
  const single = trimmed.match(/^w(?:eek)?\s*(\d+)$/i)
  if (single) {
    const w = Math.max(1, parseInt(single[1], 10))
    return { start_day: (w - 1) * 7 + 1, end_day: w * 7 }
  }
  return null
}

export function plannedKgForRange(
  quantityGramsPerBird: number,
  flockSize: number,
  startDay: number,
  endDay: number | null,
  /** When open-ended, estimate this many days for preview. */
  openEndedPreviewDays = 30
): number {
  const days =
    endDay == null ? openEndedPreviewDays : Math.max(0, endDay - startDay + 1)
  return (quantityGramsPerBird * flockSize * days) / 1000
}

function rangeWidth(item: FeedingRangeLike): number {
  const { start_day, end_day } = resolveRangeBounds(item)
  if (end_day == null) return Number.MAX_SAFE_INTEGER
  return Math.max(1, end_day - start_day + 1)
}

/** Narrowest covering range wins; ties break on highest start_day. */
export function resolveForFeedingDay<T extends FeedingRangeLike & { id: number }>(
  items: T[],
  day: number
): T | null {
  const covering = items.filter((item) => coversFeedingDay(item, day))
  if (covering.length === 0) return null

  return [...covering].sort((a, b) => {
    const widthA = rangeWidth(a)
    const widthB = rangeWidth(b)
    if (widthA !== widthB) return widthA - widthB
    return resolveRangeBounds(b).start_day - resolveRangeBounds(a).start_day
  })[0]
}

/**
 * Client-side mirror of FeedingScheduleRangeService::resolveForMissedBackfillDay.
 */
export function resolveForMissedBackfillDay<T extends FeedingRangeLike & { id: number }>(
  items: T[],
  day: number
): T | null {
  const resolved = resolveForFeedingDay(items, day)
  if (resolved) return resolved

  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => {
    const as = resolveRangeBounds(a).start_day
    const bs = resolveRangeBounds(b).start_day
    return as !== bs ? as - bs : a.id - b.id
  })

  const earliest = sorted[0]
  const earliestStart = resolveRangeBounds(earliest).start_day
  if (day < earliestStart) return earliest

  let previous: T | null = null
  for (const item of sorted) {
    const { start_day, end_day } = resolveRangeBounds(item)
    if (day < start_day) {
      return previous ?? earliest
    }
    if (end_day == null || day <= end_day) {
      return item
    }
    previous = item
  }

  return previous ?? earliest
}

/**
 * Client-side mirror of FeedingMissedScheduleService::collectMissedDays.
 */
export function listMissedFeedingDays(params: {
  scheduleItems: Array<FeedingRangeLike & {
    id: number
    quantity?: number
    feeding_times?: { time: string; percentage: number }[]
    feed_type_id?: number
    feed_type?: { id?: number; name?: string }
  }>
  executedItems: Array<{ feeding_date: string }>
  currentFeedingDay: number
  arrivalDate: string
  flockQuantity: number
}): MissedFeedingDay[] {
  const { scheduleItems, executedItems, currentFeedingDay, arrivalDate, flockQuantity } = params
  if (currentFeedingDay <= 1) return []

  const recordedDates = new Set(
    executedItems.map((item) => item.feeding_date.slice(0, 10))
  )
  const arrival = parseISO(arrivalDate)
  const missed: MissedFeedingDay[] = []

  for (let day = 1; day < currentFeedingDay; day++) {
    const scheduleItem = resolveForMissedBackfillDay(scheduleItems, day)
    if (!scheduleItem) continue

    const feedingDate = format(addDays(arrival, day - 1), "yyyy-MM-dd")
    if (recordedDates.has(feedingDate)) continue

    const perBirdGrams = Number(scheduleItem.quantity || 0)
    missed.push({
      feeding_day: day,
      feeding_date: feedingDate,
      feeding_schedule_item_id: scheduleItem.id,
      feed_type_id: scheduleItem.feed_type_id ?? scheduleItem.feed_type?.id ?? 0,
      feed_type_name: scheduleItem.feed_type?.name ?? "Unknown",
      planned_quantity: perBirdGrams,
      feeding_times: scheduleItem.feeding_times || [{ time: "08:00", percentage: 100 }],
      planned_total_kg: round((perBirdGrams * flockQuantity) / 1000, 3),
    })
  }

  return missed
}

/**
 * Late backfill records on past days that can be reverted.
 */
export function listRevertibleFeedingDays(params: {
  executedItems: Array<{ feeding_date: string; status?: string }>
  currentFeedingDay: number
  arrivalDate: string
}): Array<{ feeding_date: string; status: string }> {
  const { executedItems, currentFeedingDay } = params
  if (currentFeedingDay <= 1) return []

  const today = format(new Date(), "yyyy-MM-dd")

  return executedItems
    .filter((item) => {
      const date = item.feeding_date.slice(0, 10)
      return item.status === "late" && date < today
    })
    .map((item) => ({
      feeding_date: item.feeding_date.slice(0, 10),
      status: item.status ?? "late",
    }))
}

export function countMissedDaysInRange(
  scheduleItemId: number,
  startDay: number,
  endDay: number | null,
  currentFeedingDay: number,
  scheduleItems: Array<FeedingRangeLike & { id: number }>,
  executedItems: Array<{ feeding_date: string }>,
  arrivalDate: string
): number {
  if (currentFeedingDay <= startDay) return 0

  const recordedDates = new Set(
    executedItems.map((item) => item.feeding_date.slice(0, 10))
  )
  const arrival = parseISO(arrivalDate)
  const effectiveEnd = Math.min(
    endDay ?? currentFeedingDay - 1,
    currentFeedingDay - 1
  )

  let missed = 0
  for (let day = startDay; day <= effectiveEnd; day++) {
    const covering = resolveForMissedBackfillDay(scheduleItems, day)
    if (!covering || covering.id !== scheduleItemId) continue

    const feedingDate = format(addDays(arrival, day - 1), "yyyy-MM-dd")
    if (!recordedDates.has(feedingDate)) missed++
  }

  return missed
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Expand a draft feeding import row into one row per day (for per_day layout). */
export function expandFeedingImportItemToDays(
  item: ScheduleImportItemDraft
): ScheduleImportItemDraft[] {
  const start = Number(item.start_day ?? item.feeding_day ?? 0)
  if (!start || Number.isNaN(start)) return []

  const end =
    item.end_day === null && item.start_day != null
      ? null
      : Number(item.end_day ?? item.start_day ?? item.feeding_day ?? start)

  if (end == null) {
    return [{ ...item, start_day: start, end_day: null, feeding_day: start }]
  }

  if (end <= start) {
    return [{ ...item, start_day: start, end_day: start, feeding_day: start }]
  }

  const rows: ScheduleImportItemDraft[] = []
  for (let day = start; day <= end; day++) {
    rows.push({
      ...item,
      start_day: day,
      end_day: day,
      feeding_day: day,
    })
  }

  return rows
}
