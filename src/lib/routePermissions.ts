import {
  manageFarmSettings,
  viewEquipment,
  viewFarmSettings,
  viewFeedInventory,
  viewFeedProducts,
  viewFeedTypes,
  viewFlocks,
  viewHouses,
  viewInvoices,
  viewMedicationInventory,
  viewMedicationProducts,
  viewMedications,
  viewSales,
  viewSchedules,
  viewStatistics,
  viewTeamAccess,
  viewVaccineInventory,
  viewVaccineProducts,
  viewVaccines,
  viewFarmTasks,
} from "./permissions"

export type RoutePermissionRule = {
  pattern: RegExp
  anyOf: string[]
}

/** Ordered most-specific first. null anyOf = no farm permission required (authenticated only). */
export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  // Permission admin
  { pattern: /^\/dashboard\/poultry\/permission\/permissions/, anyOf: ["view permissions", "manage permissions"] },
  { pattern: /^\/dashboard\/poultry\/permission\/roles/, anyOf: ["view roles", "manage roles"] },
  { pattern: /^\/dashboard\/poultry\/permission\/user-roles/, anyOf: ["view users", "manage users", "manage user roles"] },
  { pattern: /^\/dashboard\/poultry\/permission/, anyOf: viewTeamAccess },

  // Analytics
  { pattern: /^\/dashboard\/poultry\/analytics/, anyOf: [...viewSales, ...viewStatistics] },

  // Health
  { pattern: /^\/dashboard\/poultry\/health\/medication-products/, anyOf: viewMedicationProducts },
  { pattern: /^\/dashboard\/poultry\/health\/medications/, anyOf: viewMedications },
  { pattern: /^\/dashboard\/poultry\/health\/vaccination-products/, anyOf: viewVaccineProducts },
  { pattern: /^\/dashboard\/poultry\/health\/vaccinations/, anyOf: viewVaccines },
  { pattern: /^\/dashboard\/poultry\/health/, anyOf: [...viewMedications, ...viewVaccines] },

  // Inventory
  { pattern: /^\/dashboard\/poultry\/inventory\/medications/, anyOf: viewMedicationInventory },
  { pattern: /^\/dashboard\/poultry\/inventory\/vaccination/, anyOf: viewVaccineInventory },
  { pattern: /^\/dashboard\/poultry\/inventory\/feeds/, anyOf: viewFeedInventory },
  { pattern: /^\/dashboard\/poultry\/inventory/, anyOf: [...viewMedicationInventory, ...viewVaccineInventory, ...viewFeedInventory] },

  // Feed
  { pattern: /^\/dashboard\/poultry\/feed\/components/, anyOf: viewFeedProducts },
  { pattern: /^\/dashboard\/poultry\/feed\/compositions/, anyOf: viewFeedProducts },
  { pattern: /^\/dashboard\/poultry\/feed\/formulation/, anyOf: viewFeedProducts },
  { pattern: /^\/dashboard\/poultry\/feed/, anyOf: viewFeedProducts },

  // Poultry core
  { pattern: /^\/dashboard\/poultry\/flock-management\/\d+\/cashier/, anyOf: viewSales },
  { pattern: /^\/dashboard\/poultry\/flock-management\/\d+/, anyOf: viewFlocks },
  { pattern: /^\/dashboard\/poultry\/flock-management/, anyOf: viewFlocks },
  { pattern: /^\/dashboard\/poultry\/houses/, anyOf: viewHouses },
  { pattern: /^\/dashboard\/poultry\/schedules/, anyOf: viewSchedules },
  { pattern: /^\/dashboard\/poultry\/tasks/, anyOf: viewFarmTasks },
  { pattern: /^\/dashboard\/poultry/, anyOf: [...viewFlocks, ...viewStatistics] },

  // Equipment
  { pattern: /^\/dashboard\/equipment/, anyOf: viewEquipment },

  // Invoices
  { pattern: /^\/dashboard\/invoices/, anyOf: viewInvoices },

  // Settings admin
  { pattern: /^\/dashboard\/settings\/team/, anyOf: viewTeamAccess },
  { pattern: /^\/dashboard\/settings\/billing/, anyOf: ["manage billing"] },
  { pattern: /^\/dashboard\/settings\/feed-ages/, anyOf: [...viewFarmSettings, ...viewFeedTypes] },
  { pattern: /^\/dashboard\/settings\/invoicing/, anyOf: manageFarmSettings },
  { pattern: /^\/dashboard\/settings\/farm/, anyOf: viewFarmSettings },
  { pattern: /^\/dashboard\/settings\/notifications/, anyOf: viewFarmSettings },
]

/** Nav link permission map keyed by path prefix for sidebar filtering. */
export const NAV_PERMISSIONS: Record<string, string[]> = {
  "/dashboard/poultry": [...viewFlocks, ...viewStatistics],
  "/dashboard/poultry/flock-management": viewFlocks,
  "/dashboard/poultry/houses": viewHouses,
  "/dashboard/poultry/schedules": viewSchedules,
  "/dashboard/poultry/tasks": viewFarmTasks,
  "/dashboard/poultry/analytics/sales-profit-loss": [...viewSales, ...viewStatistics],
  "/dashboard/poultry/health/medications": viewMedications,
  "/dashboard/poultry/health/medication-products": viewMedicationProducts,
  "/dashboard/poultry/health/vaccinations": viewVaccines,
  "/dashboard/poultry/health/vaccination-products": viewVaccineProducts,
  "/dashboard/poultry/inventory/medications": viewMedicationInventory,
  "/dashboard/poultry/inventory/vaccination": viewVaccineInventory,
  "/dashboard/poultry/inventory/feeds": viewFeedInventory,
  "/dashboard/poultry/feed/components": viewFeedProducts,
  "/dashboard/poultry/feed/compositions": viewFeedProducts,
  "/dashboard/poultry/feed/formulation": viewFeedProducts,
  "/dashboard/poultry/permission/permissions": ["view permissions", "manage permissions"],
  "/dashboard/poultry/permission/roles": ["view roles", "manage roles"],
  "/dashboard/poultry/permission/user-roles": ["view users", "manage users", "manage user roles"],
  "/dashboard/equipment": viewEquipment,
  "/dashboard/invoices": viewInvoices,
  "/dashboard/notifications": viewFarmSettings,
  "/dashboard/settings": [],
  "/dashboard/settings/farm": viewFarmSettings,
  "/dashboard/settings/invoicing": manageFarmSettings,
  "/dashboard/settings/feed-ages": [...viewFarmSettings, ...viewFeedTypes],
  "/dashboard/settings/team": viewTeamAccess,
  "/dashboard/settings/billing": ["manage billing"],
  "/dashboard/settings/notifications": viewFarmSettings,
}

export function matchRoutePermission(pathname: string): string[] | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/"
  for (const rule of ROUTE_PERMISSION_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.anyOf
    }
  }
  return null
}

export function canAccessRoute(pathname: string, permissions: string[]): boolean {
  const required = matchRoutePermission(pathname)
  if (!required || required.length === 0) return true
  return required.some((p) => permissions.includes(p))
}

export function canAccessNav(path: string, permissions: string[]): boolean {
  const required = NAV_PERMISSIONS[path]
  if (!required || required.length === 0) return true
  return required.some((p) => permissions.includes(p))
}
