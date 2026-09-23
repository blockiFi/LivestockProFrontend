export type DiluentType = "water" | "feed" | "other"

export type DosageRatioFields = {
  medicine_amount: number | null
  medicine_unit: string
  diluent_amount: number | null
  diluent_unit: string
  diluent_type: DiluentType | ""
  diluent_label: string
}

export type MedicationDosageRatios = {
  preventive: DosageRatioFields
  treatment: DosageRatioFields
}

export const MEDICINE_UNITS = [
  { value: "g", label: "Grams (g)" },
  { value: "mg", label: "Milligrams (mg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "tablet", label: "Tablet" },
] as const

export const DILUENT_UNITS = [
  { value: "L", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
] as const

export const emptyDosageRatio = (): DosageRatioFields => ({
  medicine_amount: null,
  medicine_unit: "",
  diluent_amount: null,
  diluent_unit: "",
  diluent_type: "",
  diluent_label: "",
})

export const emptyMedicationDosageRatios = (): MedicationDosageRatios => ({
  preventive: emptyDosageRatio(),
  treatment: emptyDosageRatio(),
})

type RatioSource = Record<string, unknown> | null | undefined

const get = (source: RatioSource, key: string): unknown =>
  source && typeof source === "object" ? (source as Record<string, unknown>)[key] : undefined

/** Format a single mix ratio, e.g. "1 g per 1 L water". */
export function formatMedicationDosageRatio(
  source: RatioSource,
  prefix: "preventive" | "treatment",
): string | null {
  const medicineAmount = get(source, `${prefix}_medicine_amount`)
  const medicineUnit = get(source, `${prefix}_medicine_unit`)
  if (medicineAmount == null || medicineAmount === "" || !medicineUnit) return null

  const amount = String(Number(medicineAmount))
  let line = `${amount} ${medicineUnit}`

  const diluentAmount = get(source, `${prefix}_diluent_amount`)
  const diluentUnit = get(source, `${prefix}_diluent_unit`)
  const diluentType = get(source, `${prefix}_diluent_type`)
  const diluentLabel = get(source, `${prefix}_diluent_label`)

  if (diluentAmount != null && diluentAmount !== "" && diluentUnit && diluentType) {
    const dAmount = String(Number(diluentAmount))
    const of =
      diluentType === "other"
        ? String(diluentLabel || "").trim() || "other"
        : String(diluentType)
    line += ` per ${dAmount} ${diluentUnit} ${of}`
  }

  return line
}

/** Prefer API labels, then format from ratio fields, then legacy dosage. */
export function formatMedicationDosage(product: RatioSource): {
  preventive: string | null
  treatment: string | null
  legacy: string | null
} {
  const preventiveLabel = get(product, "preventive_dosage_label")
  const treatmentLabel = get(product, "treatment_dosage_label")
  const preventive =
    (typeof preventiveLabel === "string" && preventiveLabel) ||
    formatMedicationDosageRatio(product, "preventive")
  const treatment =
    (typeof treatmentLabel === "string" && treatmentLabel) ||
    formatMedicationDosageRatio(product, "treatment")

  const dosage = get(product, "dosage")
  const dosageUnit = get(product, "dosage_unit")
  const legacy =
    dosage != null && dosage !== "" && dosageUnit
      ? `${dosage} ${dosageUnit}`
      : dosage != null && dosage !== ""
        ? String(dosage)
        : null

  return { preventive, treatment, legacy }
}

export function formatMedicationDosageSummary(product: RatioSource): string {
  const { preventive, treatment, legacy } = formatMedicationDosage(product)
  const parts: string[] = []
  if (preventive) parts.push(`Preventive: ${preventive}`)
  if (treatment) parts.push(`Treatment: ${treatment}`)
  if (parts.length) return parts.join(" · ")
  return legacy || "—"
}

export function suggestedMedicineUnit(product: RatioSource): string {
  const treatmentUnit = get(product, "treatment_medicine_unit")
  if (typeof treatmentUnit === "string" && treatmentUnit) return treatmentUnit
  const preventiveUnit = get(product, "preventive_medicine_unit")
  if (typeof preventiveUnit === "string" && preventiveUnit) return preventiveUnit
  const dosageUnit = get(product, "dosage_unit")
  if (typeof dosageUnit === "string" && dosageUnit) return dosageUnit
  return "ml"
}

/** Flatten form ratios into API payload fields (omit empty blocks). */
export function dosageRatiosToPayload(ratios: MedicationDosageRatios): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {}
  for (const prefix of ["preventive", "treatment"] as const) {
    const block = ratios[prefix]
    const hasAny =
      block.medicine_amount != null ||
      !!block.medicine_unit ||
      block.diluent_amount != null ||
      !!block.diluent_unit ||
      !!block.diluent_type ||
      !!block.diluent_label
    if (!hasAny) continue
    out[`${prefix}_medicine_amount`] = block.medicine_amount
    out[`${prefix}_medicine_unit`] = block.medicine_unit || null
    out[`${prefix}_diluent_amount`] = block.diluent_amount
    out[`${prefix}_diluent_unit`] = block.diluent_unit || null
    out[`${prefix}_diluent_type`] = block.diluent_type || null
    out[`${prefix}_diluent_label`] =
      block.diluent_type === "other" ? block.diluent_label.trim() || null : null
  }
  return out
}
