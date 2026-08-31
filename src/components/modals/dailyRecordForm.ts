import { format } from "date-fns"
import type { PoultryDailyReport } from "@/lib/types"

export interface DailyRecordFormData {
  flock_id: number
  date: string
  mortality: number
  culls: number
  feed_consumed_kg: number
  water_consumed_liters: number
  avg_weight_grams: number
  min_weight_grams: number
  max_weight_grams: number
  sample_size: number
  min_temperature: number
  max_temperature: number
  humidity: number
  light_hours: number
  eggs_collected: number
  eggs_broken: number
  notes: string
  poultry_feed_inventory_id: number | null
}

export const toFormDate = (date: string) => (date.includes("T") ? date.split("T")[0] : date)

export const recordToFormData = (
  record: PoultryDailyReport,
  flockId: number,
  inventoryId: number | null = null
): DailyRecordFormData => ({
  flock_id: flockId,
  date: toFormDate(record.date),
  mortality: record.mortality ?? 0,
  culls: record.culls ?? 0,
  feed_consumed_kg: record.feed_consumed_kg ?? 0,
  water_consumed_liters: record.water_consumed_liters ?? 0,
  avg_weight_grams: record.avg_weight_grams ?? 0,
  min_weight_grams: record.min_weight_grams ?? 0,
  max_weight_grams: record.max_weight_grams ?? 0,
  sample_size: record.sample_size ?? 0,
  min_temperature: record.min_temperature ?? 0,
  max_temperature: record.max_temperature ?? 0,
  humidity: record.humidity ?? 0,
  light_hours: record.light_hours ?? 0,
  eggs_collected: record.eggs_collected ?? 0,
  eggs_broken: record.eggs_broken ?? 0,
  notes: record.notes ?? "",
  poultry_feed_inventory_id: inventoryId,
})

export const initialFormState = (flockId: number, date = format(new Date(), "yyyy-MM-dd")): DailyRecordFormData => ({
  flock_id: flockId,
  date,
  mortality: 0,
  culls: 0,
  feed_consumed_kg: 0,
  water_consumed_liters: 0,
  avg_weight_grams: 0,
  min_weight_grams: 0,
  max_weight_grams: 0,
  sample_size: 0,
  min_temperature: 0,
  max_temperature: 0,
  humidity: 0,
  light_hours: 0,
  eggs_collected: 0,
  eggs_broken: 0,
  notes: "",
  poultry_feed_inventory_id: null,
})

export const validateDailyRecordEntry = (
  data: DailyRecordFormData,
  flockQuantity: number,
  poultryType: string,
  options?: {
    existingDates?: Set<string>
    duplicateDatesInBatch?: string[]
  }
): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!data.date) {
    errors.date = "Record date is required"
  } else {
    if (options?.existingDates?.has(data.date)) {
      errors.date = "Record already exists for this date — edit it instead"
    }
    const duplicateCount = (options?.duplicateDatesInBatch ?? []).filter((d) => d === data.date).length
    if (duplicateCount > 1) {
      errors.date = "This date is used in another row"
    }
  }

  if (data.mortality < 0) errors.mortality = "Cannot be negative"
  if (data.culls < 0) errors.culls = "Cannot be negative"
  if (data.feed_consumed_kg < 0) errors.feed_consumed_kg = "Cannot be negative"
  if (data.water_consumed_liters < 0) errors.water_consumed_liters = "Cannot be negative"
  if (data.avg_weight_grams < 0) errors.avg_weight_grams = "Cannot be negative"
  if (data.min_weight_grams < 0) errors.min_weight_grams = "Cannot be negative"
  if (data.max_weight_grams < 0) errors.max_weight_grams = "Cannot be negative"
  if (data.min_weight_grams > 0 && data.max_weight_grams > 0 && data.min_weight_grams > data.max_weight_grams) {
    errors.max_weight_grams = "Max weight must be greater than or equal to min weight"
  }
  if (data.sample_size < 0) errors.sample_size = "Cannot be negative"
  if (data.sample_size > flockQuantity) {
    errors.sample_size = `Sample size cannot exceed current bird count (${flockQuantity})`
  }
  if (data.humidity < 0 || data.humidity > 100) errors.humidity = "Must be 0–100"
  if (data.light_hours < 0 || data.light_hours > 24) errors.light_hours = "Must be 0–24"

  if (poultryType.toLowerCase() !== "broiler") {
    if (data.eggs_collected < 0) errors.eggs_collected = "Cannot be negative"
    if (data.eggs_broken < 0) errors.eggs_broken = "Cannot be negative"
    if (data.eggs_broken > data.eggs_collected) errors.eggs_broken = "Cannot exceed collected"
  }

  return errors
}
