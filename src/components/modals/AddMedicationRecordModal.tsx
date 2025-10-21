import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Medication, MedicationInventory, AdministrationMethod } from "@/lib/types"

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

interface MedicationRecordFormData {
  farm_id: number
  flock_id: number
  poultry_medication_id: number
  poultry_medication_inventory_id: number
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  quantity: number
  notes: string
  administration_method_id: number
}

const AddMedicationRecordModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  flockId, 
  farmId,
  medications = [],
  medicationInventories = [],
  administrationMethods = []
}: AddMedicationRecordModalProps) => {
  const [formData, setFormData] = useState<MedicationRecordFormData>({
    farm_id: farmId,
    flock_id: flockId,
    poultry_medication_id: 0,
    poultry_medication_inventory_id: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    administered_by: "",
    dosage: 0,
    dosage_unit: "mL",
    quantity: 0,
    notes: "",
    administration_method_id: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter medication inventories based on selected medication
  const filteredMedicationInventories = medicationInventories.filter(
    inv => formData.poultry_medication_id === 0 || inv.medication_product_id === formData.poultry_medication_id
  )

  const handleInputChange = (field: keyof MedicationRecordFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _unused, ...rest } = prev
        return rest
      })
    }
  }

  const handleMedicationChange = (medicationId: string) => {
    const id = parseInt(medicationId)
    setFormData(prev => ({ 
      ...prev, 
      poultry_medication_id: id,
      poultry_medication_inventory_id: 0 // Reset inventory selection when medication changes
    }))
    if (errors.poultry_medication_id) {
      setErrors(prev => {
        const { poultry_medication_id: _unused, ...rest } = prev
        return rest
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, date: formattedDate }))
      if (errors.date) {
        setErrors(prev => {
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
    if (!formData.poultry_medication_inventory_id) newErrors.poultry_medication_inventory_id = "Please select medication inventory"
    if (!formData.administered_by.trim()) newErrors.administered_by = "Administered by is required"
    if (formData.dosage <= 0) newErrors.dosage = "Dosage must be greater than 0"
    if (!formData.dosage_unit.trim()) newErrors.dosage_unit = "Dosage unit is required"
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0"
    if (!formData.administration_method_id) newErrors.administration_method_id = "Please select administration method"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form and close modal only on successful submission
      setFormData({
        farm_id: farmId,
        flock_id: flockId,
        poultry_medication_id: 0,
        poultry_medication_inventory_id: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        administered_by: "",
        dosage: 0,
        dosage_unit: "mL",
        quantity: 0,
        notes: "",
        administration_method_id: 0
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Error creating medication record:", error)
      // Don't close the modal on error so user can fix the issue
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        farm_id: farmId,
        flock_id: flockId,
        poultry_medication_id: 0,
        poultry_medication_inventory_id: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        administered_by: "",
        dosage: 0,
        dosage_unit: "mL",
        quantity: 0,
        notes: "",
        administration_method_id: 0
      })
      setErrors({})
      onClose()
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        farm_id: farmId,
        flock_id: flockId,
        poultry_medication_id: 0,
        poultry_medication_inventory_id: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        administered_by: "",
        dosage: 0,
        dosage_unit: "mL",
        quantity: 0,
        notes: "",
        administration_method_id: 0
      })
      setErrors({})
    }
  }, [isOpen, farmId, flockId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) {
        handleClose()
      }
    }}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Medication Record</DialogTitle>
          <DialogDescription>
            Record medication administration for your flock. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Administration Date */}
          <div className="space-y-2">
            <Label>Administration Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(new Date(formData.date), "PPP") : "Select administration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          {/* Medication Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Medication *</Label>
              <Select 
                value={formData.poultry_medication_id.toString()} 
                onValueChange={handleMedicationChange}
              >
                <SelectTrigger className={errors.poultry_medication_id ? "border-red-500" : ""}>
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
              {errors.poultry_medication_id && <p className="text-sm text-red-500">{errors.poultry_medication_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Medication Inventory *</Label>
              <Select 
                value={formData.poultry_medication_inventory_id.toString()} 
                onValueChange={(value) => handleInputChange("poultry_medication_inventory_id", parseInt(value))}
                disabled={!formData.poultry_medication_id}
              >
                <SelectTrigger className={errors.poultry_medication_inventory_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select inventory batch" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMedicationInventories.map((inventory) => (
                    <SelectItem key={inventory.id} value={inventory.id.toString()}>
                      <div>
                        <div className="font-medium">Batch: {inventory.batch_number}</div>
                        <div className="text-xs text-gray-500">
                          Exp: {format(new Date(inventory.expiry_date), "MMM dd, yyyy")} | 
                          Qty: {inventory.quantity} | 
                          {inventory.manufacturer}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.poultry_medication_inventory_id && <p className="text-sm text-red-500">{errors.poultry_medication_inventory_id}</p>}
            </div>
          </div>

          {/* Administered By */}
          <div className="space-y-2">
            <Label htmlFor="administered_by">Administered By *</Label>
            <Input
              id="administered_by"
              type="text"
              value={formData.administered_by}
              onChange={(e) => handleInputChange("administered_by", e.target.value)}
              placeholder="e.g., Dr. Smith, Farm Manager"
              className={errors.administered_by ? "border-red-500" : ""}
            />
            {errors.administered_by && <p className="text-sm text-red-500">{errors.administered_by}</p>}
          </div>

          {/* Dosage and Units */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                type="number"
                step="0.01"
                min="0"
                value={formData.dosage}
                onChange={(e) => handleInputChange("dosage", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.dosage ? "border-red-500" : ""}
              />
              {errors.dosage && <p className="text-sm text-red-500">{errors.dosage}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage_unit">Dosage Unit *</Label>
              <Select 
                value={formData.dosage_unit} 
                onValueChange={(value) => handleInputChange("dosage_unit", value)}
              >
                <SelectTrigger className={errors.dosage_unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mL">mL</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="tablets">tablets</SelectItem>
                  <SelectItem value="capsules">capsules</SelectItem>
                  <SelectItem value="drops">drops</SelectItem>
                  <SelectItem value="IU">IU</SelectItem>
                </SelectContent>
              </Select>
              {errors.dosage_unit && <p className="text-sm text-red-500">{errors.dosage_unit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Total Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>
          </div>

          {/* Administration Method */}
          <div className="space-y-2">
            <Label>Administration Method *</Label>
            <Select 
              value={formData.administration_method_id.toString()} 
              onValueChange={(value) => handleInputChange("administration_method_id", parseInt(value))}
            >
              <SelectTrigger className={errors.administration_method_id ? "border-red-500" : ""}>
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
            {errors.administration_method_id && <p className="text-sm text-red-500">{errors.administration_method_id}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the medication administration..."
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
