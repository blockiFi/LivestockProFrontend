import type { BatchSchedule, BatchScheduleItem, ScheduleItem } from "@/lib/types"

export type MedVacDisplayRow = {
  key: string
  scheduleItem: ScheduleItem
  batchItem?: BatchScheduleItem
  scheduledDate: string | null
  status: "completed" | "pending" | "missed" | "scheduled" | "late"
}

export function buildMedVacDisplayRows(
  schedule: BatchSchedule,
  currentAge: number
): MedVacDisplayRow[] {
  const templateItems = schedule.schedule?.items ?? []
  const batchItems = [...(schedule.items ?? [])].sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  )

  if (batchItems.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return batchItems
      .map((batchItem) => {
        const scheduleItem =
          batchItem.schedule_item ??
          templateItems.find((item) => item.id === batchItem.schedule_item_id)

        if (!scheduleItem) return null

        let status = (batchItem.status?.toLowerCase() ?? "scheduled") as MedVacDisplayRow["status"]
        const scheduled = new Date(batchItem.scheduled_date)
        scheduled.setHours(0, 0, 0, 0)

        if (status === "completed" || status === "late") {
          // keep
        } else if (status === "missed") {
          // keep
        } else if (scheduled < today) {
          status = "missed"
        } else {
          status = "scheduled"
        }

        return {
          key: `batch-${batchItem.id}`,
          scheduleItem,
          batchItem,
          scheduledDate: batchItem.scheduled_date,
          status,
        }
      })
      .filter((row): row is MedVacDisplayRow => row !== null)
  }

  return templateItems.map((scheduleItem) => {
    const executed = batchItems.find((item) => item.schedule_item_id === scheduleItem.id)
    let status: MedVacDisplayRow["status"] = "pending"
    if (executed?.status === "completed" || executed?.status === "late") {
      status = executed.status
    } else if (typeof scheduleItem.age_days === "number" && scheduleItem.age_days < currentAge) {
      status = "missed"
    }

    return {
      key: `template-${scheduleItem.id}`,
      scheduleItem,
      batchItem: executed,
      scheduledDate: executed?.scheduled_date ?? null,
      status,
    }
  })
}

export function formatRecurrenceLabel(item: ScheduleItem): string | null {
  if (!item.is_recurring) return null
  const interval = item.interval_days ?? 1
  return `Day ${item.age_days}, then every ${interval} day${interval === 1 ? "" : "s"} until flock end`
}
