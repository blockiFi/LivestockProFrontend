import type { ExportColumn } from "@/lib/exportData"
import type { BatchActivityRow } from "@/lib/request"
import { formatExportDate } from "@/lib/exportData"

export const ACTIVITY_EXPORT_COLUMNS: ExportColumn<BatchActivityRow>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Activity", value: (row) => row.activity },
  { header: "Category", value: (row) => row.category.replace(/_/g, " ") },
  { header: "Description", value: (row) => row.description },
  {
    header: "Quantity",
    value: (row) => (row.quantity != null ? row.quantity : ""),
  },
  { header: "Unit", value: (row) => row.unit ?? "" },
  { header: "Performed By", value: (row) => row.performed_by ?? "" },
  { header: "Status", value: (row) => row.status },
]

export const ACTIVITY_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "feeding", label: "Feeding" },
  { value: "feed_consumption", label: "Feed consumption" },
  { value: "medication", label: "Medication" },
  { value: "deworming", label: "Deworming" },
  { value: "vaccination", label: "Vaccination" },
  { value: "mortality", label: "Mortality" },
  { value: "weighing", label: "Weighing" },
  { value: "egg_production", label: "Egg production" },
  { value: "water_consumption", label: "Water consumption" },
  { value: "transfer", label: "Transfer" },
  { value: "sale", label: "Sale" },
  { value: "task", label: "Task" },
  { value: "daily_record", label: "Daily record" },
]

export const SUMMARY_LABELS: Record<string, string> = {
  total_activities: "Total activities",
  feed_consumed_kg: "Feed consumed (kg)",
  feed_planned_kg: "Feed planned (kg)",
  medication_count: "Medication records",
  deworming_count: "Deworming records",
  vaccination_count: "Vaccinations",
  mortality_count: "Mortality (birds)",
  tasks_completed: "Tasks completed",
  egg_total: "Eggs collected",
  water_liters: "Water (L)",
  feeding_count: "Feeding events",
  transfer_count: "Transfers",
  birds_sold: "Birds sold",
}
