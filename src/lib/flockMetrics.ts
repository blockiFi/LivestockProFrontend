import type { DetailedFlockRecord, FlockProfitLoss } from "@/lib/types"

export type PoultryKind = "broiler" | "layer" | "dual" | "other"

export type ChartPoint = {
  date: string
  label: string
  value: number
}

export type FlockMetricsKpis = {
  birdsRemaining: number
  initialBirds: number
  totalMortality: number
  mortalityRate: number
  survivalRate: number
  daysInFlock: number
  currentAge: number
  totalFeedKg: number
  feedPerBird: number
  fcr: number | null
  averageDailyGain: number | null
  latestWeightGrams: number | null
  totalEggs: number
  avgDailyEggs: number
  henDayProduction: number | null
  totalRevenue: number
  totalCost: number
  netProfit: number
  marginPercent: number
  costPerBird: number
  birdsSold: number
}

export type FlockMetricsTrends = {
  mortality: ChartPoint[]
  weight: ChartPoint[]
  eggs: ChartPoint[]
  feed: ChartPoint[]
  financial: { category: string; total_cost: number }[]
}

export type FlockMetricsBundle = {
  poultryKind: PoultryKind
  kpis: FlockMetricsKpis
  trends: FlockMetricsTrends
  ruleInsights: string[]
}

export const INITIAL_FLOCK_WEIGHT_GRAMS = 40

/** Weight reports store average_weight in kg; daily records use grams. */
export function weightReportKgToGrams(kg: number): number {
  return kg * 1000
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

export function computeFlockFcr(
  weightReports: DetailedFlockRecord["weight_reports"],
  dailyRecords: DetailedFlockRecord["daily_records"],
  feedUsages: DetailedFlockRecord["poultry_feed_usages"],
  flockQuantity: number
): number | null {
  const sortedReports = [...(weightReports ?? [])]
    .filter((report) => toNumber(report.average_weight) > 0)
    .sort((a, b) => toDateKey(a.report_date).localeCompare(toDateKey(b.report_date)))

  const lastReport = sortedReports[sortedReports.length - 1]

  let lastWeightGrams: number | null = null
  let weightDate = ""
  let birdCount = Math.max(1, flockQuantity)

  if (lastReport) {
    lastWeightGrams = weightReportKgToGrams(toNumber(lastReport.average_weight))
    weightDate = toDateKey(lastReport.report_date)
    birdCount = Math.max(1, toNumber(lastReport.number_of_birds) || flockQuantity)
  } else {
    const sortedDaily = [...(dailyRecords ?? [])]
      .filter((record) => toNumber(record.avg_weight_grams) > 0)
      .sort((a, b) => toDateKey(a.date).localeCompare(toDateKey(b.date)))
    const lastDaily = sortedDaily[sortedDaily.length - 1]
    if (!lastDaily) return null
    lastWeightGrams = toNumber(lastDaily.avg_weight_grams)
    weightDate = toDateKey(lastDaily.date)
  }

  const weightGainGrams = lastWeightGrams - INITIAL_FLOCK_WEIGHT_GRAMS
  if (weightGainGrams <= 0) return null

  const feedFromUsages = (feedUsages ?? [])
    .filter((usage) => toDateKey(usage.usage_date) < weightDate)
    .reduce((sum, usage) => sum + toNumber(usage.quantity), 0)

  const feedFromDaily = (dailyRecords ?? [])
    .filter((record) => toDateKey(record.date) < weightDate)
    .reduce((sum, record) => sum + toNumber(record.feed_consumed_kg), 0)

  const totalFeedKg = Math.max(feedFromUsages, feedFromDaily)
  if (totalFeedKg <= 0) return null

  const feedPerBirdKg = totalFeedKg / birdCount
  const weightGainKg = weightGainGrams / 1000

  return feedPerBirdKg / weightGainKg
}

function toDateKey(value: string | null | undefined): string {
  if (!value) return ""
  return value.includes("T") ? value.split("T")[0] : value
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function resolvePoultryKind(typeName?: string | null): PoultryKind {
  const name = (typeName ?? "").toLowerCase()
  if (name.includes("dual")) return "dual"
  if (name.includes("layer")) return "layer"
  if (name.includes("broiler")) return "broiler"
  return "other"
}

function sortByDate<T extends { date?: string; report_date?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const da = toDateKey(a.date ?? a.report_date)
    const db = toDateKey(b.date ?? b.report_date)
    return da.localeCompare(db)
  })
}

