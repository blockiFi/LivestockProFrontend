import axios from "./axios"
import { isAxiosError } from "axios"
import type { RequestResponse } from "./interfaces"
import type {
  AppNotification,
  FarmNotificationSettingsPayload,
  NotificationAnalytics,
  NotificationPreferencesPayload,
  NotificationSummary,
  UserNotificationSettings,
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
  }
  return { success: false, error: [fallback] }
}

export type NotificationListQuery = {
  farm_id?: number
  category?: string
  type?: string
  unread_only?: boolean
  search?: string
  limit?: number
}

export const getNotifications = async (
  token: string,
  query: NotificationListQuery = {}
): Promise<RequestResponse<AppNotification[]>> => {
  try {
    const response = await axios.get("/api/notifications", {
      headers: auth(token),
      params: {
        farm_id: query.farm_id,
        category: query.category,
        type: query.type,
        search: query.search,
        limit: query.limit,
        unread_only: query.unread_only ? 1 : query.unread_only === false ? 0 : undefined,
      },
    })
    if (response.status === 200) {
      return { success: true, data: response.data.data ?? [] }
    }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to load notifications")
  }
}

export const getNotificationSummary = async (
  token: string,
  farmId?: number
): Promise<RequestResponse<NotificationSummary>> => {
  try {
    const response = await axios.get("/api/notifications/summary", {
      headers: auth(token),
      params: farmId ? { farm_id: farmId } : undefined,
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to load notification summary")
  }
}

export const markNotificationRead = async (
  token: string,
  id: number
): Promise<RequestResponse<AppNotification>> => {
  try {
    const response = await axios.post(`/api/notifications/${id}/read`, {}, { headers: auth(token) })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to mark notification read")
  }
}

export const markAllNotificationsRead = async (
  token: string,
  farmId?: number,
  category?: string
): Promise<RequestResponse<{ marked: number }>> => {
  try {
    const response = await axios.post(
      "/api/notifications/read-all",
      { farm_id: farmId, category },
      { headers: auth(token) }
    )
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to mark notifications read")
  }
}

export const dismissNotification = async (
  token: string,
  id: number
): Promise<RequestResponse<null>> => {
  try {
    const response = await axios.delete(`/api/notifications/${id}`, { headers: auth(token) })
    if (response.status === 200) return { success: true, data: null }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to dismiss notification")
  }
}

export const getNotificationPreferences = async (
  token: string,
  farmId?: number
): Promise<RequestResponse<NotificationPreferencesPayload>> => {
  try {
    const response = await axios.get("/api/notifications/preferences", {
      headers: auth(token),
      params: farmId ? { farm_id: farmId } : undefined,
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to load notification preferences")
  }
}

export const updateNotificationPreferences = async (
  token: string,
  payload: {
    farm_id?: number
    preferences: Array<{ type: string; in_app: boolean; email: boolean }>
  }
): Promise<RequestResponse<NotificationPreferencesPayload>> => {
  try {
    const response = await axios.put("/api/notifications/preferences", payload, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to update notification preferences")
  }
}

export const updateNotificationChannelSettings = async (
  token: string,
  payload: Partial<UserNotificationSettings>
): Promise<RequestResponse<UserNotificationSettings>> => {
  try {
    const response = await axios.put("/api/notifications/settings", payload, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to update notification settings")
  }
}

export const getFarmNotificationSettings = async (
  token: string,
  farmId: number
): Promise<RequestResponse<FarmNotificationSettingsPayload>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/notification-settings`, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to load farm notification settings")
  }
}

export const updateFarmNotificationSettings = async (
  token: string,
  farmId: number,
  payload: {
    types?: Array<Partial<import("./types").FarmNotificationTypeSetting> & { type: string }>
    config?: import("./types").FarmNotificationConfig
  }
): Promise<RequestResponse<FarmNotificationSettingsPayload>> => {
  try {
    const response = await axios.put(`/api/farms/${farmId}/notification-settings`, payload, {
      headers: auth(token),
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to update farm notification settings")
  }
}

export const getNotificationAnalytics = async (
  token: string,
  farmId: number,
  days = 30
): Promise<RequestResponse<NotificationAnalytics>> => {
  try {
    const response = await axios.get(`/api/farms/${farmId}/notification-analytics`, {
      headers: auth(token),
      params: { days },
    })
    if (response.status === 200) return { success: true, data: response.data.data }
    return { success: false, error: [`Error: ${response.status}`] }
  } catch (e) {
    return fail(e, "Failed to load notification analytics")
  }
}
