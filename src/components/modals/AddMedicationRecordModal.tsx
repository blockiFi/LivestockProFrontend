import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Pill,
  User,
  Beaker,
  Package,
  Syringe,
  StickyNote,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Medication, MedicationInventory, AdministrationMethod } from "@/lib/types"
import {
  MEDICINE_UNITS,
  formatMedicationDosageSummary,
  suggestedMedicineUnit,
} from "@/lib/medicationDosage"

interface AddMedicationRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: MedicationRecordFormData) => Promise<void>
  flockId: number
  farmId: number
  medications?: Medication[]
  medicationInventories?: MedicationInventory[]
  administrationMethods?: AdministrationMethod[]
}

export interface MedicationRecordFormData {
  farm_id: number
  flock_id: number
  poultry_medication_id: number
  poultry_medication_inventory_id: number
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  purpose?: "preventive" | "treatment" | ""
  quantity: number
  notes: string
  administration_method_id: number
}

const emptyForm = (farmId: number, flockId: number): MedicationRecordFormData => ({
  farm_id: farmId,
  flock_id: flockId,
  poultry_medication_id: 0,
  poultry_medication_inventory_id: 0,
  date: format(new Date(), "yyyy-MM-dd"),
  administered_by: "",
  dosage: 0,
  dosage_unit: "ml",
  purpose: "",
  quantity: 0,
  notes: "",
  administration_method_id: 0,
})

const AddMedicationRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  flockId,
  farmId,
  medications = [],
  medicationInventories = [],
  administrationMethods = [],
}: AddMedicationRecordModalProps) => {
  const [formData, setFormData] = useState<MedicationRecordFormData>(emptyForm(farmId, flockId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCalendar, setShowCalendar] = useState(false)

  const filteredMedicationInventories = medicationInventories.filter((inv) => {
    if (formData.poultry_medication_id === 0) return true
    const productMedId = (inv.product as { poultry_medication_id?: number } | undefined)?.poultry_medication_id
    if (productMedId != null) return productMedId === formData.poultry_medication_id
    return inv.medication_product_id === formData.poultry_medication_id
  })

  const selectedInventory = useMemo(
    () => medicationInventories.find((inv) => inv.id === formData.poultry_medication_inventory_id),
    [medicationInventories, formData.poultry_medication_inventory_id],
  )

  const selectedProduct = selectedInventory?.product
  const labelHint = selectedProduct ? formatMedicationDosageSummary(selectedProduct) : null

  const handleInputChange = (field: keyof MedicationRecordFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _unused, ...rest } = prev
        return rest
      })
    }
  }

  const handleMedicationChange = (medicationId: string) => {
    const id = parseInt(medicationId)
    setFormData((prev) => ({
      ...prev,
      poultry_medication_id: id,
      poultry_medication_inventory_id: 0,
    }))
    if (errors.poultry_medication_id) {
      setErrors((prev) => {
        const { poultry_medication_id: _unused, ...rest } = prev
        return rest
      })
    }
  }

  const handleInventoryChange = (inventoryId: string) => {
    const id = parseInt(inventoryId)
    const inventory = medicationInventories.find((inv) => inv.id === id)
    const unit = suggestedMedicineUnit(inventory?.product)
    setFormData((prev) => ({
      ...prev,
      poultry_medication_inventory_id: id,
      dosage_unit: unit || prev.dosage_unit,
    }))
    if (errors.poultry_medication_inventory_id) {
      setErrors((prev) => {
        const { poultry_medication_inventory_id: _unused, ...rest } = prev
        return rest
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      const formattedDate = format(validDate, "yyyy-MM-dd")
      setFormData((prev) => ({ ...prev, date: formattedDate }))
      setShowCalendar(false)
      if (errors.date) {
        setErrors((prev) => {
          const { date: _unused, ...rest } = prev
          return rest
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = "Administration date is required"
    if (!formData.poultry_medication_id) newErrors.poultry_medication_id = "Please select a medication"
    if (!formData.poultry_medication_inventory_id)
      newErrors.poultry_medication_inventory_id = "Please select medication inventory"
    if (!formData.administered_by.trim()) newErrors.administered_by = "Administered by is required"
    if (formData.dosage <= 0) newErrors.dosage = "Amount used must be greater than 0"
    if (!formData.dosage_unit.trim()) newErrors.dosage_unit = "Unit is required"
    if (!formData.administration_method_id)
      newErrors.administration_method_id = "Please select administration method"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const amount = formData.dosage
      await onSubmit({
        ...formData,
        dosage: amount,
        quantity: amount,
        purpose: formData.purpose || undefined,
      })
      setFormData(emptyForm(farmId, flockId))
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating medication record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(emptyForm(farmId, flockId))
      setErrors({})
      setShowCalendar(false)
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm(farmId, flockId))
      setErrors({})
      setShowCalendar(false)
    }
  }, [isOpen, farmId, flockId])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          handleClose()
        }
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Medication Record</DialogTitle>
            <DialogDescription className="text-purple-100">
              Record how much medicine was used. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              Administration Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-purple-500 ring-2 ring-purple-100",
              )}
            >
              <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.date
                  ? format(new Date(formData.date + "T12:00:00"), "EEEE, MMMM d, yyyy")
                  : "Select administration date"}
              </span>
              {showCalendar ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date + "T12:00:00") : undefined}
                  onSelect={handleDateChange}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-500" />
              Medication Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-purple-400" />
                  Medication *
                </Label>
                <Select value={formData.poultry_medication_id.toString()} onValueChange={handleMedicationChange}>
                  <SelectTrigger className={cn("h-9 text-sm", errors.poultry_medication_id && "border-red-400")}>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id.toString()}>
                        <div>
                          <div className="font-medium">{medication.name}</div>
                          <div className="text-xs text-gray-500">{medication.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.poultry_medication_id && (
                  <p className="text-xs text-red-500">{errors.poultry_medication_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-purple-400" />
                  Medication Inventory *
                </Label>
                <Select
                  value={formData.poultry_medication_inventory_id.toString()}
                  onValueChange={handleInventoryChange}
                  disabled={!formData.poultry_medication_id}
                >
                  <SelectTrigger
                    className={cn("h-9 text-sm", errors.poultry_medication_inventory_id && "border-red-400")}
                  >
                    <SelectValue placeholder="Select inventory batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMedicationInventories.map((inventory) => (
                      <SelectItem key={inventory.id} value={inventory.id.toString()}>
                        <div>
                          <div className="font-medium">
                            {inventory.product?.name ? `${inventory.product.name} · ` : ""}
                            Batch: {inventory.batch_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            Exp: {format(new Date(inventory.expiry_date), "MMM dd, yyyy")} | Qty:{" "}
                            {inventory.quantity} | {inventory.manufacturer}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.poultry_medication_inventory_id && (
                  <p className="text-xs text-red-500">{errors.poultry_medication_inventory_id}</p>
                )}
              </div>
            </div>
            {labelHint && labelHint !== "—" && (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                Label: {labelHint}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Administration Info
            </h3>
            <div className="space-y-1">
              <Label htmlFor="administered_by" className="text-xs text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Administered By *
              </Label>
              <Input
                id="administered_by"
                type="text"
                value={formData.administered_by}
                onChange={(e) => handleInputChange("administered_by", e.target.value)}
                placeholder="e.g., Dr. Smith, Farm Manager"
                className={cn("h-9 text-sm", errors.administered_by && "border-red-400")}
              />
              {errors.administered_by && <p className="text-xs text-red-500">{errors.administered_by}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-blue-400" />
                Administration Method *
              </Label>
              <Select
                value={formData.administration_method_id.toString()}
                onValueChange={(value) => handleInputChange("administration_method_id", parseInt(value))}
              >
                <SelectTrigger className={cn("h-9 text-sm", errors.administration_method_id && "border-red-400")}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {administrationMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.administration_method_id && (
                <p className="text-xs text-red-500">{errors.administration_method_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-green-500" />
              Amount Used
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dosage" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-green-400" />
                  Amount used *
                </Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.dosage || ""}
                  onChange={(e) => handleInputChange("dosage", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 10"
                  className={cn("h-9 text-sm", errors.dosage && "border-red-400")}
                />
                {errors.dosage && <p className="text-xs text-red-500">{errors.dosage}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="dosage_unit" className="text-xs text-gray-600">
                  Unit *
                </Label>
                <Select
                  value={formData.dosage_unit}
                  onValueChange={(value) => handleInputChange("dosage_unit", value)}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.dosage_unit && "border-red-400")}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICINE_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dosage_unit && <p className="text-xs text-red-500">{errors.dosage_unit}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Purpose</Label>
                <Select
                  value={formData.purpose || "none"}
                  onValueChange={(value) =>
                    handleInputChange("purpose", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500">This amount is deducted from inventory.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the medication administration..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Medication Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMedicationRecordModal
