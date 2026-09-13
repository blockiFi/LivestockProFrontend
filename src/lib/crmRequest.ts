import axios, { isAxiosError } from "axios"

import type {
  ApiInvoice,
  Customer,
  CustomerAccount,
  CustomerAccountFarmSummary,
  CustomerAccountTransaction,
  CustomerHistoryItem,
  CustomerSummary,
  FarmSettings,
  Invoice,
  InvoiceItem,
} from "@/lib/types"
import type { RequestResponse } from "@/lib/interfaces"

export type CustomerPayload = {
  name: string
  company_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  is_active?: boolean
  country_id: number
}

export type InvoiceCreatePayload = {
  customer_id: number
  invoice_date: string
  due_date: string
  status?: "pending" | "paid" | "overdue"
  notes?: string | null
  items: Array<{ description: string; quantity: number; unit_price: number }>
}

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0)

export function mapInvoiceStatus(status: ApiInvoice["status"]): Invoice["status"] {
  if (status === "paid") return "Paid"
  if (status === "overdue") return "Overdue"
  return "Pending"
}

export function mapApiInvoiceToUi(
  invoice: ApiInvoice,
  farmSettings?: FarmSettings | null
): Invoice {
  const taxAmount = toNumber(invoice.tax_amount)
  const subtotal = toNumber(invoice.subtotal)
  const taxRate = Number(
    farmSettings?.invoice_tax_rate ?? (subtotal > 0 ? (taxAmount / subtotal) * 100 : 0)
  )

  return {
    id: invoice.id,
    customerId: invoice.customer_id,
    invoiceNumber: invoice.invoice_number,
    date: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: mapInvoiceStatus(invoice.status),
    clientName: invoice.customer?.name ?? "Customer",
    clientEmail: invoice.customer?.email ?? "",
    items: (invoice.items ?? []).map(
      (item): InvoiceItem => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: toNumber(item.unit_price),
        total: toNumber(item.total),
      })
    ),
    subtotal,
    tax: taxAmount,
    taxRate,
    taxEnabled: taxAmount > 0,
    total: toNumber(invoice.total),
    notes: invoice.notes ?? "",
    paymentInstructions: farmSettings?.invoice_payment_instructions ?? undefined,
  }
}

export async function getCustomers(
  token: string,
  farmId: number,
  params?: { search?: string; active?: boolean }
): Promise<RequestResponse<Customer[]>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    return { success: true, data: response.data.data ?? [] }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to fetch customers"],
      }
    }
    return { success: false, error: ["Failed to fetch customers"] }
  }
}

export async function getCustomer(
  token: string,
  farmId: number,
  customerId: number
): Promise<
  RequestResponse<{
    customer: Customer
    summary: CustomerSummary
    account?: CustomerAccount
    recent_account_transactions?: CustomerAccountTransaction[]
    is_low_balance?: boolean
  }>
> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to fetch customer"],
      }
    }
    return { success: false, error: ["Failed to fetch customer"] }
  }
}

export async function createCustomer(
  token: string,
  farmId: number,
  payload: CustomerPayload
): Promise<RequestResponse<Customer>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/customers`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to create customer"],
      }
    }
    return { success: false, error: ["Failed to create customer"] }
  }
}

export async function updateCustomer(
  token: string,
  farmId: number,
  customerId: number,
  payload: Partial<CustomerPayload>
): Promise<RequestResponse<Customer>> {
  try {
    const response = await axios.put(`/api/farms/${farmId}/customers/${customerId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to update customer"],
      }
    }
    return { success: false, error: ["Failed to update customer"] }
  }
}

export async function deleteCustomer(
  token: string,
  farmId: number,
  customerId: number
): Promise<RequestResponse<null>> {
  try {
    await axios.delete(`/api/farms/${farmId}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: null }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to delete customer"],
      }
    }
    return { success: false, error: ["Failed to delete customer"] }
  }
}

export async function getCustomerHistory(
  token: string,
  farmId: number,
  customerId: number,
  params?: { type?: "product" | "flock" | "invoice"; page?: number; per_page?: number }
): Promise<RequestResponse<{ data: CustomerHistoryItem[]; total: number; current_page: number; last_page: number }>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers/${customerId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to fetch customer history"],
      }
    }
    return { success: false, error: ["Failed to fetch customer history"] }
  }
}

export async function recordCustomerPayment(
  token: string,
  farmId: number,
  customerId: number,
  payload: {
    type: "product" | "invoice"
    id: number
    amount?: number
    payment_method?: string
    payment_mode?: string
    account_amount?: number
    other_amount?: number
    other_payment_method?: string
    notes?: string
  }
): Promise<RequestResponse<{ payment: { type: string; id: number; amount_paid: number; balance_due: number; payment_status: string }; summary: CustomerSummary; account?: CustomerAccount }>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/customers/${customerId}/payments`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const errors = error.response?.data?.errors
      const message =
        typeof errors === "object" && errors && "message" in errors
          ? String((errors as { message?: string }).message)
          : error.response?.data?.message
      return {
        success: false,
        error: Array.isArray(errors)
          ? errors
          : [message || "Failed to record payment"],
        data: errors && !Array.isArray(errors) ? (errors as never) : undefined,
      }
    }
    return { success: false, error: ["Failed to record payment"] }
  }
}

