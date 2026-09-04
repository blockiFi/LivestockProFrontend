import type { EggReport } from "@/lib/types"

export type ProductionBadgeLevel = "good" | "fair" | "low"

export type EggKpis = {
  totalEggs: number
  avgDailyEggs: number
  peakProductionPct: number
  latestProductionPct: number
  sevenDayAvgPct: number
}

export type EggTrendPoint = {
  date: string
  label: string
  eggs: number
  productionPct: number
}

export type DayOverDayDelta = {
  eggsDelta: number | null
  productionPctDelta: number | null
}

function toDateKey(value: string): string {
  return value.slice(0, 10)
}

function formatLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`)
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function sortEggReportsByDate(reports: EggReport[], direction: "asc" | "desc" = "desc"): EggReport[] {
  return [...reports].sort((a, b) => {
    const cmp = toDateKey(a.date).localeCompare(toDateKey(b.date))
    return direction === "asc" ? cmp : -cmp
  })
}

export function filterEggReportsByDateRange(
  reports: EggReport[],
  dateFrom?: string,
  dateTo?: string
): EggReport[] {
  return reports.filter((report) => {
    const key = toDateKey(report.date)
    if (dateFrom && key < toDateKey(dateFrom)) return false
    if (dateTo && key > toDateKey(dateTo)) return false
    return true
  })
}

export function computeEggKpis(reports: EggReport[]): EggKpis {
  if (reports.length === 0) {
    return {
      totalEggs: 0,
      avgDailyEggs: 0,
      peakProductionPct: 0,
      latestProductionPct: 0,
      sevenDayAvgPct: 0,
    }
  }

  const sortedAsc = sortEggReportsByDate(reports, "asc")
  const totalEggs = reports.reduce((sum, report) => sum + Number(report.eggs_collected || 0), 0)
  const avgDailyEggs = totalEggs / reports.length
  const peakProductionPct = Math.max(...reports.map((report) => Number(report.production_percentage || 0)))
  const latest = sortEggReportsByDate(reports, "desc")[0]
  const latestProductionPct = Number(latest?.production_percentage || 0)

  const lastSeven = sortedAsc.slice(-7)
  const sevenDayAvgPct = lastSeven.length
    ? lastSeven.reduce((sum, report) => sum + Number(report.production_percentage || 0), 0) / lastSeven.length
    : 0

  return {
    totalEggs,
    avgDailyEggs,
    peakProductionPct,
    latestProductionPct,
    sevenDayAvgPct,
  }
}

export function buildEggTrendSeries(reports: EggReport[], days?: number): EggTrendPoint[] {
  const sortedAsc = sortEggReportsByDate(reports, "asc")
  const series = days != null ? sortedAsc.slice(-days) : sortedAsc

  return series.map((report) => {
    const dateKey = toDateKey(report.date)
    return {
      date: dateKey,
      label: formatLabel(dateKey),
      eggs: Number(report.eggs_collected || 0),
      productionPct: Number(report.production_percentage || 0),
    }
  })
}

export function getProductionBadgeLevel(pct: number): ProductionBadgeLevel {
  if (pct >= 80) return "good"
  if (pct >= 60) return "fair"
  return "low"
}

export function getDayOverDayDelta(report: EggReport, previous?: EggReport | null): DayOverDayDelta {
  if (!previous) {
    return { eggsDelta: null, productionPctDelta: null }
  }

  return {
    eggsDelta: Number(report.eggs_collected || 0) - Number(previous.eggs_collected || 0),
    productionPctDelta: Number(report.production_percentage || 0) - Number(previous.production_percentage || 0),
  }
}

/** Lifetime egg inventory: collected − sold − broken (never negative). */
export function computeEggStock(
  totalCollected: number,
  totalSold: number,
  totalBroken = 0
): {
  collected: number
  sold: number
  broken: number
  available: number
} {
  const collected = Math.max(0, Number(totalCollected) || 0)
  const sold = Math.max(0, Number(totalSold) || 0)
  const broken = Math.max(0, Number(totalBroken) || 0)
  return {
    collected,
    sold,
    broken,
    available: Math.max(0, collected - sold - broken),
  }
}

export function sumBrokenEggs(
  records: Array<{ date?: string; eggs_broken?: number | null }>,
  dateFrom?: string,
  dateTo?: string
): number {
  return records.reduce((sum, record) => {
    const key = record.date ? toDateKey(record.date) : ""
    if (dateFrom && key && key < toDateKey(dateFrom)) return sum
    if (dateTo && key && key > toDateKey(dateTo)) return sum
    return sum + Math.max(0, Number(record.eggs_broken || 0))
  }, 0)
}
