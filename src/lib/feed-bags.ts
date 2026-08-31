/** Standard feed bag size used when stocking feed inventory. */
export const FEED_BAG_KG = 25

export function bagsToKg(bags: number): number {
  return bags * FEED_BAG_KG
}

export function kgToBags(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  return kg / FEED_BAG_KG
}

/** Format remaining kg as bags, e.g. "4 bags" or "3.4 bags". */
export function formatBagsFromKg(kg: number): string {
  const bags = kgToBags(kg)
  const rounded = Number.isInteger(bags) ? bags.toString() : bags.toFixed(1).replace(/\.0$/, "")
  const label = Math.abs(bags - 1) < 0.05 ? "bag" : "bags"
  return `${rounded} ${label}`
}
