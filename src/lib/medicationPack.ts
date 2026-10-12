// Mirrors App\Support\MedicationQuantity. Stock is stored in g (mass), ml (volume) or tablet (count).

export type UnitFamily = "mass" | "volume" | "count"

const UNITS: Record<string, [UnitFamily, number]> = {
  mg: ["mass", 0.001],
  g: ["mass", 1],
  kg: ["mass", 1000],
  ml: ["volume", 1],
  l: ["volume", 1000],
  tablet: ["count", 1],
}

const BASE_UNITS: Record<UnitFamily, string> = { mass: "g", volume: "ml", count: "tablet" }

export const PACK_TYPES = [
  { value: "sachet", label: "Sachet" },
  { value: "bottle", label: "Bottle" },
  { value: "vial", label: "Vial" },
  { value: "tin", label: "Tin" },
  { value: "bag", label: "Bag" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "other", label: "Other" },
] as const

export const PACK_SIZE_UNITS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "mg", label: "Milligrams (mg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "L", label: "Liters (L)" },
  { value: "tablet", label: "Tablets" },
] as const

export const FAMILY_UNITS: Record<UnitFamily, string[]> = {
  mass: ["g", "mg", "kg"],
  volume: ["ml", "L"],
  count: ["tablet"],
}

export const DEPLETION_REASONS = [
  { value: "wasted", label: "Wasted / spilled" },
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "other", label: "Other" },
] as const

export const unitFamily = (unit?: string | null): UnitFamily | null =>
  unit ? UNITS[unit.trim().toLowerCase()]?.[0] ?? null : null

export const baseUnitOf = (unit?: string | null): string | null => {
  const f = unitFamily(unit)
  return f ? BASE_UNITS[f] : null
}

export const toBase = (amount: number, unit: string): number | null => {
  const def = UNITS[unit.trim().toLowerCase()]
  return def ? Math.round(amount * def[1] * 10000) / 10000 : null
}

export const formatAmount = (amount: number, unit: string) =>
  `${Number(amount.toFixed(4)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit}`.trim()

export const packNoun = (packType: string | null | undefined, count: number) => {
  const noun = packType && packType !== "other" ? packType : "pack"
  if (Math.abs(count - 1) < 1e-9) return noun
  return noun === "box" ? "boxes" : `${noun}s`
}

/** e.g. 180 g of 100 g sachets → "1 sachet + 80 g". */
export function packBreakdown(
  remainingBase: number,
  packSizeBase: number | null | undefined,
  packType: string | null | undefined,
  baseUnit: string | null | undefined
): string {
  const remaining = Math.max(0, Math.round(remainingBase * 10000) / 10000)
  const unit = baseUnit || ""
  if (!packSizeBase || packSizeBase <= 0) return formatAmount(remaining, unit)

  const full = Math.floor((remaining + 1e-9) / packSizeBase)
  let loose = Math.round((remaining - full * packSizeBase) * 10000) / 10000
  if (loose < 1e-6) loose = 0
  const parts: string[] = []
  if (full > 0) parts.push(`${full} ${packNoun(packType, full)}`)
  if (loose > 0 || full === 0) parts.push(formatAmount(loose, unit))
  return parts.join(" + ")
}

type PackProduct = { pack_type?: string | null; pack_size?: number | string | null; pack_size_unit?: string | null }
type StockBatch = {
  quantity?: number | string | null
  available_quantity?: number | string | null
  content_unit?: string | null
  pack_size_base?: number | string | null
}

export const productHasPackSize = (p?: PackProduct | null) =>
  !!p?.pack_type && Number(p.pack_size) > 0 && !!unitFamily(p.pack_size_unit)

export const productPackSizeBase = (p?: PackProduct | null): number | null =>
  productHasPackSize(p) ? toBase(Number(p!.pack_size), p!.pack_size_unit!) : null

export const isUnitAwareBatch = (b: StockBatch) => !!b.content_unit && Number(b.pack_size_base) > 0

const remainingOf = (b: StockBatch) => Number(b.available_quantity ?? b.quantity) || 0

/** Level compared with a product's minimum stock: packs for unit-aware batches, raw quantity otherwise. */
export const batchStockLevel = (b: StockBatch) =>
  isUnitAwareBatch(b) ? remainingOf(b) / Number(b.pack_size_base) : remainingOf(b)

/** Value of what is left; `unit_cost` is per pack on unit-aware batches. */
export const batchValue = (b: StockBatch & { unit_cost?: number | string | null }) =>
  batchStockLevel(b) * (Number(b.unit_cost) || 0)

/** Remaining stock of one batch, e.g. "1 sachet + 80 g". */
export const batchRemainingLabel = (b: StockBatch & { remaining_breakdown?: string | null }, packType?: string | null) =>
  isUnitAwareBatch(b)
    ? b.remaining_breakdown || packBreakdown(remainingOf(b), Number(b.pack_size_base), packType, b.content_unit)
    : `${Number(remainingOf(b).toFixed(2))} units`

/** Remaining stock across batches, e.g. "3 sachets + 40 g". Older batches without a pack size add "+ N units". */
export function stockSummary(batches: StockBatch[], product?: PackProduct | null): string {
  const byUnit = new Map<string, { total: number; packBase: number }>()
  let legacy = 0
  for (const b of batches) {
    const remaining = remainingOf(b)
    if (isUnitAwareBatch(b)) {
      const unit = b.content_unit as string
      const entry = byUnit.get(unit) ?? { total: 0, packBase: Number(b.pack_size_base) }
      entry.total += remaining
      byUnit.set(unit, entry)
    } else {
      legacy += remaining
    }
  }
  const productBase = productPackSizeBase(product)
  const productUnit = baseUnitOf(product?.pack_size_unit)
  const parts = [...byUnit.entries()].map(([unit, { total, packBase }]) =>
    packBreakdown(total, unit === productUnit && productBase ? productBase : packBase, product?.pack_type, unit),
  )
  if (legacy > 0 || parts.length === 0) parts.push(`${Number(legacy.toFixed(2))} units`)
  return parts.join(" + ")
}

/** Pack size as edited in the product form (size kept as text so decimals can be typed). */
export type PackFormFields = { pack_type: string; pack_size: string; pack_size_unit: string }

export const packSizeValid = (form: PackFormFields) =>
  !!form.pack_type && !!form.pack_size_unit && Number(form.pack_size) > 0

export const packSizePayload = (form: PackFormFields) => ({
  pack_type: form.pack_type,
  pack_size: Number(form.pack_size),
  pack_size_unit: form.pack_size_unit,
})

export const productToPackFields = (product: PackProduct): PackFormFields => ({
  pack_type: product.pack_type ?? "",
  pack_size: product.pack_size != null && product.pack_size !== "" ? String(Number(product.pack_size)) : "",
  pack_size_unit: product.pack_size_unit ?? "",
})

export function packLabel(packType?: string | null, packSize?: number | string | null, packSizeUnit?: string | null): string | null {
  if (!packType || packSize == null || packSize === "" || !packSizeUnit) return null
  const noun = packType === "other" ? "Pack" : packType.charAt(0).toUpperCase() + packType.slice(1)
  return `${noun} of ${formatAmount(Number(packSize), packSizeUnit)}`
}
