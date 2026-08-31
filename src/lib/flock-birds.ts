/** Normalize YYYY-MM-DD from API date strings. */
function toDateKey(value: string): string {
  return value.slice(0, 10)
}

/**
 * Birds alive at the start of `date` (before mortality recorded on that day).
 * Uses arrival quantity minus prior mortality and culls strictly before the date.
 */
export function getBirdCountOnDate(
  initialQuantity: number,
  date: string,
  options?: {
    mortalityReports?: Array<{ id?: number; date: string; mortality_count: number }>
    dailyRecords?: Array<{ date: string; culls?: number; culling_count?: number }>
    excludeReportId?: number
  }
): number {
  const target = toDateKey(date)

  const priorMortality = (options?.mortalityReports ?? [])
    .filter((report) => {
      if (options?.excludeReportId != null && report.id === options.excludeReportId) {
        return false
      }
      return toDateKey(report.date) < target
    })
    .reduce((sum, report) => sum + Number(report.mortality_count || 0), 0)

  const priorCulls = (options?.dailyRecords ?? [])
    .filter((record) => toDateKey(record.date) < target)
    .reduce((sum, record) => {
      const culls = record.culling_count ?? record.culls ?? 0
      return sum + Number(culls || 0)
    }, 0)

  return Math.max(0, Number(initialQuantity || 0) - priorMortality - priorCulls)
}
