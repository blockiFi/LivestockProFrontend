import type { FarmTaskInstance, FarmTaskPriority, FarmTaskSection, FarmTaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export const SECTIONS: { value: FarmTaskSection; label: string }[] = [
  { value: "layers", label: "Layers" },
  { value: "broilers", label: "Broilers" },
  { value: "turkeys", label: "Turkeys" },
  { value: "goats", label: "Goats" },
  { value: "pigs", label: "Pigs" },
  { value: "medication", label: "Medication" },
  { value: "feeding", label: "Feeding" },
  { value: "cleaning", label: "Cleaning" },
  { value: "general", label: "General" },
  { value: "mixed", label: "Mixed" },
]

export const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
]

export function formatTaskTime(time?: string | null): string {
  if (!time) return "Continuous"
  const [h, m] = time.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m ?? "00"} ${ampm}`
}

export function formatTaskDate(date?: string | null): string {
  if (!date) return "—"
  return new Date(date + (date.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function statusBadgeClass(status: FarmTaskStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "in_progress":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "overdue":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "cancelled":
    case "skipped":
      return "bg-slate-50 text-slate-500 border-slate-200"
    default:
      return "bg-amber-50 text-amber-800 border-amber-200"
  }
}

export function priorityBadgeClass(priority: FarmTaskPriority): string {
  switch (priority) {
    case "critical":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "low":
      return "bg-slate-50 text-slate-600 border-slate-200"
    default:
      return "bg-blue-50 text-blue-700 border-blue-200"
  }
}

export function sectionLabel(section: string): string {
  return SECTIONS.find((s) => s.value === section)?.label ?? section
}

export function sortInstancesByTime(items: FarmTaskInstance[]): FarmTaskInstance[] {
  return [...items].sort((a, b) => {
    const dateCmp = String(a.scheduled_date).localeCompare(String(b.scheduled_date))
    if (dateCmp !== 0) return dateCmp
    if (!a.start_time && !b.start_time) return 0
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return String(a.start_time).localeCompare(String(b.start_time))
  })
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay() // 0 Sun
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function cnStatus(status: FarmTaskStatus) {
  return cn("border font-normal capitalize", statusBadgeClass(status))
}
