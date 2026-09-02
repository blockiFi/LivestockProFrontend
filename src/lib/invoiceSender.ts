import type { Farm } from "@/lib/types"

export type InvoiceSenderDetails = {
  name: string
  address: string | null
  email: string | null
  phone: string | null
  website: string | null
}

export function getInvoiceSenderDetails(farm: Farm | null): InvoiceSenderDetails {
  const address = [farm?.address, farm?.city, farm?.state, farm?.postal_code]
    .filter((part) => Boolean(part?.trim()))
    .join(", ")

  return {
    name: farm?.name?.trim() || "Farm",
    address: address || null,
    email: farm?.email?.trim() || null,
    phone: farm?.phone?.trim() || null,
    website: farm?.website?.trim() || null,
  }
}
