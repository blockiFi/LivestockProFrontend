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
import { Switch } from "../ui/switch"
import {
  CalendarIcon,
  Syringe,
  User,
  Beaker,
  Package,
  StickyNote,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react"
import { cn, Naira, formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import type { vaccine, PoultryVaccineInventory, AdministrationMethod } from "@/lib/types"
import { toast } from "react-toastify"
import { GetToken, createVaccine } from "@/lib/request"
import { usePermissions } from "@/hooks/usePermissions"
import { ACTIONS } from "@/lib/actionPermissions"
import InlineAddCatalogItem, { apiErrorText } from "./InlineAddCatalogItem"

const NEW_VACCINE = "__new__"

/** Does this stock batch belong to the given vaccine? */
const batchIsFor = (inv: PoultryVaccineInventory, vaccineId: number) =>
  inv.product ? Number(inv.product.poultry_vaccine_id) === vaccineId : Number(inv.poultry_vaccine_product_id) === vaccineId

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
  /** null when the vaccine was not taken from inventory (no stock is deducted). */
  poultry_vaccine_inventory_id: number | null
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  quantity: number
  /** Optional cost. When set it is booked as a vaccination expense for the batch. */
  cost?: number | null
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
  // Off = record the vaccination without drawing on (or needing) inventory stock.
  const [useStock, setUseStock] = useState(true)
  const [costInput, setCostInput] = useState("")
  const [addingVaccine, setAddingVaccine] = useState(false)
  // Vaccines added from this form, until the page reloads its list.
  const [addedVaccines, setAddedVaccines] = useState<vaccine[]>([])
  const { canAny } = usePermissions()
  const canAddVaccine = canAny([...ACTIONS.vaccines.create])
  const vaccineOptions = [...vaccines, ...addedVaccines.filter(a => !vaccines.some(v => v.id === a.id))]

  // Filter vaccine inventories based on selected vaccine
  useEffect(() => {
    if (formData.poultry_vaccine_id) {
      const filtered = vaccineInventories.filter(inv => batchIsFor(inv, formData.poultry_vaccine_id))
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

  const handleVaccineChange = (value: string) => {
    // Radix can emit "" while the list changes under it; that is not a user choice.
    if (!value) return
    if (value === NEW_VACCINE) {
      setAddingVaccine(true)
      return
    }
    setAddingVaccine(false)
    const id = parseInt(value)
    handleInputChange('poultry_vaccine_id', id)
    // Nothing of this vaccine in stock: default to recording it without inventory.
    setUseStock(vaccineInventories.some(inv => batchIsFor(inv, id) && Number(inv.quantity) > 0))
  }

  /** Create a vaccine from inside this form and select it. */
  const handleAddVaccine = async (values: Record<string, string>): Promise<string | null> => {
    const token = GetToken()
    if (!token) return "You are signed out. Sign in again."
    const age = values.administration_age ? parseInt(values.administration_age) : undefined
    if (age !== undefined && (!Number.isFinite(age) || age < 1)) return "Age must be 1 day or more"
    const res = await createVaccine(token, farmId, {
      name: values.name,
      description: values.description || undefined,
      administration_age: age,
    })
    if (!res.success || !res.data) return apiErrorText(res.error, "Could not add the vaccine")
    const created = { ...res.data, id: Number(res.data.id) }
    setAddedVaccines(prev => [...prev, created])
    setAddingVaccine(false)
    // A brand-new vaccine has no stock yet.
    setUseStock(false)
    setFormData(prev => ({ ...prev, poultry_vaccine_id: created.id, poultry_vaccine_inventory_id: 0 }))
    return null
  }

  const handleUseStockChange = (on: boolean) => {
    setUseStock(on)
    if (!on) setFormData(prev => ({ ...prev, poultry_vaccine_inventory_id: 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.poultry_vaccine_id || (useStock && !formData.poultry_vaccine_inventory_id) ||
        !formData.administered_by || !formData.administration_method_id) {
      toast.error("Please fill in all required fields")
      return
    }
    if (useStock && selectedInventory && formData.quantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} left in this batch`)
      return
    }
    if (enteredCost !== null && (!Number.isFinite(enteredCost) || enteredCost < 0)) {
      toast.error("Enter a cost of 0 or more, or leave it empty")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        poultry_vaccine_inventory_id: useStock ? formData.poultry_vaccine_inventory_id : null,
        cost: enteredCost,
      })
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
    setUseStock(true)
    setCostInput("")
    setAddingVaccine(false)
    setIsSubmitting(false)
    setShowCalendar(false)
    onClose()
  }

  const selectedInventory = useStock
    ? filteredInventories.find(inv => inv.id === formData.poultry_vaccine_inventory_id)
    : undefined
  const availableQuantity = selectedInventory ? Number(selectedInventory.quantity) : 0
  const stockCost =
    selectedInventory && formData.quantity > 0 && Number(selectedInventory.unit_cost) > 0
      ? Number(selectedInventory.unit_cost) * formData.quantity
      : null
  const enteredCost = costInput.trim() === "" ? null : parseFloat(costInput)

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
      <FormSection
        step={1}
        icon={Syringe}
        title="Vaccine details"
        description={
          useStock
            ? "Choose the vaccine and the stock batch to use."
            : "Choose the vaccine. Nothing will be taken out of inventory."
        }
        action={
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <Switch checked={useStock} onCheckedChange={handleUseStockChange} aria-label="Take from inventory" />
            Take from inventory
          </label>
        }
      >
        <div className={cn("grid grid-cols-1 gap-4", useStock && "sm:grid-cols-2")}>
          <FormField label="Vaccine" required>
            <Select
              value={formData.poultry_vaccine_id ? formData.poultry_vaccine_id.toString() : ""}
              onValueChange={handleVaccineChange}
            >
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select vaccine..." />
              </SelectTrigger>
              <SelectContent>
                {vaccineOptions.map((vaccine) => (
                  <SelectItem key={vaccine.id} value={vaccine.id.toString()}>
                    {vaccine.name}
                  </SelectItem>
                ))}
                {canAddVaccine && (
                  <SelectItem value={NEW_VACCINE} className="border-t border-slate-100 font-medium text-purple-700">
                    + Add a new vaccine
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {canAddVaccine && !addingVaccine && (
              <button
                type="button"
                onClick={() => setAddingVaccine(true)}
                className="text-[11px] font-medium text-purple-700 hover:underline"
              >
                Not in the list? Add it
              </button>
            )}
          </FormField>

          {useStock && (
          <FormField label="Vaccine Inventory" required>
            <Select
              value={(formData.poultry_vaccine_inventory_id ?? 0).toString()}
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
          )}
        </div>
        {addingVaccine && (
          <InlineAddCatalogItem
            noun="vaccine"
            fields={[
              { key: "name", label: "Name", placeholder: "e.g. Gumboro (IBD)", required: true },
              { key: "administration_age", label: "Usual age (days)", placeholder: "Optional", type: "number" },
              { key: "description", label: "Description", placeholder: "Optional" },
            ]}
            onSave={handleAddVaccine}
            onCancel={() => setAddingVaccine(false)}
          />
        )}
        {useStock && formData.poultry_vaccine_id > 0 && filteredInventories.length === 0 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            There is no stock of this vaccine. Add inventory, or turn off “Take from inventory”.
          </p>
        )}
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

      <FormSection
        step={3}
        icon={Beaker}
        title="Dosage & quantity"
        description={useStock ? "How much was given and drawn from stock." : "How much was given. No stock is deducted."}
      >
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
            required={useStock}
            htmlFor="quantity"
            hint={selectedInventory ? `Available: ${availableQuantity} units` : undefined}
          >
            <div className="relative">
              <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="quantity"
                type="number"
                min={0}
                max={selectedInventory ? availableQuantity : undefined}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                required={useStock}
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
              {enteredCost !== null && " · the cost you enter below is used instead"}
            </p>
          </div>
        )}
      </FormSection>

      <FormSection
        step={4}
        icon={Wallet}
        title="Cost"
        description="Optional. A cost entered here is added to this batch's expenses."
      >
        <FormField
          label="Cost"
          htmlFor="cost"
          hint={
            stockCost !== null
              ? `Leave empty to use the stock price: ${Naira}${formatCurrency(stockCost)}`
              : "Leave empty if there was no cost to record."
          }
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {Naira}
            </span>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder={stockCost !== null ? formatCurrency(stockCost) : "e.g. 2500"}
              className={formInputClass(false, "pl-8")}
            />
          </div>
        </FormField>
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
