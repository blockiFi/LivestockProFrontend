import { useState, useEffect } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "../ui/form-modal"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Add Vaccination Record"
      description="Record a new vaccination administered to the flock."
      icon={Syringe}
      tone="health"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel="Add Vaccination Record"
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={Syringe} title="Vaccine details" description="Choose the vaccine and the stock batch to use.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Vaccine" required>
            <Select
              value={formData.poultry_vaccine_id.toString()}
              onValueChange={(value) => handleInputChange('poultry_vaccine_id', parseInt(value))}
            >
              <SelectTrigger className={formInputClass()}>
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
          </FormField>

          <FormField label="Vaccine Inventory" required>
            <Select
              value={formData.poultry_vaccine_inventory_id.toString()}
              onValueChange={(value) => handleInputChange('poultry_vaccine_inventory_id', parseInt(value))}
              disabled={!formData.poultry_vaccine_id}
            >
              <SelectTrigger className={formInputClass()}>
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
          </FormField>
        </div>
      </FormSection>

      <FormSection step={2} icon={CalendarIcon} title="Date & administration" description="When it was given, by whom and how.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date" required className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                formInputClass(),
                "flex w-full items-center justify-between border px-3 text-sm transition-colors hover:bg-white",
                showCalendar && "border-purple-500 ring-2 ring-purple-100"
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900">
                  {format(new Date(formData.date + 'T12:00:00'), "EEEE, MMMM d, yyyy")}
                </span>
              </span>
              {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {showCalendar && (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                />
              </div>
            )}
          </FormField>

          <FormField label="Administered By" required htmlFor="administered_by">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="administered_by"
                value={formData.administered_by}
                onChange={(e) => handleInputChange('administered_by', e.target.value)}
                placeholder="Name of person who administered"
                required
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Administration Method" required>
            <Select
              value={formData.administration_method_id.toString()}
              onValueChange={(value) => handleInputChange('administration_method_id', parseInt(value))}
            >
              <SelectTrigger className={formInputClass()}>
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
          </FormField>
        </div>
      </FormSection>

      <FormSection step={3} icon={Beaker} title="Dosage & quantity" description="How much was given and drawn from stock.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Dosage" htmlFor="dosage">
            <div className="relative">
              <Beaker className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="dosage"
                type="number"
                min="0"
                step="0.01"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Dosage Unit" htmlFor="dosage_unit">
            <Input
              id="dosage_unit"
              value={formData.dosage_unit}
              onChange={(e) => handleInputChange('dosage_unit', e.target.value)}
              placeholder="ml, drops, etc."
              className={formInputClass()}
            />
          </FormField>

          <FormField
            label="Quantity Used"
            required
            htmlFor="quantity"
            hint={selectedInventory ? `Available: ${availableQuantity} units` : undefined}
          >
            <div className="relative">
              <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>

        {selectedInventory && formData.quantity > 0 && (
          <div className="mt-4 space-y-1">
            <FormSummary
              label={
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimated Cost
                </span>
              }
              value={`${Naira}${formatCurrency((Number(selectedInventory.unit_cost) || 0) * formData.quantity)}`}
            />
            <p className="px-1 text-[11px] text-slate-500">
              Unit Cost: {Naira}{formatCurrency(Number(selectedInventory.unit_cost) || 0)} × Quantity: {formData.quantity}
            </p>
          </div>
        )}
      </FormSection>

      <FormSection icon={StickyNote} title="Notes" description="Any additional observations.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes or observations..."
            rows={3}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  )
}

export default AddVaccinationRecordModal
export type { VaccinationRecordFormData }
