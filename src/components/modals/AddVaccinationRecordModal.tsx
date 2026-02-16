import { useState, useEffect } from "react"
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
  Syringe,
  User,
  Beaker,
  Package,
  StickyNote,
  DollarSign,
  ChevronDown,
  ChevronUp
} from "lucide-react"
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
  const [showCalendar, setShowCalendar] = useState(false)

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
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      setSelectedDate(validDate)
      setFormData(prev => ({ ...prev, date: format(validDate, "yyyy-MM-dd") }))
      setShowCalendar(false)
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
    setShowCalendar(false)
    onClose()
  }

  const selectedInventory = filteredInventories.find(inv => inv.id === formData.poultry_vaccine_inventory_id)
  const availableQuantity = selectedInventory ? Number(selectedInventory.quantity) : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Vaccination Record</DialogTitle>
            <DialogDescription className="text-teal-100">
              Record a new vaccination administered to the flock.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Vaccine Selection Section ── */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Syringe className="h-4 w-4 text-teal-500" />
              Vaccine Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Syringe className="h-3.5 w-3.5 text-teal-400" />
                  Vaccine *
                </Label>
                <Select 
                  value={formData.poultry_vaccine_id.toString()} 
                  onValueChange={(value) => handleInputChange('poultry_vaccine_id', parseInt(value))}
                >
                  <SelectTrigger className="h-9 text-sm">
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

              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-teal-400" />
                  Vaccine Inventory *
                </Label>
                <Select 
                  value={formData.poultry_vaccine_inventory_id.toString()} 
                  onValueChange={(value) => handleInputChange('poultry_vaccine_inventory_id', parseInt(value))}
                  disabled={!formData.poultry_vaccine_id}
                >
                  <SelectTrigger className="h-9 text-sm">
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
          </div>

          {/* ── Date & Administration Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Date &amp; Administration
            </h3>

            {/* Inline Calendar */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                Date *
              </Label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-gray-300",
                  showCalendar && "border-teal-500 ring-2 ring-teal-100"
                )}
              >
                <span className="text-gray-900 font-medium">
                  {format(new Date(formData.date + 'T12:00:00'), "EEEE, MMMM d, yyyy")}
                </span>
                {showCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>
              {showCalendar && (
                <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="administered_by" className="text-xs text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Administered By *
              </Label>
              <Input
                id="administered_by"
                value={formData.administered_by}
                onChange={(e) => handleInputChange('administered_by', e.target.value)}
                placeholder="Name of person who administered"
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* ── Dosage Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-green-500" />
              Dosage &amp; Quantity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dosage" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-green-400" />
                  Dosage
                </Label>
                <Input
                  id="dosage"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dosage_unit" className="text-xs text-gray-600">
                  Dosage Unit
                </Label>
                <Input
                  id="dosage_unit"
                  value={formData.dosage_unit}
                  onChange={(e) => handleInputChange('dosage_unit', e.target.value)}
                  placeholder="ml, drops, etc."
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-green-400" />
                  Quantity Used *
                </Label>
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
                  className="h-9 text-sm"
                />
                {selectedInventory && (
                  <p className="text-xs text-gray-500">Available: {availableQuantity} units</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Administration Method ── */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600 flex items-center gap-1.5">
              <Syringe className="h-3.5 w-3.5 text-teal-400" />
              Administration Method *
            </Label>
            <Select 
              value={formData.administration_method_id.toString()} 
              onValueChange={(value) => handleInputChange('administration_method_id', parseInt(value))}
            >
              <SelectTrigger className="h-9 text-sm">
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

          {/* ── Notes ── */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or observations..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Cost Calculation Info */}
          {selectedInventory && formData.quantity > 0 && (
            <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-semibold text-teal-700">
                  Estimated Cost: {Naira}{formatCurrency((Number(selectedInventory.unit_cost) || 0) * formData.quantity)}
                </p>
              </div>
              <p className="text-xs text-teal-600">
                Unit Cost: {Naira}{formatCurrency(Number(selectedInventory.unit_cost) || 0)} × Quantity: {formData.quantity}
              </p>
            </div>
          )}

          {/* ── Footer ── */}
          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Vaccination Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddVaccinationRecordModal
export type { VaccinationRecordFormData }
