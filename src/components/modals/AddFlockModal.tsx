import { useState, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  CalendarIcon,
  Loader2,
  Bird,
  Hash,
  Dna,
  MapPin,
  Package,
  Clock,
  Layers,
  Home,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Pill,
  Syringe,
  Wheat,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFeedingDayRange } from "@/lib/feeding-range"
import { format } from "date-fns"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { PoultryType, PoultryHouse, FlockStage, Schedule, FeedingSchedule, DetailedFlockRecord, FlockRecord } from "@/lib/types"
import { getPoultryTypes, getPoultryHouses, getFlockStages, getSchedules, getFeedingSchedules } from "@/lib/request"

export interface FlockFormData {
  name: string
  breed: string
  source: string
  quantity: number
  arrival_date: string
  arrival_age_days: number
  expected_end_date: string
  poultry_type_id: number
  flock_stage_id: number
  house_id: number
  farm_id: number
  notes: string
  medication_schedule_id: number | null
  vaccination_schedule_id: number | null
  feeding_schedule_id: number | null
}

interface AddFlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (flockData: FlockFormData) => Promise<void>
  editingFlock?: DetailedFlockRecord | FlockRecord | null
}

const emptyFormData = (farmId = 0): FlockFormData => ({
  name: "",
  breed: "",
  source: "",
  quantity: 0,
  arrival_date: "",
  arrival_age_days: 0,
  expected_end_date: "",
  poultry_type_id: 0,
  flock_stage_id: 0,
  house_id: 0,
  farm_id: farmId,
  notes: "",
  medication_schedule_id: null,
  vaccination_schedule_id: null,
  feeding_schedule_id: null,
})

const resolveHousePoultryTypeId = (house: PoultryHouse): number =>
  Number(house.poultry_type_id ?? house.poultry_type?.id ?? 0)

const isHouseUnavailableStatus = (status: string | undefined): boolean => {
  const normalized = (status ?? "").toLowerCase()
  return normalized === "inactive" || normalized === "maintenance"
}

const isHouseVacant = (house: PoultryHouse): boolean => {
  if (typeof house.current_occupancy === "number") {
    return house.current_occupancy <= 0
  }

  return (house.status ?? "").toLowerCase() === "empty"
}

const houseMatchesPoultryType = (house: PoultryHouse, poultryTypeId: number): boolean => {
  const houseTypeId = resolveHousePoultryTypeId(house)
  return houseTypeId > 0 && houseTypeId === Number(poultryTypeId)
}

const isHouseSelectableForFlock = (
  house: PoultryHouse,
  poultryTypeId: number,
  options: { isEditMode: boolean; currentHouseId: number }
): boolean => {
  if (!houseMatchesPoultryType(house, poultryTypeId)) return false
  if (options.isEditMode && house.id === options.currentHouseId) return true
  if (isHouseUnavailableStatus(house.status)) return false

  return isHouseVacant(house)
}

const flockToFormData = (
  flock: DetailedFlockRecord | FlockRecord,
  farmId: number
): FlockFormData => ({
  name: flock.name || "",
  breed: flock.breed || "",
  source: flock.source || "",
  quantity: Number(flock.quantity) || 0,
  arrival_date: flock.arrival_date ? String(flock.arrival_date).slice(0, 10) : "",
  arrival_age_days: Number(flock.arrival_age_days) || 0,
  expected_end_date: flock.expected_end_date ? String(flock.expected_end_date).slice(0, 10) : "",
  poultry_type_id: Number(flock.poultry_type_id || flock.poultry_type?.id) || 0,
  flock_stage_id: Number(flock.flock_stage_id || flock.flock_stage?.id) || 0,
  house_id: Number(flock.house_id || flock.poultry_house?.id) || 0,
  farm_id: Number(flock.farm_id || farmId) || farmId,
  notes: flock.notes || "",
  medication_schedule_id: null,
  vaccination_schedule_id: null,
  feeding_schedule_id: null,
})

