import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import type { PoultryFeedUsageRecord, FlockRecord, FeedInventoryType, FeedType } from "@/lib/types"
import { Naira, formatCurrency, cn } from "@/lib/utils"
import { effectiveFeedAgeRange, flockAgeDaysOnDate, formatFeedAgeRange, isFeedTypeAgeAppropriate } from "@/lib/feed-age"
import { format } from "date-fns"
import { Wheat, Package, DollarSign, CalendarIcon, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react"

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
      setErrors({})
    }
  }, [isOpen, flock])

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

  // Get selected feed inventory for cost suggestion
  const selectedFeedInventory = safeFeedInventories.find((inv) => inv.id === formData.poultry_feed_inventory_id)

  const selectedFeedType = safeFeedTypes.find((ft) => ft.id === formData.poultry_feed_type_id)

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-lime-600 to-green-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Feed Usage Record</DialogTitle>
            <DialogDescription className="text-lime-100">
              Record feed usage for {flock?.name || 'this flock'}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Feed Selection ── */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Wheat className="h-4 w-4 text-lime-500" />
              Feed Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Feed Type */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Wheat className="h-3.5 w-3.5 text-lime-400" />
                  Feed Type *
                </Label>
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
                  <SelectTrigger className={cn("h-9 text-sm", errors.poultry_feed_type_id && "border-red-500")}>
                    <SelectValue placeholder="Select feed type" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeFeedTypes.map((feedType) => {
                      const { start, end } = effectiveFeedAgeRange(feedType)
                      const rangeLabel = formatFeedAgeRange(start, end)
                      return (
                        <SelectItem key={feedType.id} value={feedType.id.toString()}>
                          <div>
                            <div className="font-medium">{feedType.name}</div>
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
                {errors.poultry_feed_type_id && (
                  <p className="text-xs text-red-600">{errors.poultry_feed_type_id}</p>
                )}
              </div>

              {/* Feed Inventory */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-lime-400" />
                  Feed Inventory (optional)
                </Label>
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
                  <SelectTrigger className={cn("h-9 text-sm", errors.poultry_feed_inventory_id && "border-red-500")}>
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
                    {availableFeedInventories.map((inventory) => (
                      <SelectItem key={inventory.id} value={inventory.id.toString()}>
                        <div>
                          <div className="font-medium">
                            Batch: {inventory.batch_number} - {inventory.manufacturer}
                          </div>
                          <div className="text-sm text-gray-500">
                            Available: {inventory.quantity} kg | {Naira}
                            {formatCurrency(Number(inventory.unit_cost))}/kg
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {willAutoCreate && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      No stock for this feed type — a zero-cost inventory batch will be created. Update the unit cost
                      afterward on the Feed Inventories page.
                    </span>
                  </div>
                )}
              </div>
            </div>
            {ageWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{ageWarning}</span>
              </div>
            )}
          </div>

          {/* ── Usage Date (inline calendar) ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Usage Date
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-gray-300",
                  showCalendar && "border-lime-500 ring-2 ring-lime-100",
                  errors.usage_date && "border-red-500"
                )}
              >
                <span className="text-gray-900 font-medium">
                  {formData.usage_date
                    ? format(new Date(formData.usage_date + 'T12:00:00'), "EEEE, MMMM d, yyyy")
                    : "Pick a date"}
                </span>
                {showCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>
              {showCalendar && (
                <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
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
              {errors.usage_date && (
                <p className="text-xs text-red-600">{errors.usage_date}</p>
              )}
            </div>
          </div>

          {/* ── Quantity & Cost ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Quantity &amp; Cost
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Quantity (kg) *</Label>
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
                  className={cn("h-9 text-sm", errors.quantity && "border-red-500")}
                  placeholder="Enter quantity in kg"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Unit Cost ({Naira})</Label>
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
                  className={cn("h-9 text-sm", errors.unit_cost && "border-red-500")}
                  placeholder="Cost per kg"
                />
                {errors.unit_cost && (
                  <p className="text-xs text-red-600">{errors.unit_cost}</p>
                )}
              </div>
            </div>

            {/* Total Cost Display */}
            {formData.quantity && formData.unit_cost && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-semibold">Total Cost</div>
                <div className="text-lg font-bold text-green-700">
                  {Naira}{formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.unit_cost))}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Feed Usage Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddFeedUsageModal
