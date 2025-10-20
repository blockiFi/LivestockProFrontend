import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PoultryFeedUsageRecord, FlockRecord, FeedInventoryType, FeedType } from "@/lib/types"

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
    
    if (!formData.poultry_feed_inventory_id) {
      newErrors.poultry_feed_inventory_id = "Please select a feed inventory"
    }
    
    if (!formData.poultry_feed_type_id) {
      newErrors.poultry_feed_type_id = "Please select a feed type"
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Please enter a valid quantity"
    }
    
    if (!formData.unit_cost || parseFloat(formData.unit_cost) <= 0) {
      newErrors.unit_cost = "Please enter a valid unit cost"
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
        quantity: parseFloat(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost),
      }
      
      await onSubmit(recordData)
      onClose() // Close modal on successful submission
    } catch (error) {
      console.error("Error submitting feed usage record:", error)
      // Error will be handled by parent component and shown via toast
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter available feed inventories by selected feed type
  const availableFeedInventories = safeFeedInventories.filter(inventory => 
    !formData.poultry_feed_type_id || inventory.poultry_feed_type_id === formData.poultry_feed_type_id
  )

  // Get selected feed inventory for cost suggestion
  const selectedFeedInventory = safeFeedInventories.find(inv => inv.id === formData.poultry_feed_inventory_id)

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Feed Usage Record</DialogTitle>
          <DialogDescription>
            Record feed usage for {flock?.name || 'this flock'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feed Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="feed-type">Feed Type</Label>
              <Select
                value={formData.poultry_feed_type_id.toString()}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    poultry_feed_type_id: parseInt(value),
                    poultry_feed_inventory_id: 0 // Reset inventory selection
                  }))
                  setErrors(prev => ({ ...prev, poultry_feed_type_id: '' }))
                }}
              >
                <SelectTrigger className={errors.poultry_feed_type_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select feed type" />
                </SelectTrigger>
                <SelectContent>
                  {safeFeedTypes.map((feedType) => (
                    <SelectItem key={feedType.id} value={feedType.id.toString()}>
                      <div>
                        <div className="font-medium">{feedType.name}</div>
                        <div className="text-sm text-gray-500">{feedType.description}</div>
                        {feedType.start_age && feedType.end_age && (
                          <div className="text-xs text-gray-400">
                            Age: {feedType.start_age}-{feedType.end_age} days
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.poultry_feed_type_id && (
                <p className="text-sm text-red-600">{errors.poultry_feed_type_id}</p>
              )}
            </div>

            {/* Feed Inventory Selection */}
            <div className="space-y-2">
              <Label htmlFor="feed-inventory">Feed Inventory</Label>
              <Select
                value={formData.poultry_feed_inventory_id.toString()}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, poultry_feed_inventory_id: parseInt(value) }))
                  setErrors(prev => ({ ...prev, poultry_feed_inventory_id: '' }))
                }}
                disabled={!formData.poultry_feed_type_id}
              >
                <SelectTrigger className={errors.poultry_feed_inventory_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select feed inventory">
                    {selectedFeedInventory && (
                      <span className="font-medium">
                        Batch: {selectedFeedInventory.batch_number} - {selectedFeedInventory.manufacturer}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableFeedInventories.map((inventory) => (
                    <SelectItem key={inventory.id} value={inventory.id.toString()}>
                      <div>
                        <div className="font-medium">
                          Batch: {inventory.batch_number} - {inventory.manufacturer}
                        </div>
                        <div className="text-sm text-gray-500">
                          Available: {inventory.quantity} kg | ${inventory.unit_cost}/kg
                        </div>
                        <div className="text-xs text-gray-400">
                          Expires: {new Date(inventory.expiry_date).toLocaleDateString()}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.poultry_feed_inventory_id && (
                <p className="text-sm text-red-600">{errors.poultry_feed_inventory_id}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (kg)</Label>
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
                className={errors.quantity ? "border-red-500" : ""}
                placeholder="Enter quantity in kg"
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {/* Unit Cost */}
            <div className="space-y-2">
              <Label htmlFor="unit-cost">Unit Cost ($)</Label>
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
                className={errors.unit_cost ? "border-red-500" : ""}
                placeholder="Cost per kg"
              />
              {errors.unit_cost && (
                <p className="text-sm text-red-600">{errors.unit_cost}</p>
              )}
            </div>

            {/* Usage Date */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="usage-date">Usage Date</Label>
              <Input
                id="usage-date"
                type="date"
                value={formData.usage_date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, usage_date: e.target.value }))
                  setErrors(prev => ({ ...prev, usage_date: '' }))
                }}
                className={errors.usage_date ? "border-red-500" : ""}
              />
              {errors.usage_date && (
                <p className="text-sm text-red-600">{errors.usage_date}</p>
              )}
            </div>
          </div>

          {/* Total Cost Display */}
          {formData.quantity && formData.unit_cost && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-lg font-semibold text-green-600">
                ${(parseFloat(formData.quantity) * parseFloat(formData.unit_cost)).toFixed(2)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Feed Usage Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddFeedUsageModal
