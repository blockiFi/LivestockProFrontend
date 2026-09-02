export type ExpenditureCategory =
  | "feed"
  | "medication"
  | "vaccination"
  | "labour"
  | "transport"
  | "utilities"
  | "equipment"
  | "housing"
  | "chicks"
  | "maintenance"
  | "other"
  | string;

export type ExpenditureSourceType =
  | "manual"
  | "feed_usage"
  | "feed_inventory_close"
  | "medication_record"
  | "vaccination_record"
  | "batch_schedule_item"
  | null;

export const EXPENDITURE_CATEGORY_META: Record<
  string,
  { label: string; color: string; chartColor: string; group: "production" | "operations" | "other" }
> = {
  feed: { label: "Feed", color: "bg-amber-100 text-amber-800 border-amber-200", chartColor: "#f59e0b", group: "production" },
  medication: { label: "Medication", color: "bg-violet-100 text-violet-800 border-violet-200", chartColor: "#8b5cf6", group: "production" },
  vaccination: { label: "Vaccination", color: "bg-sky-100 text-sky-800 border-sky-200", chartColor: "#0ea5e9", group: "production" },
  labour: { label: "Labour", color: "bg-emerald-100 text-emerald-800 border-emerald-200", chartColor: "#10b981", group: "operations" },
  transport: { label: "Transport", color: "bg-blue-100 text-blue-800 border-blue-200", chartColor: "#3b82f6", group: "operations" },
  utilities: { label: "Utilities", color: "bg-cyan-100 text-cyan-800 border-cyan-200", chartColor: "#06b6d4", group: "operations" },
  equipment: { label: "Equipment", color: "bg-indigo-100 text-indigo-800 border-indigo-200", chartColor: "#6366f1", group: "operations" },
  housing: { label: "Housing", color: "bg-orange-100 text-orange-800 border-orange-200", chartColor: "#f97316", group: "operations" },
  chicks: { label: "Day-old Chicks", color: "bg-pink-100 text-pink-800 border-pink-200", chartColor: "#ec4899", group: "production" },
  maintenance: { label: "Maintenance", color: "bg-slate-100 text-slate-800 border-slate-200", chartColor: "#64748b", group: "operations" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800 border-gray-200", chartColor: "#9ca3af", group: "other" },
};

export const MANUAL_EXPENDITURE_CATEGORIES: ExpenditureCategory[] = [
  "feed",
  "medication",
  "vaccination",
  "labour",
  "transport",
  "utilities",
  "equipment",
  "housing",
  "chicks",
  "maintenance",
  "other",
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Cheque" },
  { value: "credit", label: "Credit / Pay Later" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(category: string): string {
  return EXPENDITURE_CATEGORY_META[category]?.label ?? category.replace(/_/g, " ");
}

export function getCategoryBadgeClass(category: string): string {
  return EXPENDITURE_CATEGORY_META[category]?.color ?? EXPENDITURE_CATEGORY_META.other.color;
}

export function getSourceLabel(sourceType: string | null): string {
  switch (sourceType) {
    case "feed_usage":
      return "Auto · Feed usage";
    case "feed_inventory_close":
      return "Auto · Damaged feed";
    case "medication_record":
      return "Auto · Medication";
    case "vaccination_record":
      return "Auto · Vaccination";
    case "batch_schedule_item":
      return "Auto · Schedule";
    case "manual":
    case null:
      return "Manual entry";
    default:
      return "Auto";
  }
}

export function isManualExpenditure(sourceType: string | null): boolean {
  return !sourceType || sourceType === "manual";
}

export type DateRangePreset = import("./dateRange").ExpenditureDateRangePreset;

export { resolveExpenditureDateRange as resolveDateRange } from "./dateRange";
