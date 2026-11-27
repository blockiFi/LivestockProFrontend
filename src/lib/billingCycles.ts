/**
 * How often a farm pays. Mirrors App\Support\BillingCycle on the backend:
 * 6 months is 5% off the monthly price, a year is 10% off, rounded to whole
 * naira. The API returns the real prices per plan; these helpers are for
 * labels and for the public landing page, which has no API call.
 */
export type BillingCycle = "monthly" | "biannual" | "annual"

export const BILLING_CYCLES: {
  cycle: BillingCycle
  label: string
  short: string
  months: number
  discountPercent: number
  per: string
}[] = [
  { cycle: "monthly", label: "Monthly", short: "Monthly", months: 1, discountPercent: 0, per: "month" },
  { cycle: "biannual", label: "Every 6 months", short: "6 months", months: 6, discountPercent: 5, per: "6 months" },
  { cycle: "annual", label: "Yearly", short: "Yearly", months: 12, discountPercent: 10, per: "year" },
]

export function cycleInfo(cycle: BillingCycle | string | null | undefined) {
  return BILLING_CYCLES.find((c) => c.cycle === cycle) ?? BILLING_CYCLES[0]
}

/** Price in naira for one payment on the cycle, from a monthly price in naira. */
export function cyclePrice(monthly: number, cycle: BillingCycle): number {
  const { months, discountPercent } = cycleInfo(cycle)
  if (months === 1) return monthly
  return Math.round((monthly * months * (100 - discountPercent)) / 100)
}
