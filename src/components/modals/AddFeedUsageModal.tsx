import { useState, useEffect, useMemo } from "react"
import { FormField, FormModal, FormSection, FormSummary, ModalFooterActions, formInputClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import type { PoultryFeedUsageRecord, FlockRecord, FeedInventoryType, FeedType } from "@/lib/types"
import { Naira, formatCurrency, cn } from "@/lib/utils"
import { effectiveFeedAgeRange, flockAgeDaysOnDate, formatFeedAgeRange, isFeedTypeAgeAppropriate } from "@/lib/feed-age"
import { format } from "date-fns"
import { Wheat, Package, DollarSign, CalendarIcon, ChevronDown, ChevronUp, AlertTriangle, Scale } from "lucide-react"

interface AddFeedUsageModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (recordData: Omit<PoultryFeedUsageRecord, 'id' | 'created_at' | 'updated_at' | 'feed_inventory' | 'feed_type' | 'flock'>) => Promise<void>
  flock?: FlockRecord
  feedInventories?: FeedInventoryType[]
  feedTypes?: FeedType[]
}

const AddFeedUsageModal = ({ isOpen, onClose, onSubmit, flock, feedInventories, feedTypes }: AddFeedUsageModalProps) => {
  // Ensure we always have arrays, even if undefined or null is passed
  const safeFeedInventories = Array.isArray(feedInventories) ? feedInventories : [];
  const safeFeedTypes = Array.isArray(feedTypes) ? feedTypes : [];

  const [formData, setFormData] = useState({
    farm_id: 0,
    poultry_feed_inventory_id: 0,
    poultry_feed_type_id: 0,
    flock_id: 0,
    quantity: '',
    unit_cost: '',
    created_by: 1, // Will be set from auth context
    usage_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [allowMismatch, setAllowMismatch] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        farm_id: flock?.farm_id || 0,
        poultry_feed_inventory_id: 0,
        poultry_feed_type_id: 0,
        flock_id: flock?.id || 0,
        quantity: '',
        unit_cost: '',
        created_by: 1,
        usage_date: new Date().toISOString().split('T')[0],
      })
      setAllowMismatch(false)
      setErrors({})
    }
  }, [isOpen, flock])

  const allAvailableFeedTypes = useMemo(() => {
    const map = new Map<number, FeedType>()
    safeFeedTypes.forEach((ft) => map.set(ft.id, ft))
    safeFeedInventories.forEach((inv) => {
      if (inv.feed_type) map.set(inv.poultry_feed_type_id, inv.feed_type)
    })
    return Array.from(map.values())
  }, [safeFeedTypes, safeFeedInventories])

  const isFeedTypeMatchingFlock = (ft: FeedType): boolean => {
    if (!flock) return true
    if (flock.poultry_type_id && ft.poultry_type_id) {
      return Number(flock.poultry_type_id) === Number(ft.poultry_type_id)
    }
    if (flock.poultry_type?.name && ft.poultry_type?.name) {
      return flock.poultry_type.name.toLowerCase() === ft.poultry_type.name.toLowerCase()
    }
    return true
  }

  const selectedFeedType = allAvailableFeedTypes.find((ft) => ft.id === formData.poultry_feed_type_id)
  const isPoultryTypeMismatch = Boolean(selectedFeedType && !isFeedTypeMatchingFlock(selectedFeedType))

  const selectedFeedInventory = safeFeedInventories.find((inv) => inv.id === formData.poultry_feed_inventory_id)
  const invFeedType = selectedFeedInventory?.feed_type || (selectedFeedInventory ? allAvailableFeedTypes.find(ft => ft.id === selectedFeedInventory.poultry_feed_type_id) : undefined)
  const isInventoryMismatch = Boolean(invFeedType && !isFeedTypeMatchingFlock(invFeedType))

  const hasMismatch = isPoultryTypeMismatch || isInventoryMismatch

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.poultry_feed_type_id) {
      newErrors.poultry_feed_type_id = "Please select a feed type"
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Please enter a valid quantity"
    }

    if (formData.unit_cost === "" || parseFloat(formData.unit_cost) < 0) {
      newErrors.unit_cost = "Please enter a valid unit cost (0 allowed for overdraft)"
    }

    if (!formData.usage_date) {
      newErrors.usage_date = "Please select a usage date"
    }

    if (hasMismatch && !allowMismatch) {
      newErrors.allow_mismatch = "Confirmation is required to use feed of a different poultry type."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const recordData = {
        ...formData,
        poultry_feed_inventory_id: formData.poultry_feed_inventory_id || (undefined as unknown as number),
        quantity: parseFloat(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost || "0"),
        allow_poultry_type_mismatch: allowMismatch,
      }

      await onSubmit(recordData)
      onClose()
    } catch (error) {
      console.error("Error submitting feed usage record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter available feed inventories by selected feed type
  const availableFeedInventories = safeFeedInventories.filter(
    (inventory) =>
      (!formData.poultry_feed_type_id || inventory.poultry_feed_type_id === formData.poultry_feed_type_id) &&
      inventory.status !== "closed"
  )

  const hasUsableStock = availableFeedInventories.some((inv) => Number(inv.quantity) > 0)
  const willAutoCreate = Boolean(formData.poultry_feed_type_id) && !formData.poultry_feed_inventory_id && !hasUsableStock

  const flockAgeOnUsageDate = useMemo(() => {
    if (!flock?.arrival_date) return null
    return flockAgeDaysOnDate(
      flock.arrival_date,
      flock.arrival_age_days ?? 0,
      formData.usage_date
    )
  }, [flock?.arrival_date, flock?.arrival_age_days, formData.usage_date])

  const ageWarning = useMemo(() => {
    if (!selectedFeedType || flockAgeOnUsageDate == null) return null
    if (isFeedTypeAgeAppropriate(selectedFeedType, flockAgeOnUsageDate)) return null
    const { start, end } = effectiveFeedAgeRange(selectedFeedType)
    const rangeLabel = formatFeedAgeRange(start, end)
    if (!rangeLabel) return null
    return `${selectedFeedType.name} is intended for day ${rangeLabel}; this flock is on day ${flockAgeOnUsageDate}`
  }, [selectedFeedType, flockAgeOnUsageDate])

  // Update unit cost when feed inventory changes
  useEffect(() => {
    if (selectedFeedInventory && selectedFeedInventory.unit_cost) {
      setFormData(prev => ({
        ...prev,
        unit_cost: selectedFeedInventory.unit_cost
      }))
    }
  }, [selectedFeedInventory])

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Add feed usage record"
      description={`Record feed usage for ${flock?.name || 'this flock'}.`}
      icon={Wheat}
      tone="feed"
      size="lg"
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitLabel="Add feed usage record"
          busyLabel="Adding..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={Wheat} title="Feed selection" description="Choose the feed type and, optionally, the stock batch.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Feed type" required error={errors.poultry_feed_type_id}>
            <Select
              value={formData.poultry_feed_type_id.toString()}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  poultry_feed_type_id: parseInt(value),
                  poultry_feed_inventory_id: 0
                }))
                setErrors(prev => ({ ...prev, poultry_feed_type_id: '' }))
              }}
            >
              <SelectTrigger className={formInputClass(!!errors.poultry_feed_type_id)}>
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent>
                {allAvailableFeedTypes.map((feedType) => {
                  const { start, end } = effectiveFeedAgeRange(feedType)
                  const rangeLabel = formatFeedAgeRange(start, end)
                  const matchesFlock = isFeedTypeMatchingFlock(feedType)
                  return (
                    <SelectItem key={feedType.id} value={feedType.id.toString()}>
                      <div>
                        <div className="font-medium flex items-center gap-1.5 flex-wrap">
                          <span>{feedType.name}</span>
                          {!matchesFlock && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                              {feedType.poultry_type?.name || "Other Type"}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{feedType.description}</div>
                        {rangeLabel && (
                          <div className="text-xs text-gray-400">
                            Age: {rangeLabel} days
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Feed inventory (optional)" error={errors.poultry_feed_inventory_id}>
            <Select
              value={formData.poultry_feed_inventory_id ? formData.poultry_feed_inventory_id.toString() : "auto"}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  poultry_feed_inventory_id: value === "auto" ? 0 : parseInt(value),
                  unit_cost: value === "auto" ? prev.unit_cost || "0" : prev.unit_cost,
                }))
                setErrors((prev) => ({ ...prev, poultry_feed_inventory_id: "" }))
              }}
              disabled={!formData.poultry_feed_type_id}
            >
              <SelectTrigger className={formInputClass(!!errors.poultry_feed_inventory_id)}>
                <SelectValue placeholder="Auto-select or create stock">
                  {selectedFeedInventory ? (
                    <span className="font-medium">
                      Batch: {selectedFeedInventory.batch_number} - {selectedFeedInventory.manufacturer}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Auto (create if needed)</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div>
                    <div className="font-medium">Auto-select / create batch</div>
                    <div className="text-sm text-gray-500">
                      Uses available stock, or creates a zero-cost overdraft batch
                    </div>
                  </div>
                </SelectItem>
                {availableFeedInventories.map((inventory) => {
                  const feedType = inventory.feed_type || allAvailableFeedTypes.find(ft => ft.id === inventory.poultry_feed_type_id)
                  const matchesFlock = feedType ? isFeedTypeMatchingFlock(feedType) : true
                  return (
                    <SelectItem key={inventory.id} value={inventory.id.toString()}>
                      <div>
                        <div className="font-medium flex items-center gap-1.5 flex-wrap">
                          <span>Batch: {inventory.batch_number} - {inventory.manufacturer}</span>
                          {!matchesFlock && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                              {feedType?.poultry_type?.name || "Other Type"}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Available: {inventory.quantity} kg | {Naira}
                          {formatCurrency(Number(inventory.unit_cost))}/kg
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {willAutoCreate && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              No stock for this feed type — a zero-cost inventory batch will be created. Update the unit cost
              afterward on the Feed Inventories page.
            </span>
          </div>
        )}

        {hasMismatch && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-900">Poultry Type Mismatch Detected</div>
                <div>
                  This feed (<strong>{selectedFeedType?.name || invFeedType?.name}</strong>) is formulated for{" "}
                  <strong>{selectedFeedType?.poultry_type?.name || invFeedType?.poultry_type?.name || "a different poultry type"}</strong>,
                  but this flock is <strong>{flock?.poultry_type?.name || "another poultry type"}</strong>.
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-amber-950 cursor-pointer pt-2 border-t border-amber-200">
              <input
                type="checkbox"
                checked={allowMismatch}
                onChange={(e) => {
                  setAllowMismatch(e.target.checked)
                  setErrors(prev => ({ ...prev, allow_mismatch: "" }))
                }}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <span>I confirm and permit deducting this feed for this {flock?.poultry_type?.name || "flock"}</span>
            </label>
            {errors.allow_mismatch && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.allow_mismatch}</p>
            )}
          </div>
        )}

        {ageWarning && !hasMismatch && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{ageWarning}</span>
          </div>
        )}
      </FormSection>

      <FormSection step={2} icon={CalendarIcon} title="Usage date" description="When was this feed given to the flock?">
        <FormField label="Date" required error={errors.usage_date}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              formInputClass(!!errors.usage_date),
              "flex w-full items-center justify-between border px-3 text-sm",
              showCalendar && "border-emerald-500 ring-2 ring-emerald-100"
            )}
          >
            <span className="flex items-center gap-2 font-medium text-slate-900">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              {formData.usage_date
                ? format(new Date(formData.usage_date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                : "Pick a date"}
            </span>
            {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={formData.usage_date ? new Date(formData.usage_date + 'T12:00:00') : undefined}
                onSelect={(date) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, usage_date: format(date, 'yyyy-MM-dd') }))
                    setErrors(prev => ({ ...prev, usage_date: '' }))
                    setShowCalendar(false)
                  }
                }}
              />
            </div>
          )}
        </FormField>
      </FormSection>

      <FormSection step={3} icon={DollarSign} title="Quantity & cost" description="How much feed was used and at what cost per kg.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Quantity (kg)" required htmlFor="quantity" error={errors.quantity}>
            <div className="relative">
              <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, quantity: e.target.value }))
                  setErrors(prev => ({ ...prev, quantity: '' }))
                }}
                className={formInputClass(!!errors.quantity, "pl-9")}
                placeholder="Enter quantity in kg"
              />
            </div>
          </FormField>

          <FormField label={`Unit cost (${Naira})`} htmlFor="unit-cost" error={errors.unit_cost}>
            <div className="relative">
              <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="unit-cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, unit_cost: e.target.value }))
                  setErrors(prev => ({ ...prev, unit_cost: '' }))
                }}
                className={formInputClass(!!errors.unit_cost, "pl-9")}
                placeholder="Cost per kg"
              />
            </div>
          </FormField>

          {formData.quantity && formData.unit_cost && (
            <FormSummary
              className="md:col-span-2"
              label="Total cost"
              value={`${Naira}${formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.unit_cost))}`}
            />
          )}
        </div>
      </FormSection>
    </FormModal>
  )
}

export default AddFeedUsageModal
