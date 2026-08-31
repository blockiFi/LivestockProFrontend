import type { AppNotification } from "@/lib/types"
import {
  Bell,
  ClipboardList,
  Megaphone,
  Pill,
  ShieldAlert,
  Syringe,
  Warehouse,
  Wheat,
} from "lucide-react"

export const REMINDER_PRESETS = [
  { minutes: 0, label: "At task time" },
  { minutes: 5, label: "5 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 120, label: "2 hours before" },
  { minutes: 1440, label: "1 day before" },
] as const

export function relativeTime(iso?: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export function isPlatformBroadcast(
  notification: Pick<AppNotification, "type">
): boolean {
  return notification.type === "platform_broadcast"
}

export function categoryLabel(category?: string, type?: string): string {
  if (type === "platform_broadcast") return "Announcement"
  switch (category) {
    case "tasks":
      return "Task"
    case "farm_operations":
      return "Farm"
    case "medication":
      return "Medication"
    case "inventory":
      return "Inventory"
    case "account":
      return "Account"
    default:
      return "System"
  }
}

export function notificationIcon(notification: Pick<AppNotification, "category" | "type" | "priority">) {
  if (isPlatformBroadcast(notification)) return Megaphone
  if (notification.type?.includes("feed")) return Wheat
  if (notification.category === "medication" || notification.type?.includes("medication")) return Pill
  if (notification.type?.includes("vaccin")) return Syringe
  if (notification.category === "inventory") return Warehouse
  if (notification.category === "tasks") return ClipboardList
  if (notification.priority === "critical" || notification.category === "system") return ShieldAlert
  return Bell
}

export function priorityClass(priority?: string): string {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200"
    case "high":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "low":
      return "bg-slate-100 text-slate-600 border-slate-200"
    default:
      return "bg-sky-50 text-sky-700 border-sky-200"
  }
}

export function describeReminderOffset(minutes: number): string {
  const match = REMINDER_PRESETS.find((preset) => preset.minutes === minutes)
  if (match) return match.label
  if (minutes <= 0) return "At task time"
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return days === 1 ? "1 day before" : `${days} days before`
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return hours === 1 ? "1 hour before" : `${hours} hours before`
  }
  return `${minutes} minutes before`
}