const AddFlockModal = ({ isOpen, onClose, onSubmit, editingFlock = null }: AddFlockModalProps) => {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const isEditMode = Boolean(editingFlock)

  const [formData, setFormData] = useState<FlockFormData>(() => emptyFormData(farmId || 0))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warningsConfirmed, setWarningsConfirmed] = useState(false)
  const [showArrivalCalendar, setShowArrivalCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>([])
  const [poultryHouses, setPoultryHouses] = useState<PoultryHouse[]>([])
  const [flockStages, setFlockStages] = useState<FlockStage[]>([])
  const [filteredHouses, setFilteredHouses] = useState<PoultryHouse[]>([])
  const [filteredStages, setFilteredStages] = useState<FlockStage[]>([])

  // Schedule states
  const [medicationSchedules, setMedicationSchedules] = useState<Schedule[]>([])
  const [vaccinationSchedules, setVaccinationSchedules] = useState<Schedule[]>([])
  const [feedingSchedulesList, setFeedingSchedulesList] = useState<FeedingSchedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null)

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!token || !farmId) return

      try {
        const [typesResponse, housesResponse, stagesResponse] = await Promise.all([
          getPoultryTypes(token, farmId),
          getPoultryHouses(token, farmId),
          getFlockStages(token) 
       
        ])
        console.log('getPoultryTypes response:', typesResponse);
        console.log('getPoultryHouses response:', housesResponse);
        console.log('getFlockStages response:', stagesResponse);
        
        // Log the actual data structure
        if (typesResponse.success) {
          console.log('Poultry types data:', typesResponse.data);
          console.log('Is array?', Array.isArray(typesResponse.data));
        }
        if (housesResponse.success) {
          console.log('Poultry houses data:', housesResponse.data);
          console.log('Is array?', Array.isArray(housesResponse.data));
        }
        if (stagesResponse.success) {
          console.log('Flock stages data:', stagesResponse.data);
          console.log('Is array?', Array.isArray(stagesResponse.data));
        }
        if (typesResponse.success) {
          const typesData = Array.isArray(typesResponse.data) ? typesResponse.data : []
          setPoultryTypes(typesData)
        }
        if (housesResponse.success) {
            console.log("poultry houses data in AddFlockModal.tsx:", housesResponse.data);
          const housesData = Array.isArray(housesResponse.data) ? housesResponse.data : []
          setPoultryHouses(housesData)
        }
        if (stagesResponse.success) {
          const stagesData = Array.isArray(stagesResponse.data) ? stagesResponse.data : []
          setFlockStages(stagesData)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        // Initialize with empty arrays on error
        setPoultryTypes([])
        setPoultryHouses([])
        setFlockStages([])
      }
    }

    loadData()
  }, [token, farmId])

  useEffect(() => {
    if (!isOpen) return
    if (editingFlock) {
      setFormData(flockToFormData(editingFlock, farmId || editingFlock.farm_id))
    } else {
      setFormData(emptyFormData(farmId || 0))
    }
    setErrors({})
    setWarningsConfirmed(false)
    setShowArrivalCalendar(false)
    setShowEndCalendar(false)
    setExpandedSchedule(null)
  }, [isOpen, editingFlock, farmId])

  // Filter houses and stages based on selected poultry type
  useEffect(() => {
    if (formData.poultry_type_id > 0) {
      const housesArray = Array.isArray(poultryHouses) ? poultryHouses : []
      const nextHouses = housesArray.filter((house) =>
        isHouseSelectableForFlock(house, formData.poultry_type_id, {
          isEditMode,
          currentHouseId: formData.house_id,
        })
      )
      setFilteredHouses(nextHouses)

      const stagesArray = Array.isArray(flockStages) ? flockStages : []
      const nextStages = stagesArray.filter(
        (stage) => Number(stage.poultry_type_id) === Number(formData.poultry_type_id)
      )
      setFilteredStages(nextStages)
    } else {
      setFilteredHouses([])
      setFilteredStages([])
    }
  }, [formData.poultry_type_id, formData.house_id, poultryHouses, flockStages, isEditMode])

  const fetchMedicationSchedules = useCallback(
    async (poultryTypeId: number) => {
      if (!token || !farmId || poultryTypeId <= 0) {
        setMedicationSchedules([])
        return
      }
      setSchedulesLoading(true)
      try {
        const res = await getSchedules(token, farmId, "medication", false)
        if (res.success && Array.isArray(res.data)) {
          setMedicationSchedules(res.data.filter((s: Schedule) => s.poultry_type_id === poultryTypeId))
        } else {
          setMedicationSchedules([])
        }
      } catch {
        setMedicationSchedules([])
      } finally {
        setSchedulesLoading(false)
      }
    },
    [token, farmId]
  )

  const fetchVaccinationSchedules = useCallback(
    async (poultryTypeId: number) => {
      if (!token || !farmId || poultryTypeId <= 0) {
        setVaccinationSchedules([])
        return
      }
      setSchedulesLoading(true)
      try {
        const res = await getSchedules(token, farmId, "vaccination", false)
        if (res.success && Array.isArray(res.data)) {
          setVaccinationSchedules(res.data.filter((s: Schedule) => s.poultry_type_id === poultryTypeId))
        } else {
          setVaccinationSchedules([])
        }
      } catch {
        setVaccinationSchedules([])
      } finally {
        setSchedulesLoading(false)
      }
    },
    [token, farmId]
  )

  const fetchFeedingSchedules = useCallback(
    async (poultryTypeId: number) => {
      if (!token || !farmId || poultryTypeId <= 0) {
        setFeedingSchedulesList([])
        return
      }
      setSchedulesLoading(true)
      try {
        const res = await getFeedingSchedules(token, farmId, false)
        if (res.success && Array.isArray(res.data)) {
          const typeName = poultryTypes
            .find((t) => t.id === poultryTypeId)
            ?.name?.toLowerCase()
            ?.trim()
          setFeedingSchedulesList(
            res.data.filter((s: FeedingSchedule) => {
              if (s.poultry_type_id === poultryTypeId) return true
              // Legacy default schedules often lack poultry_type_id — match by title.
              if (
                (s.poultry_type_id == null || s.poultry_type_id === 0) &&
                typeName &&
                (s.title || "").toLowerCase().includes(typeName)
              ) {
                return true
              }
              return false
            })
          )
        } else {
          setFeedingSchedulesList([])
        }
      } catch {
        setFeedingSchedulesList([])
      } finally {
        setSchedulesLoading(false)
      }
    },
    [token, farmId, poultryTypes]
  )

  useEffect(() => {
    if (isEditMode) return

    // Reset selected schedules when poultry type changes
    setFormData((prev) => ({
      ...prev,
      medication_schedule_id: null,
      vaccination_schedule_id: null,
      feeding_schedule_id: null,
    }))
    setExpandedSchedule(null)

    if (formData.poultry_type_id > 0) {
      // Load all schedules (no UI pagination)
      fetchMedicationSchedules(formData.poultry_type_id)
      fetchVaccinationSchedules(formData.poultry_type_id)
      fetchFeedingSchedules(formData.poultry_type_id)
    } else {
      setMedicationSchedules([])
      setVaccinationSchedules([])
      setFeedingSchedulesList([])
    }
  }, [
    formData.poultry_type_id,
    fetchMedicationSchedules,
    fetchVaccinationSchedules,
    fetchFeedingSchedules,
  ])

  const handleInputChange = (field: keyof FlockFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
    // Reset warning confirmation when form data changes
    setWarningsConfirmed(false)
  }

  const handleDateChange = (field: 'arrival_date' | 'expected_end_date', date: Date | undefined) => {
    if (date) {
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      const formattedDate = format(validDate, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, [field]: formattedDate }))
      if (field === 'arrival_date') setShowArrivalCalendar(false)
      if (field === 'expected_end_date') setShowEndCalendar(false)
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev
          return rest
        })
      }
      setWarningsConfirmed(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Flock name is required"
    if (!formData.breed.trim()) newErrors.breed = "Breed is required"
    if (!formData.source.trim()) newErrors.source = "Source is required"
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0"
    if (!formData.arrival_date) newErrors.arrival_date = "Arrival date is required"
    if (formData.arrival_age_days < 0) newErrors.arrival_age_days = "Arrival age cannot be negative"
    if (!formData.expected_end_date) newErrors.expected_end_date = "Expected end date is required"
    if (formData.poultry_type_id === 0) newErrors.poultry_type_id = "Poultry type is required"
    if (formData.flock_stage_id === 0) newErrors.flock_stage_id = "Flock stage is required"
    if (formData.house_id === 0) newErrors.house_id = "Poultry house is required"

    // Validate date relationship
    if (formData.arrival_date && formData.expected_end_date) {
      const arrivalDate = new Date(formData.arrival_date)
      const endDate = new Date(formData.expected_end_date)
      
      if (endDate <= arrivalDate) {
        newErrors.expected_end_date = "Expected end date must be after arrival date"
      } else {
        // Check if end date is less than 5 weeks (35 days) from arrival date
        const daysDifference = Math.ceil((endDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDifference < 35) {
          newErrors.expected_end_date = `Warning: End date is only ${daysDifference} days after arrival (less than 5 weeks)`
        }
      }
    }

    setErrors(newErrors)
    
    // Check if there are warnings that need confirmation
    const hasWarnings = Object.values(newErrors).some(message => message.startsWith('Warning:'))
    if (hasWarnings && !warningsConfirmed) {
      return false
    }
    
    // Filter out warnings from errors when checking for validation
    const actualErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, message]) => !message.startsWith('Warning:'))
    )
    
    return Object.keys(actualErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      if (!isEditMode) {
        setFormData(emptyFormData(farmId || 0))
      }
      setErrors({})
      setWarningsConfirmed(false)
      onClose()
    } catch (error) {
      console.error(isEditMode ? "Error updating flock:" : "Error creating flock:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(emptyFormData(farmId || 0))
      setErrors({})
      setWarningsConfirmed(false)
      setShowArrivalCalendar(false)
      setShowEndCalendar(false)
      setExpandedSchedule(null)
      onClose()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) handleClose()
    }}>
      <SheetContent 
        side="right"
        className="!max-w-none w-full p-0 flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex-shrink-0">
          <SheetHeader>
            <SheetTitle className="text-white text-xl">
              {isEditMode ? "Edit Flock" : "Add New Flock"}
            </SheetTitle>
            <SheetDescription className="text-green-100">
              {isEditMode
                ? "Update flock details below. Schedules are managed separately on the flock schedule tab."
                : "Create a new flock by filling in the details below. Fields marked with * are required."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* ── Basic Info Section ── */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Bird className="h-4 w-4 text-green-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditMode && editingFlock?.batch_number ? (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-green-400" />
                    Batch Number
                  </Label>
                  <Input value={editingFlock.batch_number} disabled className="h-9 text-sm bg-gray-50" />
                </div>
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Bird className="h-3.5 w-3.5 text-green-400" />
                  Flock Name *
                </Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter flock name" className={cn("h-9 text-sm", errors.name && "border-red-400")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="breed" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Dna className="h-3.5 w-3.5 text-green-400" />
                  Breed *
                </Label>
                <Input id="breed" value={formData.breed} onChange={(e) => handleInputChange("breed", e.target.value)} placeholder="Enter breed" className={cn("h-9 text-sm", errors.breed && "border-red-400")} />
                {errors.breed && <p className="text-xs text-red-500">{errors.breed}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="source" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-green-400" />
                  Source *
                </Label>
                <Input id="source" value={formData.source} onChange={(e) => handleInputChange("source", e.target.value)} placeholder="Enter source" className={cn("h-9 text-sm", errors.source && "border-red-400")} />
                {errors.source && <p className="text-xs text-red-500">{errors.source}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-green-400" />
                  Quantity *
                </Label>
                <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)} placeholder="Enter quantity" className={cn("h-9 text-sm", errors.quantity && "border-red-400")} />
                {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="arrival_age_days" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-green-400" />
                  Arrival Age (Days)
                </Label>
                <Input id="arrival_age_days" type="number" min="0" value={formData.arrival_age_days} onChange={(e) => handleInputChange("arrival_age_days", parseInt(e.target.value) || 0)} placeholder="Enter arrival age in days" className={cn("h-9 text-sm", errors.arrival_age_days && "border-red-400")} />
                {errors.arrival_age_days && <p className="text-xs text-red-500">{errors.arrival_age_days}</p>}
              </div>
            </div>
          </div>

          {/* ── Date Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arrival Date */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                  Arrival Date *
                </Label>
                <button
                  type="button"
                  onClick={() => { setShowArrivalCalendar(!showArrivalCalendar); setShowEndCalendar(false) }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                    errors.arrival_date ? "border-red-400 bg-red-50" : "border-gray-300",
                    showArrivalCalendar && "border-green-500 ring-2 ring-green-100"
                  )}
                >
                  <span className={formData.arrival_date ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {formData.arrival_date ? format(new Date(formData.arrival_date + 'T12:00:00'), "EEEE, MMMM d, yyyy") : "Select arrival date"}
                  </span>
                  {showArrivalCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {showArrivalCalendar && (
                  <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                    <Calendar mode="single" selected={formData.arrival_date ? new Date(formData.arrival_date + 'T12:00:00') : undefined} onSelect={(date) => handleDateChange("arrival_date", date)} />
                  </div>
                )}
                {errors.arrival_date && <p className="text-xs text-red-500">{errors.arrival_date}</p>}
              </div>

              {/* Expected End Date */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                  Expected End Date *
                </Label>
                <button
                  type="button"
                  onClick={() => { setShowEndCalendar(!showEndCalendar); setShowArrivalCalendar(false) }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                    errors.expected_end_date ? (errors.expected_end_date.startsWith('Warning:') ? "border-yellow-400 bg-yellow-50" : "border-red-400 bg-red-50") : "border-gray-300",
                    showEndCalendar && "border-green-500 ring-2 ring-green-100"
                  )}
                >
                  <span className={formData.expected_end_date ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {formData.expected_end_date ? format(new Date(formData.expected_end_date + 'T12:00:00'), "EEEE, MMMM d, yyyy") : "Select expected end date"}
                  </span>
                  {showEndCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {showEndCalendar && (
                  <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                    <Calendar mode="single" selected={formData.expected_end_date ? new Date(formData.expected_end_date + 'T12:00:00') : undefined} onSelect={(date) => handleDateChange("expected_end_date", date)} />
                  </div>
                )}
                {errors.expected_end_date && (
                  <p className={`text-xs ${errors.expected_end_date.startsWith('Warning:') ? 'text-yellow-600' : 'text-red-500'}`}>
                    {errors.expected_end_date}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Classification Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Classification &amp; Housing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  Poultry Type *
                </Label>
                <Select
                  value={formData.poultry_type_id ? formData.poultry_type_id.toString() : ""}
                  onValueChange={(value) => {
                    handleInputChange("poultry_type_id", parseInt(value))
                    handleInputChange("flock_stage_id", 0)
                    handleInputChange("house_id", 0)
                  }}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.poultry_type_id && "border-red-400")}>
                    <SelectValue placeholder="Select poultry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(poultryTypes) ? poultryTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
                {errors.poultry_type_id && <p className="text-xs text-red-500">{errors.poultry_type_id}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  Flock Stage *
                </Label>
                <Select
                  value={formData.flock_stage_id ? formData.flock_stage_id.toString() : ""}
                  onValueChange={(value) => handleInputChange("flock_stage_id", parseInt(value))}
                  disabled={!Array.isArray(filteredStages) || filteredStages.length === 0}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.flock_stage_id && "border-red-400")}>
                    <SelectValue placeholder="Select flock stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(filteredStages) ? filteredStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
                {errors.flock_stage_id && <p className="text-xs text-red-500">{errors.flock_stage_id}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-purple-400" />
                  Poultry House *
                </Label>
                <Select
                  value={formData.house_id ? formData.house_id.toString() : ""}
                  onValueChange={(value) => handleInputChange("house_id", parseInt(value))}
                  disabled={!Array.isArray(filteredHouses) || filteredHouses.length === 0}
                >
                  <SelectTrigger className={cn("h-9 text-sm", errors.house_id && "border-red-400")}>
                    <SelectValue placeholder="Select poultry house" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(filteredHouses) ? filteredHouses.map((house) => (
                      <SelectItem key={house.id} value={house.id.toString()}>
                        {house.name} (Capacity: {house.capacity}
                        {typeof house.current_occupancy === "number"
                          ? ` · ${house.current_occupancy} birds`
                          : ""}
                        )
                      </SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
                {errors.house_id && <p className="text-xs text-red-500">{errors.house_id}</p>}
              </div>
            </div>
          </div>

          {/* ── Schedule Selection Section ── */}
          {!isEditMode && formData.poultry_type_id > 0 && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" />
                  Schedule Assignment
                  {schedulesLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 ml-1" />}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Assign schedules to this flock. Select one per category. Click the info icon to preview items.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Medication Column ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Medication</p>
                      <p className="text-[11px] text-gray-400">{medicationSchedules.length} available</p>
                    </div>
                  </div>
                  {medicationSchedules.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <Pill className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 italic">No medication schedules for this type</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {medicationSchedules.map((schedule) => {
                        const isSelected = formData.medication_schedule_id === schedule.id
                        const isExpanded = expandedSchedule === `med-${schedule.id}`
                        return (
                          <div key={schedule.id} className={cn(
                            "border rounded-xl transition-all",
                            isSelected ? "border-purple-400 bg-purple-50/80 shadow-sm shadow-purple-100 ring-1 ring-purple-200" : "border-gray-200 hover:border-purple-200 hover:shadow-sm"
                          )}>
                            <div
                              className="flex items-start gap-3 p-3.5 cursor-pointer"
                              onClick={() => setFormData(prev => ({ ...prev, medication_schedule_id: isSelected ? null : schedule.id }))}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                              )}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium text-gray-800 truncate">{schedule.name}</p>
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                                    schedule.type === 'default' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                  )}>{schedule.type}</span>
                                </div>
                                <p className="text-xs text-gray-500 whitespace-normal">
                                  {schedule.description || "No description"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[11px] text-gray-400 font-medium">{schedule.items?.length || 0} items</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedSchedule(isExpanded ? null : `med-${schedule.id}`) }}
                                    className={cn(
                                      "text-[11px] flex items-center gap-1 transition-colors",
                                      isExpanded ? "text-purple-600 font-medium" : "text-gray-400 hover:text-purple-500"
                                    )}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {isExpanded ? "Hide details" : "View details"}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isExpanded && schedule.items && schedule.items.length > 0 && (
                              <div className="border-t border-purple-100 bg-white rounded-b-xl">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-purple-50/50 sticky top-0">
                                      <tr className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-3 py-2">Day</th>
                                        <th className="text-left px-3 py-2">Name</th>
                                        <th className="text-left px-3 py-2">Dose</th>
                                        <th className="text-left px-3 py-2">WD</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {schedule.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                          <td className="px-3 py-1.5 font-mono text-purple-600 font-medium">D{item.age_days}</td>
                                          <td className="px-3 py-1.5 text-gray-700">{item.name}</td>
                                          <td className="px-3 py-1.5 text-gray-600">{item.dose} {item.dose_unit}</td>
                                          <td className="px-3 py-1.5 text-gray-400">{item.withdrawal_period_days}d</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Vaccination Column ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Syringe className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Vaccination</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-gray-400">{vaccinationSchedules.length} available</p>
                      </div>
                    </div>
                  </div>
                  {vaccinationSchedules.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <Syringe className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 italic">No vaccination schedules for this type</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {vaccinationSchedules.map((schedule) => {
                        const isSelected = formData.vaccination_schedule_id === schedule.id
                        const isExpanded = expandedSchedule === `vac-${schedule.id}`
                        return (
                          <div key={schedule.id} className={cn(
                            "border rounded-xl transition-all",
                            isSelected ? "border-teal-400 bg-teal-50/80 shadow-sm shadow-teal-100 ring-1 ring-teal-200" : "border-gray-200 hover:border-teal-200 hover:shadow-sm"
                          )}>
                            <div
                              className="flex items-start gap-3 p-3.5 cursor-pointer"
                              onClick={() => setFormData(prev => ({ ...prev, vaccination_schedule_id: isSelected ? null : schedule.id }))}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                isSelected ? "border-teal-500 bg-teal-500" : "border-gray-300"
                              )}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium text-gray-800 truncate">{schedule.name}</p>
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                                    schedule.type === 'default' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                  )}>{schedule.type}</span>
                                </div>
                                <p className="text-xs text-gray-500 whitespace-normal">
                                  {schedule.description || "No description"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[11px] text-gray-400 font-medium">{schedule.items?.length || 0} items</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedSchedule(isExpanded ? null : `vac-${schedule.id}`) }}
                                    className={cn(
                                      "text-[11px] flex items-center gap-1 transition-colors",
                                      isExpanded ? "text-teal-600 font-medium" : "text-gray-400 hover:text-teal-500"
                                    )}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {isExpanded ? "Hide details" : "View details"}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isExpanded && schedule.items && schedule.items.length > 0 && (
                              <div className="border-t border-teal-100 bg-white rounded-b-xl">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-teal-50/50 sticky top-0">
                                      <tr className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-3 py-2">Day</th>
                                        <th className="text-left px-3 py-2">Name</th>
                                        <th className="text-left px-3 py-2">Dose</th>
                                        <th className="text-left px-3 py-2">WD</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {schedule.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                          <td className="px-3 py-1.5 font-mono text-teal-600 font-medium">D{item.age_days}</td>
                                          <td className="px-3 py-1.5 text-gray-700">{item.name}</td>
                                          <td className="px-3 py-1.5 text-gray-600">{item.dose} {item.dose_unit}</td>
                                          <td className="px-3 py-1.5 text-gray-400">{item.withdrawal_period_days}d</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Feeding Column ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Wheat className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Feeding</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-gray-400">{feedingSchedulesList.length} available</p>
                      </div>
                    </div>
                  </div>
                  {feedingSchedulesList.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <Wheat className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 italic">No feeding schedules for this type</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {feedingSchedulesList.map((schedule) => {
                        const isSelected = formData.feeding_schedule_id === schedule.id
                        const isExpanded = expandedSchedule === `feed-${schedule.id}`
                        const starts = (schedule.items || []).map((i: any) => i.start_day ?? i.feeding_day ?? 1)
                        const ends = (schedule.items || []).map((i: any) =>
                          i.end_day == null && (i.start_day != null || i.is_open_ended)
                            ? null
                            : i.end_day ?? i.feeding_day ?? i.start_day ?? 1
                        )
                        const hasOpen = ends.some((e: number | null) => e == null)
                        const minStart = starts.length ? Math.min(...starts) : 0
                        const maxEnd = ends.filter((e: number | null) => e != null).length
                          ? Math.max(...(ends.filter((e: number | null) => e != null) as number[]))
                          : minStart
                        const dayRange = starts.length
                          ? hasOpen
                            ? `Day ${minStart} – ∞`
                            : `Day ${minStart} – ${maxEnd}`
                          : ""
                        const totalDays = schedule.items?.length || 0
                        return (
                          <div key={schedule.id} className={cn(
                            "border rounded-xl transition-all",
                            isSelected ? "border-amber-400 bg-amber-50/80 shadow-sm shadow-amber-100 ring-1 ring-amber-200" : "border-gray-200 hover:border-amber-200 hover:shadow-sm"
                          )}>
                            <div
                              className="flex items-start gap-3 p-3.5 cursor-pointer"
                              onClick={() => setFormData(prev => ({ ...prev, feeding_schedule_id: isSelected ? null : schedule.id }))}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                isSelected ? "border-amber-500 bg-amber-500" : "border-gray-300"
                              )}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium text-gray-800 truncate">{schedule.title}</p>
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                                    schedule.type === 'default' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                  )}>{schedule.type}</span>
                                </div>
                                <p className="text-xs text-gray-500 whitespace-normal">
                                  {schedule.description || "No description"}
                                </p>
                                {dayRange && (
                                  <p className="text-[11px] text-amber-600 font-medium mt-1">{dayRange}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[11px] text-gray-400 font-medium">{totalDays} items</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedSchedule(isExpanded ? null : `feed-${schedule.id}`) }}
                                    className={cn(
                                      "text-[11px] flex items-center gap-1 transition-colors",
                                      isExpanded ? "text-amber-600 font-medium" : "text-gray-400 hover:text-amber-500"
                                    )}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {isExpanded ? "Hide details" : "View details"}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isExpanded && schedule.items && schedule.items.length > 0 && (
                              <div className="border-t border-amber-100 bg-white rounded-b-xl">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-amber-50/50 sticky top-0">
                                      <tr className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-3 py-2">Day</th>
                                        <th className="text-left px-3 py-2">Feed Type</th>
                                        <th className="text-left px-3 py-2">Qty</th>
                                        <th className="text-left px-3 py-2">Feedings</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {schedule.items
                                        .slice()
                                        .sort((a: any, b: any) =>
                                          (a.start_day ?? a.feeding_day ?? 0) - (b.start_day ?? b.feeding_day ?? 0)
                                        )
                                        .map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                          <td className="px-3 py-1.5 font-mono text-amber-600 font-medium">
                                            {formatFeedingDayRange(
                                              item.start_day ?? item.feeding_day ?? 1,
                                              item.end_day === undefined
                                                ? item.feeding_day ?? item.start_day ?? 1
                                                : item.end_day
                                            ).replace(/^Day\s/, "")}
                                          </td>
                                          <td className="px-3 py-1.5 text-gray-700">{item.feed_type?.name || `Type #${item.feed_type_id}`}</td>
                                          <td className="px-3 py-1.5 text-gray-600">{item.quantity}g</td>
                                          <td className="px-3 py-1.5 text-gray-400">{item.feeding_times?.length || 0}x daily</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── Notes Section ── */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes about this flock"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Warning Confirmation */}
          {Object.values(errors).some(message => message.startsWith('Warning:')) && !warningsConfirmed && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">Warning Confirmation Required</h3>
                  <p className="mt-1 text-sm text-yellow-700">Please review the warnings above and confirm to proceed.</p>
                  <div className="mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setWarningsConfirmed(true)} className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200">
                      I understand and want to proceed
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="sticky bottom-0 bg-white border-t pt-4 pb-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Flock"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default AddFlockModal
