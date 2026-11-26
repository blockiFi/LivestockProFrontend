import axios from "./axios"
import { isAxiosError } from "axios"

import type { RequestResponse } from "@/lib/interfaces"
import type { SalesRecord } from "@/lib/types"
import type { ProductSaleFormPayload } from "@/lib/request"

/** A product sale line; lines that belong to a multi-batch sale carry its order id. */
export type SalesRecordWithOrder = SalesRecord & {
  sales_order_id?: number | null
  account_debited?: number | null
}

export type SaleOrderLinePayload = {
  flock_id: number | null
  /** For egg sales: crates. For meat/manure: product units. */
  quantity: number
  /** For egg sales: price per crate. For meat/manure: price per unit. */
  unit_price: number
}

export type SaleOrderPayload = Omit<ProductSaleFormPayload, "flock_id" | "quantity" | "unit_price"> & {
  lines: SaleOrderLinePayload[]
  idempotency_key?: string
}

export type SaleOrder = {
  id: number
  farm_id: number
  type: "egg" | "meat" | "manure" | string
  date: string
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  amount_paid: number
  payment_method: string | null
  payment_status: "pending" | "paid" | "partial" | string
  notes: string | null
  account_debited: number
  customer?: { id: number; name: string } | null
  lines: SalesRecordWithOrder[]
}

export type FlockEggStock = {
  flock_id: number
  name: string
  batch_number: string | null
  status: string | null
  produced: number
  sold: number
  available: number
  available_crates: number
  as_of: string
}

type Raw = Record<string, unknown>

const num = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v))

const mapLine = (data: Raw): SalesRecordWithOrder => ({
  ...(data as unknown as SalesRecordWithOrder),
  id: num(data.id),
  farm_id: num(data.farm_id),
  sales_order_id: data.sales_order_id == null ? null : num(data.sales_order_id),
  flock_id: data.flock_id == null ? null : num(data.flock_id),
  quantity: num(data.quantity),
  unit_price: num(data.unit_price),
  total_amount: num(data.total_amount),
  amount_paid: num(data.amount_paid),
  account_debited: num(data.account_debited),
})

const mapOrder = (data: Raw): SaleOrder => ({
  ...(data as unknown as SaleOrder),
  id: num(data.id),
  farm_id: num(data.farm_id),
  customer_id: data.customer_id == null ? null : num(data.customer_id),
  total_amount: num(data.total_amount),
  amount_paid: num(data.amount_paid),
  account_debited: num(data.account_debited),
  lines: Array.isArray(data.lines) ? (data.lines as Raw[]).map(mapLine) : [],
})

/** Turn Laravel's { message, errors } into readable lines, including per-batch stock shortages. */
const errorLines = (error: unknown, fallback: string): string[] => {
  if (!isAxiosError(error)) return [fallback]
  const body = error.response?.data as { message?: string; errors?: unknown } | undefined
  const errors = body?.errors
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const record = errors as Record<string, unknown>
    if (Array.isArray(record.shortages) && body?.message) return [body.message]
    const lines = Object.values(record)
      .flat()
      .filter((v): v is string => typeof v === "string")
    if (lines.length) return lines
  }
  if (Array.isArray(errors) && errors.length) return errors.map(String)
  return [body?.message || fallback]
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export async function getSaleOrder(
  token: string,
  farmId: number,
  orderId: number
): Promise<RequestResponse<SaleOrder>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/sales-orders/${orderId}`, auth(token))
    return { success: true, data: mapOrder(response.data.data) }
  } catch (error: unknown) {
    return { success: false, error: errorLines(error, "Failed to load sale") }
  }
}

export async function createSaleOrder(
  token: string,
  farmId: number,
  payload: SaleOrderPayload
): Promise<RequestResponse<SaleOrder>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/sales-orders`, payload, auth(token))
    return { success: true, data: mapOrder(response.data.data) }
  } catch (error: unknown) {
    return { success: false, error: errorLines(error, "Failed to record sale") }
  }
}

export async function updateSaleOrder(
  token: string,
  farmId: number,
  orderId: number,
  payload: SaleOrderPayload
): Promise<RequestResponse<SaleOrder>> {
  try {
    const response = await axios.put(`/api/farms/${farmId}/sales-orders/${orderId}`, payload, auth(token))
    return { success: true, data: mapOrder(response.data.data) }
  } catch (error: unknown) {
    return { success: false, error: errorLines(error, "Failed to update sale") }
  }
}

export async function deleteSaleOrder(
  token: string,
  farmId: number,
  orderId: number
): Promise<RequestResponse<null>> {
  try {
    await axios.delete(`/api/farms/${farmId}/sales-orders/${orderId}`, auth(token))
    return { success: true, data: null }
  } catch (error: unknown) {
    return { success: false, error: errorLines(error, "Failed to delete sale") }
  }
}

/** Egg stock for every batch on the farm as of a date, leaving out an order being edited. */
export async function getEggStockByFlock(
  token: string,
  farmId: number,
  params: { date: string; exclude_order_id?: number }
): Promise<RequestResponse<FlockEggStock[]>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/sales-orders/egg-stock`, {
      ...auth(token),
      params,
    })
    const rows = Array.isArray(response.data.data) ? response.data.data : []
    return {
      success: true,
      data: (rows as Raw[]).map((row) => ({
        ...(row as unknown as FlockEggStock),
        flock_id: num(row.flock_id),
        produced: num(row.produced),
        sold: num(row.sold),
        available: num(row.available),
        available_crates: num(row.available_crates),
      })),
    }
  } catch (error: unknown) {
    return { success: false, error: errorLines(error, "Failed to load egg stock") }
  }
}
