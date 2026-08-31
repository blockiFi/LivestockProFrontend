import axios from "./axios"
import { isAxiosError } from "axios"
import type { RequestResponse } from "./interfaces"
import type {
  FarmTaskInstance,
  FarmTaskNotification,
  FarmTaskSchedule,
  FarmTaskSchedulePayload,
  FarmTaskStats,
  FarmTaskTemplate,
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
    if (Array.isArray(errs) && errs.length) {
      return { success: false, error: errs.map(String) }
    }
    if (typeof data?.message === "string" && data.message) {
      return { success: false, error: [data.message] }
    }
    return {
      success: false,
      error: [fallback],
    }
  }
  return { success: false, error: [fallback] }
}

export const getFarmTaskStats = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmTaskStats>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/task-instances/stats`, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to fetch task stats")
  }
}

export const getFarmTaskInstances = async (
  token: string,
  farmId: number,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<RequestResponse<FarmTaskInstance[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/task-instances`, {
      headers: auth(token),
      params,
    })
    if (response.status === 200) {
      const data = response.data.data
      return { success: true, data: Array.isArray(data) ? data : data?.data ?? [] }
    }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to fetch task instances")
  }
}

export const getFarmTaskSchedules = async (
  token: string,
  farmId: number,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<RequestResponse<FarmTaskSchedule[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/task-schedules`, {
      headers: auth(token),
      params,
    })
    if (response.status === 200) return { success: true, data: response.data.data ?? [] }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to fetch schedules")
  }
}

export const createFarmTaskSchedule = async (
  token: string,
  farmId: number,
  payload: FarmTaskSchedulePayload
): Promise<RequestResponse<FarmTaskSchedule>> => {
  try {
    const response = await axios.post(`/api/farms/${farmId}/task-schedules`, payload, {
      headers: auth(token),
    })
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to create schedule")
  }
}

export const updateFarmTaskSchedule = async (
  token: string,
  farmId: number,
  id: number,
  payload: Partial<FarmTaskSchedulePayload>
): Promise<RequestResponse<FarmTaskSchedule>> => {
  try {
    const response = await axios.put(`/api/farms/${farmId}/task-schedules/${id}`, payload, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to update schedule")
  }
}

export const deleteFarmTaskSchedule = async (
  token: string,
  farmId: number,
  id: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/task-schedules/${id}`, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: null }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to delete schedule")
  }
}

export const seedFarmTaskRosterExample = async (
  token: string,
  farmId: number,
  startDate?: string
): Promise<RequestResponse<any>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-schedules/seed-roster-example`,
      { start_date: startDate },
      { headers: auth(token) }
    )
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to seed roster")
  }
}

export const getFarmTaskTemplates = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmTaskTemplate[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/task-templates`, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data ?? [] }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to fetch templates")
  }
}

export const createFarmTaskTemplate = async (
  token: string,
  farmId: number,
  payload: Partial<FarmTaskTemplate>
): Promise<RequestResponse<FarmTaskTemplate>> => {
  try {
    const response = await axios.post(`/api/farms/${farmId}/task-templates`, payload, {
      headers: auth(token),
    })
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data.data }
    }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to create template")
  }
}

export const deleteFarmTaskTemplate = async (
  token: string,
  farmId: number,
  id: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(`/api/farms/${farmId}/task-templates/${id}`, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: null }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to delete template")
  }
}

export const startFarmTaskInstance = async (
  token: string,
  farmId: number,
  id: number
): Promise<RequestResponse<FarmTaskInstance>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-instances/${id}/start`,
      {},
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to start task")
  }
}

export const completeFarmTaskInstance = async (
  token: string,
  farmId: number,
  id: number,
  payload: { notes?: string; worker_confirmed?: boolean; signature_text?: string }
): Promise<RequestResponse<FarmTaskInstance>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-instances/${id}/complete`,
      payload,
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to complete task")
  }
}

export const approveFarmTaskInstance = async (
  token: string,
  farmId: number,
  id: number,
  approval_notes?: string
): Promise<RequestResponse<FarmTaskInstance>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-instances/${id}/approve`,
      { approval_notes },
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to approve task")
  }
}

export const reassignFarmTaskInstance = async (
  token: string,
  farmId: number,
  id: number,
  assigned_to_user_id: number
): Promise<RequestResponse<FarmTaskInstance>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-instances/${id}/reassign`,
      { assigned_to_user_id },
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to reassign task")
  }
}

export const getFarmTaskNotifications = async (
  token: string,
  farmId: number,
  unreadOnly = false
): Promise<RequestResponse<FarmTaskNotification[]>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/task-notifications`, {
      headers: auth(token),
      params: { unread_only: unreadOnly ? 1 : 0 },
    })
    if (response.status === 200) return { success: true, data: response.data.data ?? [] }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to fetch notifications")
  }
}

export const markFarmTaskNotificationRead = async (
  token: string,
  farmId: number,
  id: number
): Promise<RequestResponse<FarmTaskNotification>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-notifications/${id}/read`,
      {},
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to mark notification read")
  }
}

export const markAllFarmTaskNotificationsRead = async (
  token: string,
  farmId: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.post(
      `/api/farms/${farmId}/task-notifications/mark-all-read`,
      {},
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: null }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed")
  }
}
