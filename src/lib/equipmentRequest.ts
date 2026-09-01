import axios from "./axios"
import { isAxiosError } from "axios"
import type { RequestResponse } from "./interfaces"
import type {
  Equipment,
  EquipmentCategory,
  EquipmentDashboard,
  EquipmentDocument,
  EquipmentInspection,
  EquipmentMaintenanceLog,
  EquipmentRetirement,
} from "./types"

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

function fail(error: unknown, fallback: string): RequestResponse<never> {
  if (isAxiosError(error)) {
    const data = error.response?.data
    const errs = data?.errors
    if (errs && typeof errs === "object" && !Array.isArray(errs)) {
      const flat = Object.values(errs).flat().filter(Boolean) as string[]
      if (flat.length) return { success: false, error: flat }
    }
    if (typeof data?.message === "string" && data.message) {
      return { success: false, error: [data.message] }
    }
    return { success: false, error: [fallback] }
  }
  return { success: false, error: [fallback] }
}

export const getEquipmentDashboard = async (
  token: string,
  farmId: number
): Promise<RequestResponse<EquipmentDashboard>> => {
  try {
    const res = await axios.get(`/api/farms/${farmId}/equipment/dashboard`, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to load equipment dashboard")
  }
}

export const getEquipmentCategories = async (
  token: string,
  farmId: number
): Promise<RequestResponse<EquipmentCategory[]>> => {
  try {
    const res = await axios.get(`/api/farms/${farmId}/equipment-categories`, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to load categories")
  }
}

export type EquipmentListParams = {
  search?: string
  category_id?: number
  status?: string
  condition?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_direction?: "asc" | "desc"
}

export const getEquipmentList = async (
  token: string,
  farmId: number,
  params?: EquipmentListParams
): Promise<RequestResponse<{ data: Equipment[]; total?: number; current_page?: number; last_page?: number } | Equipment[]>> => {
  try {
    const paginated = params?.page != null || params?.per_page != null
    const res = await axios.get(`/api/farms/${farmId}/equipment`, {
      headers: auth(token),
      params: paginated
        ? { ...params, page: params?.page, per_page: params?.per_page ?? 15 }
        : {
            search: params?.search,
            category_id: params?.category_id,
            status: params?.status,
            condition: params?.condition,
            sort_by: params?.sort_by,
            sort_direction: params?.sort_direction,
          },
    })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to load equipment")
  }
}

export const getEquipment = async (
  token: string,
  farmId: number,
  equipmentId: number
): Promise<RequestResponse<Equipment>> => {
  try {
    const res = await axios.get(`/api/farms/${farmId}/equipment/${equipmentId}`, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to load equipment details")
  }
}

export const createEquipment = async (
  token: string,
  farmId: number,
  payload: Partial<Equipment>
): Promise<RequestResponse<Equipment>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment`, payload, { headers: auth(token) })
    if (res.status === 201 || res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to create equipment")
  }
}

export const updateEquipment = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Partial<Equipment>
): Promise<RequestResponse<Equipment>> => {
  try {
    const res = await axios.put(`/api/farms/${farmId}/equipment/${equipmentId}`, payload, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to update equipment")
  }
}

export const assignEquipment = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Record<string, unknown>
): Promise<RequestResponse<unknown>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/assign`, payload, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to assign equipment")
  }
}

export const transferEquipment = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Record<string, unknown>
): Promise<RequestResponse<unknown>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/transfer`, payload, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to transfer equipment")
  }
}

export const recordEquipmentMaintenance = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Partial<EquipmentMaintenanceLog>
): Promise<RequestResponse<EquipmentMaintenanceLog>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/maintenance`, payload, { headers: auth(token) })
    if (res.status === 201 || res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to record maintenance")
  }
}

export const recordEquipmentInspection = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Partial<EquipmentInspection>
): Promise<RequestResponse<EquipmentInspection>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/inspections`, payload, { headers: auth(token) })
    if (res.status === 201 || res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to record inspection")
  }
}

export const retireEquipment = async (
  token: string,
  farmId: number,
  equipmentId: number,
  payload: Partial<EquipmentRetirement>
): Promise<RequestResponse<EquipmentRetirement>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/retire`, payload, { headers: auth(token) })
    if (res.status === 201 || res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to retire equipment")
  }
}

export const bulkUpdateEquipment = async (
  token: string,
  farmId: number,
  payload: Record<string, unknown>
): Promise<RequestResponse<{ updated: number }>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/bulk-update`, payload, { headers: auth(token) })
    if (res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Bulk update failed")
  }
}

export const uploadEquipmentDocument = async (
  token: string,
  farmId: number,
  equipmentId: number,
  formData: FormData
): Promise<RequestResponse<EquipmentDocument>> => {
  try {
    const res = await axios.post(`/api/farms/${farmId}/equipment/${equipmentId}/documents`, formData, {
      headers: { ...auth(token), "Content-Type": "multipart/form-data" },
    })
    if (res.status === 201 || res.status === 200) return { success: true, data: res.data.data }
    return { success: false, error: [`Error: ${res.status}`] }
  } catch (e) {
    return fail(e, "Failed to upload document")
  }
}
