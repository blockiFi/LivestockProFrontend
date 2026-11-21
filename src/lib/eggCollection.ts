/**
 * Cell-based egg collection: house cage layout (rows A, B... with cells A1, A2...)
 * and collection rounds that add up to a flock's daily egg report.
 *
 * Kept in its own module so it stays independent of request.ts / types.ts.
 */
import axios from "./axios"
import { isAxiosError } from "axios"
import type { RequestResponse } from "./interfaces"

export type EggEntryMode = "total" | "cell"

export type HouseLayoutCell = {
  id: number
  cell_number: number
  label: string
  birds: number
  flock_id: number | null
  is_active: boolean
}

export type HouseLayoutRow = {
  id: number
  code: string
  cell_count: number
  birds_per_cell: number | null
  effective_birds_per_cell: number
  sort_order: number
  is_active: boolean
  cells: HouseLayoutCell[]
}

export type HouseEggLayout = {
  house: {
    id: number
    name: string
    capacity: number | null
    egg_collection_mode: EggEntryMode
    birds_per_cell: number | null
  }
  rows: HouseLayoutRow[]
  summary: { rows: number; cells: number; birds: number; unassigned_cells: number }
  flocks: { id: number; name: string; cells: number; birds: number }[]
  assigned_cells?: number
}

export type EggSheetCell = {
  id: number
  cell_number: number
  label: string
  birds: number
  recorded_eggs: number
  recorded_broken: number
}

export type EggSheetRow = { row_id: number; code: string; cells: EggSheetCell[] }

export type EggSheetHouse = { house_id: number; house_name: string; rows: EggSheetRow[] }

export type EggCollectionCell = {
  cell_id: number
  label: string | null
  eggs: number
  broken: number
  birds: number
}

export type EggCollectionRound = {
  id: number
  egg_report_id: number
  round_no: number
  collected_at: string | null
  entry_mode: EggEntryMode
  source: string
  eggs_collected: number
  eggs_broken_cells: number
  eggs_broken_extra: number
  eggs_broken: number
  average_egg_weight: number | null
  notes: string | null
  recorded_by: number | null
  recorded_by_name: string | null
  cells: EggCollectionCell[]
}

export type EggDayReport = {
  id: number
  flock_id: number
  date: string
  entry_mode: EggEntryMode
  eggs_collected: number
  eggs_broken: number
  eggs_good: number
  average_egg_weight: number
  production_percentage: number
  bird_count: number
  notes: string | null
  rounds: EggCollectionRound[]
  row_totals: Record<string, number>
  cell_totals: {
    cell_id: number
    label: string
    row_code: string | null
    house_id: number | null
    birds: number
    eggs: number
    broken: number
  }[]
}

export type EggSheet = {
  flock_id: number
  date: string
  has_cells: boolean
  total_cells: number
  total_birds_in_cells: number
  flock_bird_count: number
  houses: EggSheetHouse[]
  report: EggDayReport | null
}

export type EggCollectionPayload = {
  date: string
  collected_at?: string | null
  entry_mode: EggEntryMode
  eggs_collected?: number
  cells?: { cell_id: number; eggs: number; broken?: number }[]
  eggs_broken_extra?: number
  average_egg_weight?: number | null
  notes?: string | null
}

export type EggCollectionSaveResult = {
  collection: EggCollectionRound
  report: EggDayReport
  warnings: string[]
}

export type CellPerformance = {
  from: string
  to: string
  cells: {
    cell_id: number
    label: string
    house_id: number
    row_code: string
    cell_number: number
    birds: number
    days_recorded: number
    eggs: number
    broken: number
    lay_rate: number | null
  }[]
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Flatten Laravel validation errors ({field: [msg]}) or a message into a list of strings. */
const toErrors = (error: unknown, fallback: string): string[] => {
  if (isAxiosError(error)) {
    const data = error.response?.data
    const errors = data?.errors ?? data?.data
    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
      const list = Object.values(errors).flat().filter((v): v is string => typeof v === "string")
      if (list.length) return list
    }
    if (Array.isArray(errors) && errors.length) return errors.map(String)
    if (data?.message) return [String(data.message)]
  }
  return [fallback]
}

async function call<T>(fn: () => Promise<{ data: { data: T } }>, fallback: string): Promise<RequestResponse<T>> {
  try {
    const response = await fn()
    return { success: true, data: response.data.data }
  } catch (error) {
    console.error(fallback, error)
    return { success: false, error: toErrors(error, fallback) }
  }
}

// ---- House layout ----

const layoutUrl = (farmId: number, houseId: number, suffix = "") =>
  `/api/poultry-houses/${farmId}/${houseId}/egg-layout${suffix}`

export const getHouseEggLayout = (token: string, farmId: number, houseId: number) =>
  call<HouseEggLayout>(() => axios.get(layoutUrl(farmId, houseId), auth(token)), "Failed to load house layout")