export function buildFlockMetrics(
  flock: DetailedFlockRecord,
  profitLoss: FlockProfitLoss | null | undefined,
  daysInFlock: number,
  currentAge: number
): FlockMetricsBundle {
  const poultryKind = resolvePoultryKind(flock.poultry_type?.name)
  const initialBirds = flock.quantity || 0
  const birdsRemaining = flock.actual_quantity ?? initialBirds

  const mortalityReports = flock.mortality_reports ?? []
  const dailyRecords = flock.daily_records ?? []
  const weightReports = sortByDate(flock.weight_reports ?? [])
  const eggReports = sortByDate(flock.egg_reports ?? [])
  const feedUsages = flock.poultry_feed_usages ?? []

  const mortalityFromReports = mortalityReports.reduce((sum, r) => sum + toNumber(r.mortality_count), 0)
  const mortalityFromDaily = dailyRecords.reduce((sum, r) => sum + toNumber(r.mortality), 0)
  const totalMortality = Math.max(mortalityFromReports, mortalityFromDaily)

  const mortalityRate = initialBirds > 0 ? (totalMortality / initialBirds) * 100 : 0
  const survivalRate = Math.max(0, 100 - mortalityRate)

  const feedFromUsages = feedUsages.reduce((sum, r) => sum + toNumber(r.quantity), 0)
  const feedFromDaily = dailyRecords.reduce((sum, r) => sum + toNumber(r.feed_consumed_kg), 0)
  const totalFeedKg = feedFromUsages > 0 ? feedFromUsages : feedFromDaily
  const feedPerBird = birdsRemaining > 0 ? totalFeedKg / birdsRemaining : 0

  const weightPoints: { date: string; grams: number }[] = []
  for (const report of weightReports) {
    const grams = weightReportKgToGrams(toNumber(report.average_weight))
    if (grams > 0) weightPoints.push({ date: toDateKey(report.report_date), grams })
  }
  for (const record of dailyRecords) {
    const grams = toNumber(record.avg_weight_grams)
    if (grams > 0) weightPoints.push({ date: toDateKey(record.date), grams })
  }
  weightPoints.sort((a, b) => a.date.localeCompare(b.date))

  const lastWeightPoint = weightPoints[weightPoints.length - 1]
  const lastWeight = lastWeightPoint?.grams ?? null

  const weightGainGrams =
    lastWeight != null ? Math.max(0, lastWeight - INITIAL_FLOCK_WEIGHT_GRAMS) : 0

  let averageDailyGain: number | null = null
  if (lastWeight != null && lastWeightPoint && weightGainGrams > 0) {
    const arrivalDate = toDateKey(flock.arrival_date)
    const daySpan = daysBetween(arrivalDate, lastWeightPoint.date)
    averageDailyGain = weightGainGrams / daySpan
  }

  const fcr = computeFlockFcr(
    flock.weight_reports,
    flock.daily_records,
    flock.poultry_feed_usages,
    initialBirds
  )

  const totalEggsFromReports = eggReports.reduce((sum, r) => sum + toNumber(r.eggs_collected), 0)
  const totalEggsFromDaily = dailyRecords.reduce((sum, r) => sum + toNumber(r.eggs_collected), 0)
  const totalEggs = Math.max(totalEggsFromReports, totalEggsFromDaily)

  const eggDays = Math.max(1, eggReports.length || dailyRecords.filter((r) => toNumber(r.eggs_collected) > 0).length)
  const avgDailyEggs = totalEggs / eggDays

  const productionValues = eggReports
    .map((r) => toNumber(r.production_percentage))
    .filter((v) => v > 0)
  const henDayProduction =
    productionValues.length > 0
      ? productionValues.reduce((sum, v) => sum + v, 0) / productionValues.length
      : birdsRemaining > 0 && totalEggs > 0
        ? (totalEggs / (birdsRemaining * eggDays)) * 100
        : null

  const totalRevenue = profitLoss?.total_revenue ?? 0
  const totalCost = profitLoss?.total_cost ?? 0
  const netProfit = profitLoss?.net_profit ?? totalRevenue - totalCost
  const marginPercent = profitLoss?.margin_percent ?? (totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0)
  const birdsSold = profitLoss?.birds_sold ?? 0
  const costPerBird = birdsRemaining > 0 ? totalCost / birdsRemaining : 0

  const mortalityMap = new Map<string, number>()
  for (const report of mortalityReports) {
    const key = toDateKey(report.date)
    mortalityMap.set(key, (mortalityMap.get(key) ?? 0) + toNumber(report.mortality_count))
  }
  for (const record of dailyRecords) {
    const key = toDateKey(record.date)
    const val = toNumber(record.mortality)
    if (val > 0) mortalityMap.set(key, (mortalityMap.get(key) ?? 0) + val)
  }

  const mortalityTrend: ChartPoint[] = [...mortalityMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value,
    }))

  const weightTrend: ChartPoint[] = weightPoints.map((point) => ({
    date: point.date,
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: point.grams,
  }))

  const eggMap = new Map<string, number>()
  for (const report of eggReports) {
    const key = toDateKey(report.date)
    eggMap.set(key, (eggMap.get(key) ?? 0) + toNumber(report.eggs_collected))
  }
  for (const record of dailyRecords) {
    const key = toDateKey(record.date)
    const val = toNumber(record.eggs_collected)
    if (val > 0) eggMap.set(key, (eggMap.get(key) ?? 0) + val)
  }

  const eggsTrend: ChartPoint[] = [...eggMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value,
    }))

  const feedMap = new Map<string, number>()
  for (const usage of feedUsages) {
    const key = toDateKey(usage.usage_date)
    feedMap.set(key, (feedMap.get(key) ?? 0) + toNumber(usage.quantity))
  }
  for (const record of dailyRecords) {
    const key = toDateKey(record.date)
    const val = toNumber(record.feed_consumed_kg)
    if (val > 0) feedMap.set(key, (feedMap.get(key) ?? 0) + val)
  }

  const feedTrend: ChartPoint[] = [...feedMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value,
    }))

  const financial = profitLoss?.cost_by_category ?? []

  const ruleInsights: string[] = []
  if (mortalityRate >= 5) ruleInsights.push("Mortality rate is above 5% — review housing, feed, and health protocols.")
  if (mortalityRate >= 2 && mortalityRate < 5) ruleInsights.push("Mortality is elevated — monitor closely over the next few days.")
  if (netProfit < 0 && totalCost > 0) ruleInsights.push("This flock is running at a loss based on recorded costs and sales.")
  if (dailyRecords.length === 0) ruleInsights.push("No daily records yet — add records to unlock richer trend analysis.")
  if (poultryKind === "broiler" && fcr != null && fcr > 2.2) ruleInsights.push("Feed conversion ratio is high — review feed quality and intake.")
  if (poultryKind === "layer" && henDayProduction != null && henDayProduction < 70) {
    ruleInsights.push("Hen-day production is below typical layer benchmarks.")
  }
  if (fcr != null && fcr > 0 && fcr <= 1.8 && poultryKind !== "layer") {
    ruleInsights.push("Feed conversion is strong for this flock type.")
  }

  return {
    poultryKind,
    kpis: {
      birdsRemaining,
      initialBirds,
      totalMortality,
      mortalityRate,
      survivalRate,
      daysInFlock,
      currentAge,
      totalFeedKg,
      feedPerBird,
      fcr,
      averageDailyGain,
      latestWeightGrams: lastWeight,
      totalEggs,
      avgDailyEggs,
      henDayProduction,
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
      costPerBird,
      birdsSold,
    },
    trends: {
      mortality: mortalityTrend,
      weight: weightTrend,
      eggs: eggsTrend,
      feed: feedTrend,
      financial,
    },
    ruleInsights,
  }
}

export function buildFlockMetricsSnapshot(
  flock: DetailedFlockRecord,
  profitLoss: FlockProfitLoss | null | undefined,
  daysInFlock: number,
  currentAge: number
): Record<string, unknown> {
  const bundle = buildFlockMetrics(flock, profitLoss, daysInFlock, currentAge)
  return {
    flock: {
      id: flock.id,
      name: flock.name,
      batch_number: flock.batch_number,
      breed: flock.breed,
      poultry_type: flock.poultry_type?.name,
      status: flock.status,
      age_days: currentAge,
      days_in_flock: daysInFlock,
      initial_birds: bundle.kpis.initialBirds,
      birds_remaining: bundle.kpis.birdsRemaining,
    },
    performance: {
      mortality_rate_percent: round(bundle.kpis.mortalityRate),
      survival_rate_percent: round(bundle.kpis.survivalRate),
      total_mortality: bundle.kpis.totalMortality,
      feed_kg: round(bundle.kpis.totalFeedKg),
      feed_per_bird_kg: round(bundle.kpis.feedPerBird),
      fcr: bundle.kpis.fcr != null ? round(bundle.kpis.fcr) : null,
      average_daily_gain_g: bundle.kpis.averageDailyGain != null ? round(bundle.kpis.averageDailyGain) : null,
      latest_weight_g: bundle.kpis.latestWeightGrams,
      total_eggs: bundle.kpis.totalEggs,
      hen_day_production_percent:
        bundle.kpis.henDayProduction != null ? round(bundle.kpis.henDayProduction) : null,
    },
    financial: {
      total_revenue: round(bundle.kpis.totalRevenue),
      total_cost: round(bundle.kpis.totalCost),
      net_profit: round(bundle.kpis.netProfit),
      margin_percent: round(bundle.kpis.marginPercent),
      birds_sold: bundle.kpis.birdsSold,
      cost_per_bird: round(bundle.kpis.costPerBird),
    },
    records_summary: {
      daily_records: flock.daily_records?.length ?? 0,
      mortality_reports: flock.mortality_reports?.length ?? 0,
      weight_reports: flock.weight_reports?.length ?? 0,
      egg_reports: flock.egg_reports?.length ?? 0,
      feed_usages: flock.poultry_feed_usages?.length ?? 0,
    },
    recent_trends: {
      mortality_last_7_days: bundle.trends.mortality.slice(-7).map((p) => ({ date: p.date, count: p.value })),
      feed_last_7_days: bundle.trends.feed.slice(-7).map((p) => ({ date: p.date, kg: p.value })),
      eggs_last_7_days: bundle.trends.eggs.slice(-7).map((p) => ({ date: p.date, count: p.value })),
    },
  }
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
