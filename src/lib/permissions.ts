/** Farm-scoped permission name constants aligned with backend PermissionSeeder + controller extras. */

export const PERM = {
  // Farm
  VIEW_FARM: "view farm",
  UPDATE_FARM: "update farm",
  DELETE_FARM: "delete farm",
  MANAGE_FARM_SETTINGS: "manage farm settings",

  // Users & roles
  VIEW_USERS: "view users",
  MANAGE_USERS: "manage users",
  CREATE_USERS: "create users",
  UPDATE_USERS: "update users",
  DELETE_USERS: "delete users",
  VIEW_ROLES: "view roles",
  MANAGE_ROLES: "manage roles",
  CREATE_ROLES: "create roles",
  UPDATE_ROLES: "update roles",
  DELETE_ROLES: "delete roles",
  VIEW_PERMISSIONS: "view permissions",
  MANAGE_PERMISSIONS: "manage permissions",
  MANAGE_USER_ROLES: "manage user roles",
  MANAGE_USER_PERMISSIONS: "manage user permissions",

  // Flocks
  VIEW_FLOCKS: "view flocks",
  MANAGE_FLOCKS: "manage flocks",
  CREATE_FLOCKS: "create flocks",
  UPDATE_FLOCKS: "update flocks",
  DELETE_FLOCKS: "delete flocks",

  // Houses
  VIEW_POULTRY_HOUSES: "view poultry houses",
  MANAGE_POULTRY_HOUSES: "manage poultry houses",
  CREATE_POULTRY_HOUSES: "create poultry houses",
  UPDATE_POULTRY_HOUSES: "update poultry houses",
  DELETE_POULTRY_HOUSES: "delete poultry houses",

  // Statistics & reports
  VIEW_STATISTICS: "view statistics",
  VIEW_REPORTS: "view reports",
  EXPORT_DATA: "export data",
  GENERATE_REPORTS: "generate reports",

  // Schedules
  VIEW_SCHEDULES: "view schedules",
  MANAGE_SCHEDULES: "manage schedules",
  CREATE_SCHEDULES: "create schedules",
  UPDATE_SCHEDULES: "update schedules",
  DELETE_SCHEDULES: "delete schedules",

  // Farm tasks
  VIEW_FARM_TASKS: "view farm tasks",
  MANAGE_FARM_TASKS: "manage farm tasks",
  COMPLETE_FARM_TASKS: "complete farm tasks",
  APPROVE_FARM_TASKS: "approve farm tasks",

  // Records
  VIEW_RECORDS: "view records",
  MANAGE_RECORDS: "manage records",
  CREATE_RECORDS: "create records",
  UPDATE_RECORDS: "update records",
  DELETE_RECORDS: "delete records",
  VIEW_MORTALITY_RECORDS: "view mortality records",
  MANAGE_MORTALITY_RECORDS: "manage mortality records",
  VIEW_WEIGHT_RECORDS: "view weight records",
  MANAGE_WEIGHT_RECORDS: "manage weight records",
  VIEW_EGG_RECORDS: "view egg records",
  MANAGE_EGG_RECORDS: "manage egg records",

  // Sales & customers
  VIEW_SALES: "view sales",
  MANAGE_SALES: "manage sales",
  CREATE_SALES: "create sales",
  UPDATE_SALES: "update sales",
  DELETE_SALES: "delete sales",
  VIEW_CUSTOMERS: "view customers",
  MANAGE_CUSTOMERS: "manage customers",
  CREATE_CUSTOMERS: "create customers",
  UPDATE_CUSTOMERS: "update customers",
  DELETE_CUSTOMERS: "delete customers",

  // Medications
  VIEW_MEDICATIONS: "view medications",
  MANAGE_MEDICATIONS: "manage medications",
  CREATE_MEDICATIONS: "create medications",
  UPDATE_MEDICATIONS: "update medications",
  DELETE_MEDICATIONS: "delete medications",
  VIEW_MEDICATION_PRODUCTS: "view medication products",
  CREATE_MEDICATION_PRODUCTS: "create medication products",
  UPDATE_MEDICATION_PRODUCTS: "update medication products",
  DELETE_MEDICATION_PRODUCTS: "delete medication products",
  VIEW_MEDICATION_RECORDS: "view medication records",
  CREATE_MEDICATION_RECORDS: "create medication records",
  UPDATE_MEDICATION_RECORDS: "update medication records",
  DELETE_MEDICATION_RECORDS: "delete medication records",

  // Vaccines
  VIEW_VACCINES: "view vaccines",
  CREATE_VACCINES: "create vaccines",
  UPDATE_VACCINES: "update vaccines",
  DELETE_VACCINES: "delete vaccines",
  VIEW_VACCINE_PRODUCTS: "view vaccine products",
  CREATE_VACCINE_PRODUCTS: "create vaccine products",
  UPDATE_VACCINE_PRODUCTS: "update vaccine products",
  DELETE_VACCINE_PRODUCTS: "delete vaccine products",
  VIEW_VACCINATION_RECORDS: "view vaccination records",
  CREATE_VACCINATION_RECORDS: "create vaccination records",
  UPDATE_VACCINATION_RECORDS: "update vaccination records",
  DELETE_VACCINATION_RECORDS: "delete vaccination records",

  // Inventory
  VIEW_INVENTORY: "view inventory",
  MANAGE_INVENTORY: "manage inventory",
  VIEW_MEDICATION_INVENTORY: "view medication inventory",
  VIEW_MEDICATION_INVENTORIES: "view medication inventories",
  MANAGE_MEDICATION_INVENTORY: "manage medication inventory",
  VIEW_VACCINE_INVENTORY: "view vaccine inventory",
  VIEW_VACCINE_INVENTORIES: "view vaccine inventories",
  MANAGE_VACCINE_INVENTORY: "manage vaccine inventory",
  VIEW_FEED_INVENTORY: "view feed inventory",
  VIEW_FEED_INVENTORIES: "view feed inventories",
  MANAGE_FEED_INVENTORY: "manage feed inventory",
  CREATE_FEED_INVENTORIES: "create feed inventories",
  UPDATE_FEED_INVENTORIES: "update feed inventories",
  DELETE_FEED_INVENTORIES: "delete feed inventories",

  // Feed types & products
  VIEW_FEED_TYPES: "view feed types",
  UPDATE_FEED_TYPES: "update feed types",
  CREATE_FEED_TYPES: "create feed types",
  DELETE_FEED_TYPES: "delete feed types",
  VIEW_FEED_PRODUCTS: "view feed products",
  CREATE_FEED_PRODUCTS: "create feed products",
  UPDATE_FEED_PRODUCTS: "update feed products",
  DELETE_FEED_PRODUCTS: "delete feed products",

  // Feed usage
  VIEW_FEED_USAGES: "view feed usages",
  CREATE_FEED_USAGES: "create feed usages",
  UPDATE_FEED_USAGES: "update feed usages",
  DELETE_FEED_USAGES: "delete feed usages",

  // Equipment
  VIEW_EQUIPMENT: "view equipment",
  MANAGE_EQUIPMENT: "manage equipment",
  VIEW_EQUIPMENT_FINANCIALS: "view equipment financials",

  // Invoices
  VIEW_INVOICES: "view invoices",
  CREATE_INVOICES: "create invoices",
  UPDATE_INVOICES: "update invoices",
  DELETE_INVOICES: "delete invoices",
} as const

export function canAny(permissions: string[], required: string[]): boolean {
  const set = new Set(permissions)
  return required.some((p) => set.has(p))
}

export function canAll(permissions: string[], required: string[]): boolean {
  const set = new Set(permissions)
  return required.every((p) => set.has(p))
}

export function can(permissions: string[], permission: string): boolean {
  return permissions.includes(permission)
}

// Composite view helpers (OR logic matching backend)
export const viewFlocks = [
  PERM.VIEW_FLOCKS,
  PERM.MANAGE_FLOCKS,
  PERM.CREATE_FLOCKS,
  PERM.UPDATE_FLOCKS,
  PERM.DELETE_FLOCKS,
]

export const manageFlocks = [PERM.MANAGE_FLOCKS, PERM.CREATE_FLOCKS, PERM.UPDATE_FLOCKS, PERM.DELETE_FLOCKS]

export const viewHouses = [PERM.VIEW_POULTRY_HOUSES, PERM.MANAGE_POULTRY_HOUSES, PERM.CREATE_POULTRY_HOUSES, PERM.UPDATE_POULTRY_HOUSES]

export const manageHouses = [PERM.MANAGE_POULTRY_HOUSES, PERM.CREATE_POULTRY_HOUSES, PERM.UPDATE_POULTRY_HOUSES, PERM.DELETE_POULTRY_HOUSES]

export const viewSchedules = [PERM.VIEW_SCHEDULES, PERM.MANAGE_SCHEDULES, PERM.CREATE_SCHEDULES, PERM.UPDATE_SCHEDULES]

export const manageSchedules = [PERM.MANAGE_SCHEDULES, PERM.CREATE_SCHEDULES, PERM.UPDATE_SCHEDULES, PERM.DELETE_SCHEDULES]

export const viewFarmTasks = [PERM.VIEW_FARM_TASKS, PERM.MANAGE_FARM_TASKS, PERM.COMPLETE_FARM_TASKS, PERM.APPROVE_FARM_TASKS]

export const manageFarmTasks = [PERM.MANAGE_FARM_TASKS, PERM.APPROVE_FARM_TASKS]

export const completeFarmTasks = [PERM.COMPLETE_FARM_TASKS, PERM.MANAGE_FARM_TASKS]

export const viewStatistics = [PERM.VIEW_STATISTICS, PERM.VIEW_REPORTS, PERM.GENERATE_REPORTS]

export const viewSales = [PERM.VIEW_SALES, PERM.MANAGE_SALES, PERM.CREATE_SALES, PERM.UPDATE_SALES]

export const manageSales = [PERM.MANAGE_SALES, PERM.CREATE_SALES, PERM.UPDATE_SALES, PERM.DELETE_SALES]

export const viewMedications = [PERM.VIEW_MEDICATIONS, PERM.CREATE_MEDICATIONS, PERM.UPDATE_MEDICATIONS, PERM.DELETE_MEDICATIONS]

export const manageMedications = [PERM.CREATE_MEDICATIONS, PERM.UPDATE_MEDICATIONS, PERM.DELETE_MEDICATIONS]

export const viewMedicationProducts = [PERM.VIEW_MEDICATION_PRODUCTS, PERM.CREATE_MEDICATION_PRODUCTS, PERM.UPDATE_MEDICATION_PRODUCTS]

export const manageMedicationProducts = [PERM.CREATE_MEDICATION_PRODUCTS, PERM.UPDATE_MEDICATION_PRODUCTS, PERM.DELETE_MEDICATION_PRODUCTS]

export const viewVaccines = [PERM.VIEW_VACCINES, PERM.CREATE_VACCINES, PERM.UPDATE_VACCINES, PERM.DELETE_VACCINES]

export const manageVaccines = [PERM.CREATE_VACCINES, PERM.UPDATE_VACCINES, PERM.DELETE_VACCINES]

export const viewVaccineProducts = [
  PERM.VIEW_VACCINE_PRODUCTS,
  PERM.CREATE_VACCINE_PRODUCTS,
  PERM.UPDATE_VACCINE_PRODUCTS,
  PERM.DELETE_VACCINE_PRODUCTS,
  PERM.VIEW_VACCINES,
  PERM.CREATE_VACCINES,
  PERM.UPDATE_VACCINES,
  PERM.VIEW_VACCINE_INVENTORY,
  PERM.VIEW_VACCINE_INVENTORIES,
  PERM.MANAGE_VACCINE_INVENTORY,
  PERM.MANAGE_INVENTORY,
  PERM.VIEW_INVENTORY,
]

export const manageVaccineProducts = [
  PERM.CREATE_VACCINE_PRODUCTS,
  PERM.UPDATE_VACCINE_PRODUCTS,
  PERM.DELETE_VACCINE_PRODUCTS,
  PERM.CREATE_VACCINES,
  PERM.MANAGE_VACCINE_INVENTORY,
  PERM.MANAGE_INVENTORY,
]

export const viewMedicationInventory = [
  PERM.VIEW_MEDICATION_INVENTORY,
  PERM.VIEW_MEDICATION_INVENTORIES,
  PERM.MANAGE_MEDICATION_INVENTORY,
  PERM.MANAGE_INVENTORY,
  PERM.VIEW_INVENTORY,
]

export const viewVaccineInventory = [
  PERM.VIEW_VACCINE_INVENTORY,
  PERM.VIEW_VACCINE_INVENTORIES,
  PERM.MANAGE_VACCINE_INVENTORY,
  PERM.MANAGE_INVENTORY,
  PERM.VIEW_INVENTORY,
]

export const viewFeedInventory = [
  PERM.VIEW_FEED_INVENTORY,
  PERM.VIEW_FEED_INVENTORIES,
  PERM.MANAGE_FEED_INVENTORY,
  PERM.MANAGE_INVENTORY,
  PERM.VIEW_INVENTORY,
  PERM.CREATE_FEED_INVENTORIES,
  PERM.UPDATE_FEED_INVENTORIES,
]

export const manageFeedInventory = [
  PERM.MANAGE_FEED_INVENTORY,
  PERM.MANAGE_INVENTORY,
  PERM.CREATE_FEED_INVENTORIES,
  PERM.UPDATE_FEED_INVENTORIES,
  PERM.DELETE_FEED_INVENTORIES,
]

export const viewFeedProducts = [PERM.VIEW_FEED_PRODUCTS, PERM.CREATE_FEED_PRODUCTS, PERM.UPDATE_FEED_PRODUCTS]

export const manageFeedProducts = [PERM.CREATE_FEED_PRODUCTS, PERM.UPDATE_FEED_PRODUCTS, PERM.DELETE_FEED_PRODUCTS]

export const viewFeedTypes = [PERM.VIEW_FEED_TYPES, PERM.UPDATE_FEED_TYPES, PERM.CREATE_FEED_TYPES, PERM.MANAGE_FARM_SETTINGS]

export const manageFeedTypes = [PERM.UPDATE_FEED_TYPES, PERM.CREATE_FEED_TYPES, PERM.DELETE_FEED_TYPES, PERM.MANAGE_FARM_SETTINGS]

export const viewFeedUsages = [PERM.VIEW_FEED_USAGES, PERM.CREATE_FEED_USAGES, PERM.UPDATE_FEED_USAGES]

export const manageFeedUsages = [PERM.CREATE_FEED_USAGES, PERM.UPDATE_FEED_USAGES, PERM.DELETE_FEED_USAGES]

export const viewRecords = [
  PERM.VIEW_RECORDS,
  PERM.MANAGE_RECORDS,
  PERM.VIEW_MORTALITY_RECORDS,
  PERM.VIEW_WEIGHT_RECORDS,
  PERM.VIEW_EGG_RECORDS,
  PERM.MANAGE_MORTALITY_RECORDS,
  PERM.MANAGE_WEIGHT_RECORDS,
  PERM.MANAGE_EGG_RECORDS,
]

export const manageRecords = [
  PERM.MANAGE_RECORDS,
  PERM.CREATE_RECORDS,
  PERM.UPDATE_RECORDS,
  PERM.DELETE_RECORDS,
  PERM.MANAGE_MORTALITY_RECORDS,
  PERM.MANAGE_WEIGHT_RECORDS,
  PERM.MANAGE_EGG_RECORDS,
]

export const viewTeamAccess = [PERM.VIEW_USERS, PERM.VIEW_ROLES, PERM.VIEW_PERMISSIONS]

export const manageTeamAccess = [PERM.MANAGE_USERS, PERM.MANAGE_ROLES, PERM.MANAGE_USER_ROLES, PERM.MANAGE_PERMISSIONS]

export const viewFarmSettings = [PERM.VIEW_FARM, PERM.MANAGE_FARM_SETTINGS, PERM.UPDATE_FARM]

export const manageFarmSettings = [PERM.MANAGE_FARM_SETTINGS, PERM.UPDATE_FARM]

export const viewEquipment = [PERM.VIEW_EQUIPMENT, PERM.MANAGE_EQUIPMENT]

export const manageEquipment = [PERM.MANAGE_EQUIPMENT]

export const viewInvoices = [
  PERM.VIEW_INVOICES,
  PERM.CREATE_INVOICES,
  PERM.UPDATE_INVOICES,
  PERM.MANAGE_SALES,
  PERM.VIEW_SALES,
]

export const viewCustomers = [PERM.VIEW_CUSTOMERS, PERM.MANAGE_CUSTOMERS, PERM.CREATE_CUSTOMERS, PERM.VIEW_SALES]

export const manageCustomers = [PERM.CREATE_CUSTOMERS, PERM.UPDATE_CUSTOMERS, PERM.DELETE_CUSTOMERS, PERM.MANAGE_CUSTOMERS]

export const manageInvoices = [PERM.CREATE_INVOICES, PERM.UPDATE_INVOICES, PERM.DELETE_INVOICES]