export const updateHouseEggSettings = (
  token: string,
  farmId: number,
  houseId: number,
  data: { egg_collection_mode?: EggEntryMode; birds_per_cell?: number | null; apply_birds_to_cells?: boolean }
) =>
  call<HouseEggLayout>(
    () => axios.put(layoutUrl(farmId, houseId, "/settings"), data, auth(token)),
    "Failed to update layout settings"
  )

export const generateHouseEggLayout = (
  token: string,
  farmId: number,
  houseId: number,
  data: { codes: string[]; cells_per_row: number; birds_per_cell?: number; flock_id?: number | null }
) =>
  call<HouseEggLayout>(
    () => axios.post(layoutUrl(farmId, houseId, "/generate"), data, auth(token)),
    "Failed to generate layout"
  )

export const addHouseEggRow = (
  token: string,
  farmId: number,
  houseId: number,
  data: { code: string; cell_count: number; birds_per_cell?: number | null }
) =>
  call<HouseEggLayout>(() => axios.post(layoutUrl(farmId, houseId, "/rows"), data, auth(token)), "Failed to add row")

export const updateHouseEggRow = (
  token: string,
  farmId: number,
  houseId: number,
  rowId: number,
  data: { code?: string; cell_count?: number; birds_per_cell?: number | null; apply_birds_to_cells?: boolean }
) =>
  call<HouseEggLayout>(
    () => axios.put(layoutUrl(farmId, houseId, `/rows/${rowId}`), data, auth(token)),
    "Failed to update row"
  )

export const deleteHouseEggRow = (token: string, farmId: number, houseId: number, rowId: number) =>
  call<HouseEggLayout>(
    () => axios.delete(layoutUrl(farmId, houseId, `/rows/${rowId}`), auth(token)),
    "Failed to remove row"
  )

export const updateHouseEggCells = (
  token: string,
  farmId: number,
  houseId: number,
  cells: { id: number; birds?: number; flock_id?: number | null; is_active?: boolean }[]
) =>
  call<HouseEggLayout>(
    () => axios.put(layoutUrl(farmId, houseId, "/cells"), { cells }, auth(token)),
    "Failed to update cells"
  )

export const assignHouseEggCells = (
  token: string,
  farmId: number,
  houseId: number,
  data: { flock_id: number | null; row_ids: number[] } | { flock_id: number | null; row_id: number; from: number; to: number }
) =>
  call<HouseEggLayout>(
    () => axios.post(layoutUrl(farmId, houseId, "/assign"), data, auth(token)),
    "Failed to assign cells"
  )

// ---- Collection rounds ----

const flockUrl = (farmId: number, flockId: number, suffix: string) => `/api/farms/${farmId}/flocks/${flockId}${suffix}`

export const getEggSheet = (token: string, farmId: number, flockId: number, date: string) =>
  call<EggSheet>(
    () => axios.get(flockUrl(farmId, flockId, "/egg-sheet"), { ...auth(token), params: { date } }),
    "Failed to load egg sheet"
  )

export const createEggCollection = (token: string, farmId: number, flockId: number, data: EggCollectionPayload) =>
  call<EggCollectionSaveResult>(
    () => axios.post(flockUrl(farmId, flockId, "/egg-collections"), data, auth(token)),
    "Failed to save collection"
  )

export const updateEggCollection = (
  token: string,
  farmId: number,
  flockId: number,
  collectionId: number,
  data: EggCollectionPayload
) =>
  call<EggCollectionSaveResult>(
    () => axios.put(flockUrl(farmId, flockId, `/egg-collections/${collectionId}`), data, auth(token)),
    "Failed to update collection"
  )

export const deleteEggCollection = (token: string, farmId: number, flockId: number, collectionId: number) =>
  call<{ report: EggDayReport | null }>(
    () => axios.delete(flockUrl(farmId, flockId, `/egg-collections/${collectionId}`), auth(token)),
    "Failed to delete collection"
  )

export const getEggCellPerformance = (
  token: string,
  farmId: number,
  flockId: number,
  params?: { from?: string; to?: string }
) =>
  call<CellPerformance>(
    () => axios.get(flockUrl(farmId, flockId, "/egg-cell-performance"), { ...auth(token), params }),
    "Failed to load cell performance"
  )

/** Next row letter after the given codes: A..Z, then AA, AB... */
export const nextRowCode = (codes: string[]): string => {
  const toNum = (c: string) => c.split("").reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)
  const toCode = (n: number) => {
    let s = ""
    while (n > 0) {
      const r = (n - 1) % 26
      s = String.fromCharCode(65 + r) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }
  const max = codes
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]+$/.test(c))
    .reduce((m, c) => Math.max(m, toNum(c)), 0)
  return toCode(max + 1)
}

/** Row codes from a letter range like "A-F" or a list like "A,B,C". */
export const parseRowCodes = (input: string): string[] => {
  const trimmed = input.trim().toUpperCase()
  const range = trimmed.match(/^([A-Z])\s*[-–]\s*([A-Z])$/)
  if (range) {
    const start = range[1].charCodeAt(0)
    const end = range[2].charCodeAt(0)
    if (end < start) return []
    return Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i))
  }
  return Array.from(new Set(trimmed.split(/[\s,]+/).filter(Boolean)))
}
