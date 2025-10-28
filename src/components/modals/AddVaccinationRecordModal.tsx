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
import { cn, Naira, formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import type { vaccine, PoultryVaccineInventory, AdministrationMethod } from "@/lib/types"

interface AddVaccinationRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: VaccinationRecordFormData) => Promise<void>
  flockId: number
  farmId: number
  vaccines?: vaccine[]
  vaccineInventories?: PoultryVaccineInventory[]
  administrationMethods?: AdministrationMethod[]
}

interface VaccinationRecordFormData {
  farm_id: number
  flock_id: number
  poultry_vaccine_id: number
  poultry_vaccine_inventory_id: number
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  quantity: number
  notes: string
  administration_method_id: number
}

const AddVaccinationRecordModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  flockId, 
  farmId,
  vaccines = [],
  vaccineInventories = [],
  administrationMethods = []
}: AddVaccinationRecordModalProps) => {
  const [formData, setFormData] = useState<VaccinationRecordFormData>({
    farm_id: farmId,
    flock_id: flockId,
    poultry_vaccine_id: 0,
    poultry_vaccine_inventory_id: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    administered_by: "",
    dosage: 0,
    dosage_unit: "",
    quantity: 0,
    notes: "",
    administration_method_id: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filteredInventories, setFilteredInventories] = useState<PoultryVaccineInventory[]>([])

  // Filter vaccine inventories based on selected vaccine
  useEffect(() => {
    if (formData.poultry_vaccine_id) {
      const filtered = vaccineInventories.filter(
        inv => inv.poultry_vaccine_product_id === formData.poultry_vaccine_id
      )
      setFilteredInventories(filtered)
      
      // Reset vaccine inventory selection if current selection is no longer valid
      if (formData.poultry_vaccine_inventory_id && 
          !filtered.find(inv => inv.id === formData.poultry_vaccine_inventory_id)) {
        setFormData(prev => ({ ...prev, poultry_vaccine_inventory_id: 0 }))
      }
    } else {
      setFilteredInventories([])
    }
  }, [formData.poultry_vaccine_id, vaccineInventories])

  const handleInputChange = (field: keyof VaccinationRecordFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.poultry_vaccine_id || !formData.poultry_vaccine_inventory_id || 
        !formData.administered_by || !formData.administration_method_id) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error("Error adding vaccination record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      farm_id: farmId,
      flock_id: flockId,
      poultry_vaccine_id: 0,
      poultry_vaccine_inventory_id: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      administered_by: "",
      dosage: 0,
      dosage_unit: "",
      quantity: 0,
      notes: "",
      administration_method_id: 0,
    })
    setSelectedDate(new Date())
    setIsSubmitting(false)
    onClose()
  }

  const selectedInventory = filteredInventories.find(inv => inv.id === formData.poultry_vaccine_inventory_id)
  const availableQuantity = selectedInventory ? Number(selectedInventory.quantity) : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vaccination Record</DialogTitle>
          <DialogDescription>
            Record a new vaccination administered to the flock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Vaccine Selection */}
            <div>
              <Label htmlFor="vaccine">Vaccine *</Label>
              <Select 
                value={formData.poultry_vaccine_id.toString()} 
                onValueChange={(value) => handleInputChange('poultry_vaccine_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine..." />
                </SelectTrigger>
                <SelectContent>
                  {vaccines.map((vaccine) => (
                    <SelectItem key={vaccine.id} value={vaccine.id.toString()}>
                      {vaccine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vaccine Inventory Selection */}
            <div>
              <Label htmlFor="inventory">Vaccine Inventory *</Label>
              <Select 
                value={formData.poultry_vaccine_inventory_id.toString()} 
                onValueChange={(value) => handleInputChange('poultry_vaccine_inventory_id', parseInt(value))}
                disabled={!formData.poultry_vaccine_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredInventories.map((inventory) => (
                    <SelectItem key={inventory.id} value={inventory.id.toString()}>
                      Batch: {inventory.batch_number} (Available: {inventory.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Administered By */}
            <div>
              <Label htmlFor="administered_by">Administered By *</Label>
              <Input
                id="administered_by"
                value={formData.administered_by}
                onChange={(e) => handleInputChange('administered_by', e.target.value)}
                placeholder="Name of person who administered"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Dosage */}
            <div>
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                type="number"
                min="0"
                step="0.01"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
              />
            </div>

            {/* Dosage Unit */}
            <div>
              <Label htmlFor="dosage_unit">Dosage Unit</Label>
              <Input
                id="dosage_unit"
                value={formData.dosage_unit}
                onChange={(e) => handleInputChange('dosage_unit', e.target.value)}
                placeholder="ml, drops, etc."
              />
            </div>

            {/* Quantity Used */}
            <div>
              <Label htmlFor="quantity">Quantity Used *</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                max={availableQuantity}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                required
              />
              {selectedInventory && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {availableQuantity} units
                </p>
              )}
            </div>
          </div>

          {/* Administration Method */}
          <div>
            <Label htmlFor="method">Administration Method *</Label>
            <Select 
              value={formData.administration_method_id.toString()} 
              onValueChange={(value) => handleInputChange('administration_method_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select administration method..." />
              </SelectTrigger>
              <SelectContent>
                {administrationMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or observations..."
              rows={3}
            />
          </div>

          {/* Cost Calculation Info */}
          {selectedInventory && formData.quantity > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Estimated Cost: {Naira}{formatCurrency((Number(selectedInventory.unit_cost) || 0) * formData.quantity)}
              </p>
              <p className="text-xs text-gray-500">
                Unit Cost: {Naira}{formatCurrency(Number(selectedInventory.unit_cost) || 0)} × Quantity: {formData.quantity}
              </p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Vaccination Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddVaccinationRecordModal
export type { VaccinationRecordFormData }
