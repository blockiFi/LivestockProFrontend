import type { Farm, FarmSettings } from "@/lib/types"

export function resolveCurrencySymbol(farmSettings?: FarmSettings | null, farm?: Farm | null): string {
  return farmSettings?.currency_symbol || farm?.country?.currency_symbol || "₦"
}

export function formatCurrency(
  amount: number,
  options?: {
    farmSettings?: FarmSettings | null
    farm?: Farm | null
  }
): string {
  const symbol = resolveCurrencySymbol(options?.farmSettings, options?.farm)
  return `${symbol}${amount.toLocaleString()}`
}