function accountError(error: unknown, fallback: string): RequestResponse<never> {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors
    const message = error.response?.data?.message || fallback
    if (Array.isArray(errors)) {
      return { success: false, error: errors }
    }
    if (errors && typeof errors === "object" && "message" in errors) {
      return { success: false, error: [String((errors as { message: string }).message)], data: errors as never }
    }
    return { success: false, error: [message] }
  }
  return { success: false, error: [fallback] }
}

export async function getCustomerAccountSummary(
  token: string,
  farmId: number
): Promise<RequestResponse<CustomerAccountFarmSummary>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customer-accounts/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to fetch account summary")
  }
}

export async function getCustomerAccount(
  token: string,
  farmId: number,
  customerId: number
): Promise<
  RequestResponse<{
    account: CustomerAccount
    recent_transactions: CustomerAccountTransaction[]
    is_low_balance: boolean
  }>
> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers/${customerId}/account`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to fetch customer account")
  }
}

export async function topUpCustomerAccount(
  token: string,
  farmId: number,
  customerId: number,
  payload: {
    amount: number
    payment_method: string
    reference?: string
    description?: string
    notes?: string
    occurred_at?: string
  }
): Promise<
  RequestResponse<{
    previous_balance: number
    top_up: number
    new_balance: number
    account: CustomerAccount
    transaction: CustomerAccountTransaction
  }>
> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/customers/${customerId}/account/top-ups`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to top up account")
  }
}

export async function adjustCustomerAccount(
  token: string,
  farmId: number,
  customerId: number,
  payload: {
    amount: number
    direction: "credit" | "debit"
    reason: string
    reference?: string
    notes?: string
  }
): Promise<RequestResponse<{ account: CustomerAccount; transaction: CustomerAccountTransaction }>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/customers/${customerId}/account/adjustments`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to adjust account")
  }
}

export async function getCustomerAccountStatement(
  token: string,
  farmId: number,
  customerId: number,
  params?: Record<string, string | number | undefined>
): Promise<
  RequestResponse<{
    account: CustomerAccount
    opening_balance: number | null
    transactions: CustomerAccountTransaction[]
    meta: { current_page: number; last_page: number; per_page: number; total: number }
  }>
> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/customers/${customerId}/account/statement`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to fetch statement")
  }
}

export async function refundCustomerAccountSale(
  token: string,
  farmId: number,
  customerId: number,
  payload: { sales_record_id: number; amount?: number; notes?: string }
): Promise<RequestResponse<{ account: CustomerAccount; transaction: CustomerAccountTransaction }>> {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/customers/${customerId}/account/refunds`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    return accountError(error, "Failed to refund account payment")
  }
}

export async function exportCustomerAccountStatement(
  token: string,
  farmId: number,
  customerId: number,
  params?: Record<string, string | number | undefined>
): Promise<Blob | null> {
  try {
    const response = await axios.get(
      `/api/farms/${farmId}/customers/${customerId}/account/statement/export`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: "blob",
      }
    )
    return response.data as Blob
  } catch {
    return null
  }
}

export async function getInvoices(
  token: string,
  farmId: number,
  params?: { customer_id?: number; status?: string; per_page?: number; page?: number }
): Promise<RequestResponse<ApiInvoice[] | { data: ApiInvoice[]; total: number }>> {
  try {
    const paginated = params?.per_page != null
    const url = paginated
      ? `/api/farms/${farmId}/invoices/paginated`
      : `/api/farms/${farmId}/invoices`
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to fetch invoices"],
      }
    }
    return { success: false, error: ["Failed to fetch invoices"] }
  }
}

export async function getInvoice(
  token: string,
  farmId: number,
  invoiceId: number
): Promise<RequestResponse<ApiInvoice>> {
  try {
    const response = await axios.get(`/api/farms/${farmId}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to fetch invoice"],
      }
    }
    return { success: false, error: ["Failed to fetch invoice"] }
  }
}

export async function createInvoice(
  token: string,
  farmId: number,
  payload: InvoiceCreatePayload
): Promise<RequestResponse<ApiInvoice>> {
  try {
    const response = await axios.post(`/api/farms/${farmId}/invoices`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to create invoice"],
      }
    }
    return { success: false, error: ["Failed to create invoice"] }
  }
}

export async function updateInvoice(
  token: string,
  farmId: number,
  invoiceId: number,
  payload: Partial<InvoiceCreatePayload> & { status?: "pending" | "paid" | "overdue" }
): Promise<RequestResponse<ApiInvoice>> {
  try {
    const response = await axios.put(`/api/farms/${farmId}/invoices/${invoiceId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to update invoice"],
      }
    }
    return { success: false, error: ["Failed to update invoice"] }
  }
}

export async function deleteInvoice(
  token: string,
  farmId: number,
  invoiceId: number
): Promise<RequestResponse<null>> {
  try {
    await axios.delete(`/api/farms/${farmId}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, data: null }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.errors || [error.response?.data?.message || "Failed to delete invoice"],
      }
    }
    return { success: false, error: ["Failed to delete invoice"] }
  }
}
