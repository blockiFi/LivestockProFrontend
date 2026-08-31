import type { BatchSchedule, ScheduleItem } from "@/lib/types"
import type { FlockNotifications } from "@/lib/request"

export type UpcomingVaccinationPriority = "high" | "medium" | "low"

export type UpcomingVaccinationItem = {
  key: string
  scheduleItemId: number
  batchScheduleId: number
  vaccineName: string
  scheduledDate: string
  daysUntil: number
  flockAgeAtVaccination: number
  administrationMethod: string | null
  estimatedCost: number | null
  priority: UpcomingVaccinationPriority
  status: string
  notes: string | null
  scheduleName: string | null
  doseLabel: string | null
  scheduleItem: ScheduleItem | null
}

export function resolvePriority(daysUntil: number, status?: string | null): UpcomingVaccinationPriority {
  if (status === "overdue" || daysUntil < 0) return "high"
  if (daysUntil === 0) return "high"
  if (daysUntil <= 2) return "medium"
  return "low"
}

export function resolveScheduleItem(
  vaccinationSchedules: BatchSchedule[],
  scheduleItemId: number
): { scheduleItem: ScheduleItem; batchScheduleId: number } | null {
  for (const batch of vaccinationSchedules) {
    const scheduleItem = batch.schedule?.items?.find((item) => item.id === scheduleItemId)
    if (scheduleItem) {
      return { scheduleItem, batchScheduleId: batch.id }
    }
  }
  return null
}

export function mapUpcomingVaccinations(
  notifications: FlockNotifications,
  vaccinationSchedules: BatchSchedule[]
): UpcomingVaccinationItem[] {
  return (notifications.upcoming_batch_items || [])
    .filter((item) => item.type === "vaccination")
    .map((item) => {
      const scheduleItemId = item.schedule_item_id ?? item.id
      const resolved = resolveScheduleItem(vaccinationSchedules, scheduleItemId)
      const batchScheduleId = item.batch_schedule_id ?? resolved?.batchScheduleId ?? 0
      const doseLabel =
        item.dose != null && item.dose_unit
          ? `${item.dose} ${item.dose_unit}`
          : item.dose != null
            ? String(item.dose)
            : null

      return {
        key: `vaccination-${scheduleItemId}-${item.scheduled_date}`,
        scheduleItemId,
        batchScheduleId,
        vaccineName: item.vaccine_name || item.title,
        scheduledDate: item.scheduled_date,
        daysUntil: item.days_until ?? 0,
        flockAgeAtVaccination: item.age_days ?? 0,
        administrationMethod: item.administration_method ?? null,
        estimatedCost: item.cost ?? null,
        priority: resolvePriority(item.days_until ?? 0, item.status),
        status: item.status ?? (item.days_until < 0 ? "overdue" : "scheduled"),
        notes: item.description ?? null,
        scheduleName: item.schedule_name ?? null,
        doseLabel,
        scheduleItem: resolved?.scheduleItem ?? null,
      }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export function urgencyLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil)
    return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`
  }
  if (daysUntil === 0) return "Due today"
  if (daysUntil === 1) return "Tomorrow"
  return `In ${daysUntil} days`
}
