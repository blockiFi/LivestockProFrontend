/** Permissions required for vaccination products page actions (farm-scoped). */

export const VACCINE_PRODUCT_PAGE_PERMISSIONS = {
  /** Open the vaccination products page */
  viewPage: [
    "view vaccine products",
    "create vaccine products",
    "update vaccine products",
    "view vaccines",
    "view vaccine inventory",
    "manage vaccine inventory",
    "manage inventory",
    "view inventory",
  ],
  /** Load vaccine type dropdown */
  listVaccineTypes: [
    "view vaccines",
    "create vaccines",
    "view vaccine products",
    "create vaccine products",
    "manage vaccine inventory",
    "manage inventory",
  ],
  /** Create a new vaccine type (New type) */
  createVaccineType: [
    "create vaccines",
    "create vaccine products",
    "manage vaccine inventory",
    "manage inventory",
  ],
  /** Submit add vaccine product form */
  createProduct: [
    "create vaccine products",
    "create vaccines",
    "manage vaccine inventory",
    "manage inventory",
  ],
  /** Edit existing farm product */
  updateProduct: [
    "update vaccine products",
    "update vaccines",
    "manage vaccine inventory",
    "manage inventory",
  ],
} as const

export function missingPermissions(
  userPermissions: string[],
  required: readonly string[],
): string[] {
  const granted = new Set(userPermissions)
  if (required.some((p) => granted.has(p))) return []
  return [...required]
}

export function hasAnyPermission(userPermissions: string[], required: readonly string[]): boolean {
  const granted = new Set(userPermissions)
  return required.some((p) => granted.has(p))
}
