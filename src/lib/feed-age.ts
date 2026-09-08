/**
 * Bird age in days (arrival_age_days + days since arrival), floored at 1.
 */
export function flockAgeDaysOnDate(
  arrivalDate: string,
  arrivalAgeDays: number,
  onDate: string = new Date().toISOString().slice(0, 10)
): number {
  const arrival = new Date(arrivalDate.includes("T") ? arrivalDate : `${arrivalDate}T12:00:00`)
  const target = new Date(onDate.includes("T") ? onDate : `${onDate}T12:00:00`)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysSinceArrival = Math.max(0, Math.floor((target.getTime() - arrival.getTime()) / msPerDay))
  return Math.max(1, (arrivalAgeDays || 0) + daysSinceArrival)
}

/**
 * e.g. 320 → "45 weeks + 5 days"
 *      315 → "45 weeks"
 *      5   → "5 days"
 */
export function formatBirdAgeWeeksAndDays(ageDays: number): string {
  const days = Math.max(0, Math.floor(Number(ageDays) || 0))
  const weeks = Math.floor(days / 7)
  const remainder = days % 7

  if (weeks === 0) {
    return `${days} day${days === 1 ? "" : "s"}`
  }
  if (remainder === 0) {
    return `${weeks} week${weeks === 1 ? "" : "s"}`
  }
  return `${weeks} week${weeks === 1 ? "" : "s"} + ${remainder} day${remainder === 1 ? "" : "s"}`
}

export function effectiveFeedAgeRange(feedType: {
  start_age?: number | null
  end_age?: number | null
  effective_start_age?: number | null
  effective_end_age?: number | null
}): { start: number | null; end: number | null } {
  const start =
    feedType.effective_start_age !== undefined
      ? feedType.effective_start_age
      : feedType.start_age ?? null
  const end =
    feedType.effective_end_age !== undefined
      ? feedType.effective_end_age
      : feedType.end_age ?? null
  return { start, end }
}

export function formatFeedAgeRange(start: number | null | undefined, end: number | null | undefined): string | null {
  if (start == null) return null
  if (end == null) return `${start}+`
  return `${start}-${end}`
}

/** True when the feed type has no range, or age falls within it (inclusive). */
export function isFeedTypeAgeAppropriate(
  feedType: {
    start_age?: number | null
    end_age?: number | null
    effective_start_age?: number | null
    effective_end_age?: number | null
  },
  ageDays: number
): boolean {
  const { start, end } = effectiveFeedAgeRange(feedType)
  if (start == null) return true
  const age = Math.max(1, ageDays)
  if (age < start) return false
  if (end != null && age > end) return false
  return true
}
