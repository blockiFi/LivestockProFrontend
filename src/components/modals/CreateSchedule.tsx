import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Card } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { CalendarIcon, Edit, Package, Pill, Plus, Shield, Trash2, Wheat, X } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import type { NewScheduleForm, NewScheduleItem } from "@/lib/interfaces"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
const scheduleTypeIcons = {
    medication: <Pill className="h-5 w-5" />,
    vaccination: <Shield className="h-5 w-5" />,
    feeding: <Wheat className="h-5 w-5" />,
  }
  
  const scheduleTypeColors = {
    medication: "bg-purple-100 text-purple-600",
    vaccination: "bg-blue-100 text-blue-600",
    feeding: "bg-green-100 text-green-600",
  }
  

  
const CreateSchedule  =({
    isOpen,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (schedule: NewScheduleForm<any>) => void
  })  => {

    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id || 0)
    const [formData, setFormData] = useState<NewScheduleForm<any>>({
      name: "",
      description: "",
      schedule_type: "medication",
      poultry_type_id: 0,
      farm_id: farmId,
      items: [],
    })
  
    const [currentItem, setCurrentItem] = useState<NewScheduleItem>({
      name: "",
      age_days: 1,
      dose: 1,
      withdrawal_period_days: 0,
      storage_instructions: "",
      description: "",
      quantity: "",
      feeding_times: [],
    })
  
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (formData.items.length === 0) {
        alert("Please add at least one schedule item")
        return
      }
      onSubmit(formData)
      handleClose()
    }
  
    const handleClose = () => {
      setFormData({
        name: "",
        description: "",
        schedule_type: "medication",
        poultry_type_id: 1,
        farm_id: 0,
        items: [],
      })
      setCurrentItem({
        name: "",
        age_days: 1,
        dose: 1,
        withdrawal_period_days: 0,
        storage_instructions: "",
        description: "",
        quantity: "",
        feeding_times: [],
      })
      setIsAddingItem(false)
      setEditingItemIndex(null)
      onClose()
    }
  
    const resetCurrentItem = () => {
      setCurrentItem({
        name: "",
        age_days: 1,
        dose: 1,
        withdrawal_period_days: 0,
        storage_instructions: "",
        description: "",
        quantity: "",
        feeding_times: [],
      })
    }
  
    const addItem = () => {
      if (!currentItem.name || !currentItem.quantity) {
        alert("Please fill in all required fields (Name, Quantity.)")
        return
      }
  
      if (editingItemIndex !== null) {
        // Update existing item
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((item, index) => (index === editingItemIndex ? { ...currentItem } : item)),
        }))
        setEditingItemIndex(null)
      } else {
        // Add new item
        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, { ...currentItem }],
        }))
      }
  
      resetCurrentItem()
      setIsAddingItem(false)
    }
  
    const editItem = (index: number) => {
      setCurrentItem({ ...formData.items[index] })
      setEditingItemIndex(index)
      setIsAddingItem(true)
    }
  
    const removeItem = (index: number) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    }
  
    const cancelItemEdit = () => {
      resetCurrentItem()
      setIsAddingItem(false)
      setEditingItemIndex(null)
    }
  
    const formatDate = (date: Date | undefined) => {
      if (!date) return "Select date"
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
  
    const getTotalCost = () => {
      return formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.cost) || 0), 0).toFixed(2)
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent style={{
            maxWidth: "1280px",
            width: "100%",
            maxHeight: "95vh",   // Add this line
            overflowY: "auto"
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${scheduleTypeColors[formData.schedule_type]}`}>
                {scheduleTypeIcons[formData.schedule_type]}
              </div>
              Create New {formData.schedule_type.charAt(0).toUpperCase() + formData.schedule_type.slice(1)} Schedule
            </DialogTitle>
            <DialogDescription>Create a comprehensive schedule for your poultry flock management</DialogDescription>
          </DialogHeader>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedule-name">Schedule Name *</Label>
                  <Input
                    id="schedule-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter schedule name"
                    required
                  />
                </div>
  
                <div className="flex flex-col gap-2 w-full col-span-1">
                  <Label htmlFor="schedule-type">Schedule Type *</Label>
                  <Select
                    value={formData.schedule_type}
                    onValueChange={(value: "medication" | "vaccination" | "feeding") =>
                      setFormData((prev) => ({ ...prev, schedule_type: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                      <SelectItem value="feeding">Feeding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2 w-full col-span-1">
                  <Label htmlFor="schedule-type">Poultry Type *</Label>
                  <Select
                    value={formData.poultry_type_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, poultry_type_id: Number(value) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Medication</SelectItem>
                      <SelectItem value="2">Vaccination</SelectItem>
                      <SelectItem value="3">Feeding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
              </div>
             
              <div className="mt-4 flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter schedule description"
                  rows={3}
                />
              </div>
            </Card>
  
            {/* Schedule Items */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Schedule Items</h3>
                  <p className="text-sm text-gray-600">
                    Add multiple items to create a comprehensive schedule. Each item represents a specific action at a
                    certain age.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  
                  <Button
                    type="button"
                    onClick={() => {
                      resetCurrentItem()
                      setIsAddingItem(true)
                      setEditingItemIndex(null)
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
  
              {/* Existing Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-900">Added Items ({formData.items.length})</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <Badge variant="outline" className="bg-blue-50">
                              Day {item.age_days}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50">
                              {item.quantity} {formData.schedule_type === "feeding" ? "kg" : "units"}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-50">
                              ${item.cost}
                            </Badge>
                            {formData.schedule_type !== "feeding" && item.withdrawal_period_days > 0 && (
                              <Badge variant="outline" className="bg-orange-50">
                                {item.withdrawal_period_days}d withdrawal
                              </Badge>
                            )}
                          </div>
                          {item.description && <p className="text-sm text-gray-600 mb-1">{item.description}</p>}
                          {item.notes && <p className="text-xs text-gray-500 italic">Note: {item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editItem(index)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Add/Edit Item Form */}
              {isAddingItem && (
                <Card className="p-4 border-2 border-blue-200 bg-blue-50/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-900">
                        {editingItemIndex !== null ? `Edit Item #${editingItemIndex + 1}` : "Add New Item"}
                      </h4>
                      <Button type="button" variant="ghost" size="sm" onClick={cancelItemEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div  className="flex flex-col gap-2">
                        <Label htmlFor="item-name">Item Name *</Label>
                        <Input
                          id="item-name"
                          value={currentItem.name}
                          onChange={(e) => setCurrentItem((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder={`Enter ${formData.schedule_type} name`}
                          required
                        />
                      </div>
  
                      <div  className="flex flex-col gap-2">
                        <Label htmlFor="age-days">Age (Days) *</Label>
                        <Input
                          id="age-days"
                          type="number"
                          value={currentItem.age_days}
                          onChange={(e) =>
                            setCurrentItem((prev) => ({ ...prev, age_days: Number.parseInt(e.target.value) || 1 }))
                          }
                          min="1"
                          required
                        />
                      </div>
  
                     {
                      formData.schedule_type === "feeding" && 
                     (
                      <div  className="flex flex-col gap-2">
                      <Label htmlFor="quantity">
                         Quantity (g)
                      </Label>
                      <Input
                        id="quantity"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem((prev) => ({ ...prev, quantity: e.target.value }))}
                        placeholder={"Enter quantity in g"}
                        required
                      />
                    </div>
                     )
                     }
  
                     
  
                      {formData.schedule_type !== "feeding" && (
                        <>
                          <div  className="flex flex-col gap-2">
                            <Label htmlFor="dose">Dose</Label>
                            <Input
                              id="dose"
                              type="number"
                              value={currentItem.dose}
                              onChange={(e) =>
                                setCurrentItem((prev) => ({ ...prev, dose: Number.parseInt(e.target.value) || 1 }))
                              }
                              min="1"
                            />
                          </div>
  
                          <div  className="flex flex-col gap-2">
                            <Label htmlFor="withdrawal">Withdrawal Period (Days)</Label>
                            <Input
                              id="withdrawal"
                              type="number"
                              value={currentItem.withdrawal_period_days}
                              
                              onChange={(e) =>
                                setCurrentItem((prev) => ({
                                  ...prev,
                                  withdrawal_period_days: Number.parseInt(e.target.value) || 0,
                                }))
                              }
                              min="0"
                            />
                          </div>
                        </>
                      )}
  
                      {formData.schedule_type === "feeding" && (
                        <>
                          <div  className="flex flex-col gap-2">
                            <Label htmlFor="feeding-frequency">Feeding Times & Percentages</Label>
                            {(currentItem.feeding_times || []).map((feeding: { time: string; percentage: number }, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 mb-2">
                                <Input
                                  type="time"
                                  value={feeding.time}
                                  onChange={e => {
                                    const updated = [...(currentItem.feeding_times || [])]
                                    updated[idx] = { ...updated[idx], time: e.target.value }
                                    setCurrentItem(prev => ({ ...prev, feeding_times: updated }))
                                  }}
                                  className="w-28"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={feeding.percentage}
                                  onChange={e => {
                                    const updated = [...(currentItem.feeding_times || [])]
                                    updated[idx] = { ...updated[idx], percentage: Number(e.target.value) }
                                    setCurrentItem(prev => ({ ...prev, feeding_times: updated }))
                                  }}
                                  className="w-20"
                                />
                                <span className="ml-1">%</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...(currentItem.feeding_times || [])]
                                    updated.splice(idx, 1)
                                    setCurrentItem(prev => ({ ...prev, feeding_times: updated }))
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 mt-2"
                              onClick={() => {
                                setCurrentItem(prev => ({
                                  ...prev,
                                  feeding_times: [
                                    ...(prev.feeding_times || []),
                                    { time: "08:00", percentage: 0 },
                                  ],
                                }))
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Feeding Time
                            </Button>
                          </div>
  
                          <div  className="flex flex-col gap-2">
                            <Label htmlFor="feed-type">Feed Type</Label>
                            <Select
                              value={currentItem.feed_type_id?.toString() || ""}
                              onValueChange={(value) => setCurrentItem((prev) => ({ ...prev, feed_type_id: Number(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select feed type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Starter Feed</SelectItem>
                                <SelectItem value="2">Grower Feed</SelectItem>
                                <SelectItem value="3">Finisher Feed</SelectItem>
                                <SelectItem value="4">Layer Feed</SelectItem>
                                <SelectItem value="5">Breeder Feed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
  
                      {formData.schedule_type !== "feeding" && (
                        <div  className="flex flex-col gap-2">
                          <Label htmlFor="vaccine-type">
                            {
                             formData.schedule_type === "medication" ?  "Medication" : "Vaccine"
                            }
                          </Label>
                          <Select

                            value={formData.schedule_type === "medication"
                              ? currentItem.medication_id?.toString() || ""
                              : currentItem.vaccine_id?.toString() || ""}
                            onValueChange={(value: string) =>
                              setCurrentItem((prev) =>
                                formData.schedule_type === "medication"
                                  ? { ...prev, medication_id: Number(value) }
                                  : { ...prev, vaccine_id: Number(value) }
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={formData.schedule_type === "medication"  ? "Select Medication": "Select Vaccine"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Live Vaccine</SelectItem>
                              <SelectItem value="2">Inactivated Vaccine</SelectItem>
                              <SelectItem value="3">Recombinant Vaccine</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
  
                    {
                      formData.schedule_type !== "feeding" && 
                      (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div  className="flex flex-col gap-2">
                              <Label htmlFor="storage">Storage Instructions</Label>
                              <Textarea
                                id="storage"
                                value={currentItem.storage_instructions}
                                onChange={(e) => setCurrentItem((prev) => ({ ...prev, storage_instructions: e.target.value }))}
                                placeholder="Enter storage instructions"
                                rows={2}
                              />
                            </div>
        
                            <div  className="flex flex-col gap-2">
                            <Label htmlFor="item-description">Description</Label>
                            <Textarea
                              id="item-description"
                              value={currentItem.description}
                              onChange={(e) => setCurrentItem((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter item description"
                              rows={2}
                            />
                          </div>
                    </div>
                      )
                    }
  
                    
  
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={cancelItemEdit}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={addItem} className="bg-green-600 hover:bg-green-700">
                        {editingItemIndex !== null ? "Update Item" : "Add Item"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
  
              {/* Empty State */}
              {formData.items.length === 0 && !isAddingItem && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h3>
                  <p className="text-gray-500 mb-4">
                    Add schedule items to define what actions should be taken at specific ages
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      resetCurrentItem()
                      setIsAddingItem(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Item
                  </Button>
                </div>
              )}
            </Card>
  
            <DialogFooter className="flex justify-between">
              <div className="flex items-center gap-4">
                {formData.items.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{formData.items.length}</span> items •
                    <span className="font-medium"> Total: ${getTotalCost()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formData.items.length === 0}>
                  Create Schedule ({formData.items.length} items)
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

export default CreateSchedule
