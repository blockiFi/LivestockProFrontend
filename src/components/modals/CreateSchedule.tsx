import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Card } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Edit, Package, Pill, Plus, Shield, Trash2, Wheat, X } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import type { NewScheduleForm, NewScheduleItem } from "@/lib/interfaces"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { getPoultryTypes, getMedications, getVaccines, getFeedTypes } from "@/lib/request"
import type { PoultryType, Medication, vaccine, FeedType } from "@/lib/types"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Naira } from "@/lib/utils"
import FeedingRangeEditor, { type FeedingRangeDraft } from "@/components/poultry/schedules/FeedingRangeEditor"
import { DEFAULT_FEEDING_TIMES, formatFeedingDayRange, normalizeFeedingTimesForUi, validateFeedingRanges } from "@/lib/feeding-range"
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
    isLoading = false,
  }: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (schedule: NewScheduleForm<any>) => void
    isLoading?: boolean
  })  => {

    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id || 0)
    const token = useSelector((state: RootState) => state.authentication.token)
    const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>([])
    const [medications, setMedications] = useState<Medication[]>([])
    const [vaccines, setVaccines] = useState<vaccine[]>([])
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([])
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
      is_recurring: false,
      interval_days: null,
      dose: 1,
      withdrawal_period_days: 0,
      storage_instructions: "",
      description: "",
      quantity: "",
      feeding_times: [],
    })
  
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
    /** Feeding entry mode: classic per-day vs flexible ranges. Default daily. */
    const [feedingEntryMode, setFeedingEntryMode] = useState<"daily" | "range">("daily")
    
    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<{
      isOpen: boolean;
      title: string;
      description: string;
      type: "success" | "error" | "warning" | "info";
    }>({
      isOpen: false,
      title: "",
      description: "",
      type: "info"
    });

    // Load data when modal opens
    useEffect(() => {
      if (isOpen && token && farmId) {
        const loadData = async () => {
          try {
            const [poultryTypesRes, medicationsRes, vaccinesRes] = await Promise.all([
              getPoultryTypes(token, farmId),
              getMedications(token, farmId),
              getVaccines(token, farmId)
            ])
            
            if (poultryTypesRes.success && poultryTypesRes.data) {
              setPoultryTypes(poultryTypesRes.data)
            }
            if (medicationsRes.success && medicationsRes.data) {
              setMedications(medicationsRes.data)
            }
            if (vaccinesRes.success && vaccinesRes.data) {
              setVaccines(vaccinesRes.data)
            }
          } catch (error) {
            console.error("Error loading data:", error)
          }
        }
        loadData()
      }
    }, [isOpen, token, farmId])

    // Load feed types when poultry type changes
    const loadFeedTypes = async (poultryTypeId: number) => {
      if (token && farmId && poultryTypeId > 0) {
        try {
          const response = await getFeedTypes(token, farmId, poultryTypeId)
          if (response.success && response.data) {
            setFeedTypes(response.data)
          }
        } catch (error) {
          console.error("Error loading feed types:", error)
        }
      }
    }

    // Load feed types when schedule type changes to feeding
    useEffect(() => {
      if (formData.schedule_type === "feeding" && formData.poultry_type_id > 0) {
        loadFeedTypes(formData.poultry_type_id)
      }
    }, [formData.schedule_type, formData.poultry_type_id])
  
    const validateForm = () => {
      const errors: string[] = []
      
      // Basic form validation
      if (!formData.name?.trim()) {
        errors.push("Schedule name is required")
      }
      
      if (!formData.poultry_type_id || formData.poultry_type_id === 0) {
        errors.push("Poultry type selection is required")
      }
      
      if (formData.items.length === 0) {
        errors.push("At least one schedule item is required")
        return errors
      }

      if (formData.schedule_type === "feeding") {
        if (feedingEntryMode === "range") {
          const normalized = formData.items.map((item: any, i: number) => ({
            id: i,
            start_day: Number(item.start_day ?? item.age_days ?? 1),
            end_day: item.open_ended
              ? null
              : item.end_day != null
                ? Number(item.end_day)
                : Number(item.start_day ?? item.age_days ?? 1),
          }))
          const check = validateFeedingRanges(normalized)
          errors.push(...check.errors)

          formData.items.forEach((item: any, index: number) => {
            if (!item.feed_type_id) {
              errors.push(`Range ${index + 1}: Feed type is required`)
            }
            if (!item.quantity || Number(item.quantity) <= 0) {
              errors.push(`Range ${index + 1}: Quantity (g/bird/day) is required`)
            }
            const times = item.feeding_times || []
            if (times.length === 0) {
              errors.push(`Range ${index + 1}: At least one feeding time is required`)
            } else {
              const total = times.reduce((s: number, ft: any) => s + Number(ft.percentage || 0), 0)
              if (Math.abs(total - 100) > 0.01) {
                errors.push(`Range ${index + 1}: Feeding time percentages must total 100%`)
              }
            }
          })
          return errors
        }

        // Daily mode: one rate per placement day
        formData.items.forEach((item: any, index: number) => {
          const day = Number(item.start_day ?? item.age_days ?? 0)
          if (day < 1) {
            errors.push(`Item ${index + 1}: Feeding day must be at least 1`)
          }
          if (!item.feed_type_id) {
            errors.push(`Item ${index + 1}: Feed type is required`)
          }
          if (!item.quantity || Number(item.quantity) <= 0) {
            errors.push(`Item ${index + 1}: Quantity (g/bird/day) is required`)
          }
          const times = item.feeding_times || []
          if (times.length === 0) {
            errors.push(`Item ${index + 1}: At least one feeding time is required`)
          } else {
            const total = times.reduce((s: number, ft: any) => s + Number(ft.percentage || 0), 0)
            if (Math.abs(total - 100) > 0.01) {
              errors.push(`Item ${index + 1}: Feeding time percentages must total 100%`)
            }
          }
        })
        const dailyNormalized = formData.items.map((item: any, i: number) => {
          const day = Number(item.start_day ?? item.age_days ?? 1)
          return { id: i, start_day: day, end_day: day }
        })
        errors.push(...validateFeedingRanges(dailyNormalized).errors)
        return errors
      }
      
      // Validate each item (med/vac)
      formData.items.forEach((item, index) => {
        const itemErrors: string[] = []
        
        if (!item.name?.trim()) {
          itemErrors.push(`Item ${index + 1}: Name is required`)
        }
        
        if (item.age_days < 1) {
          itemErrors.push(`Item ${index + 1}: Age must be at least 1 day`)
        }
        
        if (formData.schedule_type === "medication") {
          if (!item.medication_id) {
            itemErrors.push(`Item ${index + 1}: Medication selection is required`)
          }
        } else if (formData.schedule_type === "vaccination") {
          if (!item.vaccine_id) {
            itemErrors.push(`Item ${index + 1}: Vaccine selection is required`)
          }
        }
        
        errors.push(...itemErrors)
      })
      
      return errors
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      const validationErrors = validateForm()
      
      if (validationErrors.length > 0) {
        showAlert(
          "Form Validation Failed", 
          `Please fix the following issues:\n• ${validationErrors.join('\n• ')}`, 
          "warning"
        )
        return
      }

      // Normalize daily feeding items to start_day = end_day before submit
      if (formData.schedule_type === "feeding" && feedingEntryMode === "daily") {
        onSubmit({
          ...formData,
          items: formData.items.map((item: any) => {
            const day = Number(item.start_day ?? item.age_days ?? 1)
            return {
              ...item,
              age_days: day,
              start_day: day,
              end_day: day,
              open_ended: false,
              feeding_day: day,
              feeding_times: normalizeFeedingTimesForUi(item.feeding_times),
            }
          }),
        })
        return
      }

      if (formData.schedule_type === "feeding" && feedingEntryMode === "range") {
        onSubmit({
          ...formData,
          items: formData.items.map((item: any) => ({
            ...item,
            feeding_times: normalizeFeedingTimesForUi(item.feeding_times),
          })),
        })
        return
      }
      
      onSubmit(formData)
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
        is_recurring: false,
        interval_days: null,
        dose: 1,
        withdrawal_period_days: 0,
        storage_instructions: "",
        description: "",
        quantity: "",
        feeding_times: [],
        feed_type_id: undefined,
      })
      setIsAddingItem(false)
      setEditingItemIndex(null)
      setFeedingEntryMode("daily")
      onClose()
    }
  
    const resetCurrentItem = () => {
      setCurrentItem({
        name: "",
        age_days: 1,
        is_recurring: false,
        interval_days: null,
        dose: 1,
        withdrawal_period_days: 0,
        storage_instructions: "",
        description: "",
        quantity: "",
        feeding_times: [],
      })
    }
  
    const validateScheduleItem = () => {
      const errors: string[] = []
      
      // Common required fields for all schedule types
      if (formData.schedule_type !== "feeding" && !currentItem.name?.trim()) {
        errors.push("Item name is required")
      }
      
      
      
      if (currentItem.age_days < 1) {
        errors.push("Age must be at least 1 day")
      }

      if (formData.schedule_type !== "feeding" && currentItem.is_recurring) {
        if (!currentItem.interval_days || currentItem.interval_days < 1) {
          errors.push("Repeat interval must be at least 1 day for recurrent items")
        }
      }
      
      // Schedule type specific validations
      if (formData.schedule_type === "feeding") {
        // Feeding specific validations
        if (!currentItem.feed_type_id) {
          errors.push("Feed type is required for feeding schedules")
        }
        
        if (!currentItem.quantity || isNaN(Number(currentItem.quantity)) || Number(currentItem.quantity) <= 0) {
          errors.push("Valid quantity in grams is required for feeding schedules")
        }
        
        // Check if feeding times are provided and valid
        if (!currentItem.feeding_times || currentItem.feeding_times.length === 0) {
          errors.push("At least one feeding time is required for feeding schedules")
        } else {
          const totalPercentage = currentItem.feeding_times.reduce((sum, ft) => sum + (ft.percentage || 0), 0)
          if (Math.abs(totalPercentage - 100) > 0.01) {
            errors.push("Feeding time percentages must total 100%")
          }
          
          // Check for valid times
          const invalidTimes = currentItem.feeding_times.some(ft => 
            !ft.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(ft.time)
          )
          if (invalidTimes) {
            errors.push("All feeding times must be in valid HH:MM format")
          }
        }
      } else if (formData.schedule_type === "medication") {
        // Medication specific validations
        if (!currentItem.medication_id) {
          errors.push("Medication selection is required for medication schedules")
        }
        
        if (!currentItem.dose || currentItem.dose < 1) {
          errors.push("Valid dose is required for medication schedules")
        }
        
        if ((currentItem.withdrawal_period_days || 0) < 0) {
          errors.push("Withdrawal period cannot be negative")
        }
      } else if (formData.schedule_type === "vaccination") {
        // Vaccination specific validations
        if (!currentItem.vaccine_id) {
          errors.push("Vaccine selection is required for vaccination schedules")
        }
        
        if (!currentItem.dose || currentItem.dose < 1) {
          errors.push("Valid dose is required for vaccination schedules")
        }
        
        if ((currentItem.withdrawal_period_days || 0) < 0) {
          errors.push("Withdrawal period cannot be negative")
        }
      }
      
      return errors
    }

    const updateCurrentFeedingTime = (
      timeIdx: number,
      patch: Partial<{ time: string; percentage: number }>
    ) => {
      setCurrentItem((prev) => {
        const times = normalizeFeedingTimesForUi(prev.feeding_times)
        const next = [...times]
        next[timeIdx] = {
          ...(next[timeIdx] ?? { time: "08:00", percentage: 0 }),
          ...patch,
        }
        return { ...prev, feeding_times: next }
      })
    }

    const removeCurrentFeedingTime = (timeIdx: number) => {
      setCurrentItem((prev) => {
        const times = normalizeFeedingTimesForUi(prev.feeding_times)
        return { ...prev, feeding_times: times.filter((_, i) => i !== timeIdx) }
      })
    }
  
    const addItem = () => {
      const validationErrors = validateScheduleItem()
      
      if (validationErrors.length > 0) {
        showAlert(
          "Validation Failed", 
          `Please fix the following issues:\n• ${validationErrors.join('\n• ')}`, 
          "warning"
        )
        return
      }
  
      if (editingItemIndex !== null) {
        // Update existing item
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((item, index) => {
            if (index !== editingItemIndex) return item
            if (prev.schedule_type === "feeding" && feedingEntryMode === "daily") {
              const day = Number(currentItem.age_days) || 1
              return {
                ...currentItem,
                age_days: day,
                start_day: day,
                end_day: day,
                open_ended: false,
                name: currentItem.name?.trim() || `Day ${day}`,
                feeding_times: normalizeFeedingTimesForUi(currentItem.feeding_times),
              }
            }
            return {
              ...currentItem,
              feeding_times:
                prev.schedule_type === "feeding"
                  ? normalizeFeedingTimesForUi(currentItem.feeding_times)
                  : currentItem.feeding_times,
            }
          }),
        }))
        setEditingItemIndex(null)
      } else {
        // Add new item
        setFormData((prev) => {
          let nextItem: any = { ...currentItem }
          if (prev.schedule_type === "feeding" && feedingEntryMode === "daily") {
            const day = Number(currentItem.age_days) || 1
            nextItem = {
              ...currentItem,
              age_days: day,
              start_day: day,
              end_day: day,
              open_ended: false,
              name: currentItem.name?.trim() || `Day ${day}`,
              feeding_times: normalizeFeedingTimesForUi(currentItem.feeding_times),
            }
          } else if (prev.schedule_type === "feeding") {
            nextItem = {
              ...currentItem,
              feeding_times: normalizeFeedingTimesForUi(currentItem.feeding_times),
            }
          }
          return {
            ...prev,
            items: [...prev.items, nextItem],
          }
        })
      }
  
      resetCurrentItem()
      setIsAddingItem(false)
    }
  
    const editItem = (index: number) => {
      const item = formData.items[index]
      setCurrentItem({
        ...item,
        feeding_times: normalizeFeedingTimesForUi(item.feeding_times),
      })
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
  
  
    const getTotalCost = () => {
      return formData.items.reduce((sum, item) => sum + (Number.parseFloat(item.cost) || 0), 0).toFixed(2)
    }

    const getFeedTypeName = (feedTypeId: number | undefined) => {
      if (!feedTypeId) return "No feed type"
      const feedType = feedTypes.find(ft => ft.id === feedTypeId)
      return feedType ? feedType.name : "Unknown feed type"
    }

    const showAlert = (title: string, description: string, type: "success" | "error" | "warning" | "info" = "info") => {
      setAlertDialog({
        isOpen: true,
        title,
        description,
        type
      });
    };

    const closeAlert = () => {
      setAlertDialog(prev => ({ ...prev, isOpen: false }));
    };

    const isFieldValid = (fieldName: string, value: any) => {
      switch (fieldName) {
        case 'name':
          return value?.trim() && value.trim().length > 0
        case 'quantity':
          return value?.trim() && !isNaN(Number(value)) && Number(value) > 0
        case 'age_days':
          return value && value >= 1
        case 'feed_type_id':
          return formData.schedule_type === "feeding" ? value && value > 0 : true
        case 'medication_id':
          return formData.schedule_type === "medication" ? value && value > 0 : true
        case 'vaccine_id':
          return formData.schedule_type === "vaccination" ? value && value > 0 : true
        case 'dose':
          return formData.schedule_type !== "feeding" ? value && value >= 1 : true
        case 'feeding_times':
          if (formData.schedule_type === "feeding") {
            return value && value.length > 0 && 
                   Math.abs(value.reduce((sum: number, ft: any) => sum + (ft.percentage || 0), 0) - 100) < 0.01
          }
          return true
        default:
          return true
      }
    };
  
    const switchFeedingEntryMode = (mode: "daily" | "range") => {
      if (mode === feedingEntryMode) return
      if (formData.items.length > 0) {
        const ok = window.confirm(
          "Switching between Daily and Range clears the current feeding items. Continue?"
        )
        if (!ok) return
        setFormData((prev) => ({ ...prev, items: [] }))
      }
      setFeedingEntryMode(mode)
      setIsAddingItem(false)
      setEditingItemIndex(null)
      resetCurrentItem()
    }

    const showItemEditor =
      formData.schedule_type !== "feeding" || feedingEntryMode === "daily"
  
    return (
      <>
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
                    onValueChange={(value: "medication" | "vaccination" | "feeding") => {
                      setFormData((prev) => ({ ...prev, schedule_type: value }))
                      // Load feed types if switching to feeding and poultry type is selected
                      if (value === "feeding" && formData.poultry_type_id > 0) {
                        loadFeedTypes(formData.poultry_type_id)
                      }
                    }}
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
                    onValueChange={(value: string) => {
                      const poultryTypeId = Number(value)
                      setFormData((prev) => ({ ...prev, poultry_type_id: poultryTypeId }))
                      // Load feed types when poultry type changes
                      if (formData.schedule_type === "feeding") {
                        loadFeedTypes(poultryTypeId)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select poultry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {poultryTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
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
              {formData.schedule_type === "feeding" && (
                <div className="mb-4 space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Entry mode</Label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={feedingEntryMode === "daily" ? "default" : "ghost"}
                      className="h-8"
                      onClick={() => switchFeedingEntryMode("daily")}
                    >
                      Daily (per day)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={feedingEntryMode === "range" ? "default" : "ghost"}
                      className="h-8"
                      onClick={() => switchFeedingEntryMode("range")}
                    >
                      Day ranges
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {feedingEntryMode === "daily"
                      ? "Set a feed rate for each placement day (Day 1, Day 2, …)."
                      : "Set one rate across a span of days, including open-ended ranges."}
                  </p>
                </div>
              )}

              {formData.schedule_type === "feeding" && feedingEntryMode === "range" ? (
                <FeedingRangeEditor
                  ranges={formData.items.map((item: any, i: number) => ({
                    __localId: `item-${i}`,
                    feed_type_id: item.feed_type_id ?? null,
                    start_day: Number(item.start_day ?? item.age_days ?? 1),
                    end_day: item.open_ended
                      ? null
                      : item.end_day != null
                        ? Number(item.end_day)
                        : Number(item.start_day ?? item.age_days ?? 1),
                    open_ended: Boolean(item.open_ended),
                    quantity: item.quantity ?? 40,
                    feeding_times: normalizeFeedingTimesForUi(item.feeding_times),
                  }))}
                  feedTypes={feedTypes}
                  onChange={(ranges: FeedingRangeDraft[]) => {
                    setFormData((prev) => ({
                      ...prev,
                      items: ranges.map((r) => ({
                        name: formatFeedingDayRange(
                          r.start_day,
                          r.open_ended ? null : r.end_day
                        ),
                        age_days: Number(r.start_day) || 1,
                        start_day: Number(r.start_day) || 1,
                        end_day: r.open_ended ? null : Number(r.end_day ?? r.start_day),
                        open_ended: Boolean(r.open_ended),
                        description: "",
                        quantity: String(r.quantity ?? 0),
                        feed_type_id: r.feed_type_id ?? undefined,
                        feeding_times: normalizeFeedingTimesForUi(r.feeding_times),
                      })),
                    }))
                  }}
                />
              ) : (
              <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Schedule Items</h3>
                  <p className="text-sm text-gray-600">
                    {formData.schedule_type === "feeding"
                      ? "Add one feeding rate per placement day."
                      : "Add multiple items to create a comprehensive schedule. Each item represents a specific action at a certain age."}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  
                  <Button
                    type="button"
                    onClick={() => {
                      resetCurrentItem()
                      if (formData.schedule_type === "feeding") {
                        setCurrentItem((prev) => ({
                          ...prev,
                          feeding_times: DEFAULT_FEEDING_TIMES.map((t) => ({ ...t })),
                          quantity: "40",
                        }))
                      }
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
                              Day {item.age_days ?? item.start_day}
                            </Badge>
                            {formData.schedule_type !== "feeding" && item.is_recurring && (
                              <Badge variant="outline" className="bg-violet-50">
                                Every {item.interval_days ?? 1}d
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-green-50">
                              {item.quantity} {formData.schedule_type === "feeding" ? "g" : "units"}
                            </Badge>
                            {formData.schedule_type === "feeding" && item.feed_type_id && (
                              <Badge variant="outline" className="bg-yellow-50">
                                {getFeedTypeName(item.feed_type_id)}
                              </Badge>
                            )}
                            
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
              </>
              )}
  
              {/* Add/Edit Item Form (med/vac, or feeding daily mode) */}
              {showItemEditor && isAddingItem && (
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
                          className={!isFieldValid('name', currentItem.name) ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {!isFieldValid('name', currentItem.name) && currentItem.name && (
                          <p className="text-xs text-red-500">Item name is required</p>
                        )}
                      </div>
  
                      <div  className="flex flex-col gap-2">
                        <Label htmlFor="age-days">
                          {formData.schedule_type === "feeding" ? "Feeding Day *" : "Age (Days) *"}
                        </Label>
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

                      {formData.schedule_type !== "feeding" && (
                        <>
                          <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(currentItem.is_recurring)}
                                onChange={(e) =>
                                  setCurrentItem((prev) => ({
                                    ...prev,
                                    is_recurring: e.target.checked,
                                    interval_days: e.target.checked ? prev.interval_days ?? 7 : null,
                                  }))
                                }
                              />
                              Recurrent until flock expected end date
                            </label>
                          </div>
                          {currentItem.is_recurring && (
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="interval-days">Repeat every (days) *</Label>
                              <Input
                                id="interval-days"
                                type="number"
                                min="1"
                                value={currentItem.interval_days ?? ""}
                                onChange={(e) =>
                                  setCurrentItem((prev) => ({
                                    ...prev,
                                    interval_days: Number.parseInt(e.target.value) || 1,
                                  }))
                                }
                                required
                              />
                            </div>
                          )}
                        </>
                      )}
  
                     {
                      formData.schedule_type === "feeding" && 
                     (
                      <div  className="flex flex-col gap-2">
                      <Label htmlFor="quantity">
                         Quantity (g) *
                      </Label>
                      <Input
                        id="quantity"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem((prev) => ({ ...prev, quantity: e.target.value }))}
                        placeholder={"Enter quantity in g"}
                        required
                        className={!isFieldValid('quantity', currentItem.quantity) ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {!isFieldValid('quantity', currentItem.quantity) && currentItem.quantity && (
                        <p className="text-xs text-red-500">Valid quantity in grams is required</p>
                      )}
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
                            {(normalizeFeedingTimesForUi(currentItem.feeding_times)).map((feeding, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-2">
                                <Input
                                  type="time"
                                  value={feeding.time}
                                  onChange={(e) => updateCurrentFeedingTime(idx, { time: e.target.value })}
                                  className="w-28"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={feeding.percentage}
                                  onChange={(e) =>
                                    updateCurrentFeedingTime(idx, {
                                      percentage: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20"
                                />
                                <span className="ml-1">%</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCurrentFeedingTime(idx)}
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
                            <Label htmlFor="feed-type">Feed Type *</Label>
                            <Select
                              value={currentItem.feed_type_id?.toString() || ""}
                              onValueChange={(value) => setCurrentItem((prev) => ({ ...prev, feed_type_id: Number(value) }))}
                            >
                              <SelectTrigger className={!isFieldValid('feed_type_id', currentItem.feed_type_id) ? 'border-red-500 focus:border-red-500' : ''}>
                                <SelectValue placeholder="Select feed type" />
                              </SelectTrigger>
                              <SelectContent>
                                {feedTypes.map((feedType) => (
                                  <SelectItem key={feedType.id} value={feedType.id.toString()}>
                                    {feedType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!isFieldValid('feed_type_id', currentItem.feed_type_id) && currentItem.feed_type_id !== undefined && (
                              <p className="text-xs text-red-500">Feed type selection is required</p>
                            )}
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
                              {formData.schedule_type === "medication" 
                                ? medications.map((medication) => (
                                    <SelectItem key={medication.id} value={medication.id.toString()}>
                                      {medication.name}
                                    </SelectItem>
                                  ))
                                : vaccines.map((vaccine) => (
                                    <SelectItem key={vaccine.id} value={vaccine.id.toString()}>
                                      {vaccine.name}
                                    </SelectItem>
                                  ))
                              }
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
              {showItemEditor && formData.items.length === 0 && !isAddingItem && (
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
                    <span className="font-medium"> Total: {Naira}{getTotalCost()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formData.items.length === 0 || isLoading}>
                  {isLoading ? "Creating..." : `Create Schedule (${formData.items.length} items)`}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={closeAlert}
        title={alertDialog.title}
        description={alertDialog.description}
        type={alertDialog.type}
      />
      </>
    )
  }

export default CreateSchedule
