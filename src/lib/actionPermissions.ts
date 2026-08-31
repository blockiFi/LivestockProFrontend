/**
 * Action-level permission groups for PermissionGate anyOf props.
 * Import from here in pages and components.
 */
import { PERM, manageEquipment, manageFarmSettings, manageFeedInventory, manageFeedProducts, manageFeedTypes, manageFeedUsages, manageFlocks, manageHouses, manageInvoices, manageMedicationProducts, manageMedications, manageRecords, manageSales, manageSchedules, manageTeamAccess, manageVaccineProducts, manageVaccines, completeFarmTasks, manageFarmTasks } from "./permissions"

export const ACTIONS = {
  flocks: {
    view: ["view flocks", "manage flocks", "create flocks", "update flocks"],
    create: ["create flocks", "manage flocks"],
    update: ["update flocks", "manage flocks"],
    delete: ["delete flocks", "manage flocks"],
    manage: manageFlocks,
  },
  houses: {
    view: ["view poultry houses", "manage poultry houses", "create poultry houses"],
    create: ["create poultry houses", "manage poultry houses"],
    update: ["update poultry houses", "manage poultry houses"],
    delete: ["delete poultry houses", "manage poultry houses"],
    manage: manageHouses,
  },
  schedules: {
    view: ["view schedules", "manage schedules", "create schedules"],
    create: ["create schedules", "manage schedules"],
    update: ["update schedules", "manage schedules"],
    delete: ["delete schedules", "manage schedules"],
    manage: manageSchedules,
  },
  farmTasks: {
    view: ["view farm tasks", "manage farm tasks", "complete farm tasks"],
    manage: manageFarmTasks,
    complete: completeFarmTasks,
  },
  records: {
    view: ["view records", "manage records", "view mortality records", "view weight records", "view egg records"],
    create: ["create records", "manage records", "manage mortality records", "manage weight records", "manage egg records"],
    update: ["update records", "manage records"],
    delete: ["delete records", "manage records"],
    manage: manageRecords,
  },
  sales: {
    view: ["view sales", "manage sales", "create sales"],
    create: ["create sales", "manage sales"],
    update: ["update sales", "manage sales"],
    delete: ["delete sales", "manage sales"],
    manage: manageSales,
  },
  customers: {
    view: ["view customers", "manage customers", "create customers"],
    create: ["create customers", "manage customers"],
    update: ["update customers", "manage customers"],
    delete: ["delete customers", "manage customers"],
  },
  medications: {
    view: ["view medications", "create medications", "update medications"],
    create: ["create medications"],
    update: ["update medications"],
    delete: ["delete medications"],
    manage: manageMedications,
  },
  medicationProducts: {
    view: ["view medication products", "create medication products"],
    create: ["create medication products"],
    update: ["update medication products"],
    delete: ["delete medication products"],
    manage: manageMedicationProducts,
  },
  vaccines: {
    view: ["view vaccines", "create vaccines", "update vaccines"],
    create: ["create vaccines"],
    update: ["update vaccines"],
    delete: ["delete vaccines"],
    manage: manageVaccines,
  },
  vaccineProducts: {
    view: [
      "view vaccine products",
      "create vaccine products",
      "view vaccine inventory",
      "view vaccine inventories",
      "view vaccines",
      "create vaccines",
      "manage vaccine inventory",
      "manage inventory",
      "view inventory",
    ],
    create: [
      "create vaccine products",
      "create vaccines",
      "update vaccine products",
      "update vaccines",
      "manage vaccine inventory",
      "manage inventory",
    ],
    update: [
      "update vaccine products",
      "update vaccines",
      "manage vaccine inventory",
      "manage inventory",
    ],
    delete: [
      "delete vaccine products",
      "delete vaccines",
      "manage vaccine inventory",
      "manage inventory",
    ],
    manage: manageVaccineProducts,
  },
  medicationInventory: {
    view: ["view medication inventory", "view medication inventories", "manage medication inventory", "manage inventory", "view inventory"],
    create: ["create feed inventories", "manage inventory", "manage medication inventory"],
    update: ["update feed inventories", "manage inventory", "manage medication inventory"],
    delete: ["delete feed inventories", "manage inventory"],
  },
  vaccineInventory: {
    view: ["view vaccine inventory", "view vaccine inventories", "manage vaccine inventory", "manage inventory", "view inventory"],
    create: ["manage vaccine inventory", "manage inventory"],
    update: ["manage vaccine inventory", "manage inventory"],
    delete: ["manage vaccine inventory", "manage inventory"],
  },
  feedInventory: {
    view: ["view feed inventories", "view feed inventory", "manage feed inventory", "manage inventory", "view inventory"],
    create: ["create feed inventories", "manage feed inventory", "manage inventory"],
    update: ["update feed inventories", "manage feed inventory", "manage inventory"],
    delete: ["delete feed inventories", "manage feed inventory", "manage inventory"],
    manage: manageFeedInventory,
  },
  feedProducts: {
    view: ["view feed products", "create feed products"],
    create: ["create feed products"],
    update: ["update feed products"],
    delete: ["delete feed products"],
    manage: manageFeedProducts,
  },
  feedTypes: {
    view: ["view feed types", "update feed types", PERM.MANAGE_FARM_SETTINGS],
    manage: manageFeedTypes,
  },
  feedUsages: {
    view: ["view feed usages", "create feed usages"],
    create: ["create feed usages"],
    update: ["update feed usages"],
    delete: ["delete feed usages"],
    manage: manageFeedUsages,
  },
  roles: {
    view: ["view roles", "manage roles"],
    create: ["create roles", "manage roles"],
    update: ["update roles", "manage roles"],
    delete: ["delete roles", "manage roles"],
    manage: ["manage roles", "create roles", "update roles", "delete roles"],
  },
  users: {
    view: ["view users", "manage users"],
    create: ["create users", "manage users"],
    update: ["update users", "manage users"],
    delete: ["delete users", "manage users"],
    manage: ["manage users", "manage user roles", ...manageTeamAccess],
  },
  permissions: {
    view: ["view permissions", "manage permissions"],
    manage: ["manage permissions", "manage roles"],
  },
  equipment: {
    view: ["view equipment", "manage equipment"],
    manage: manageEquipment,
  },
  invoices: {
    view: ["view invoices", "create invoices"],
    create: ["create invoices"],
    update: ["update invoices"],
    delete: ["delete invoices"],
    manage: manageInvoices,
  },
  farmSettings: {
    view: ["view farm", PERM.MANAGE_FARM_SETTINGS],
    manage: manageFarmSettings,
  },
  billing: {
    view: ["manage billing", "view farm"],
    manage: ["manage billing"],
  },
  statistics: {
    view: ["view statistics", "view reports", "view sales"],
    export: ["export data", "generate reports"],
  },
} as const
