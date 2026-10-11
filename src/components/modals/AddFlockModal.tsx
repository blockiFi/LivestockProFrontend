import { useState, useEffect, useCallback } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "../ui/form-modal"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import {
  AlertTriangle,
  CalendarCheck,
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) handleClose()
      }}
      title={isEditMode ? "Edit Flock" : "Add New Flock"}
      description={
        isEditMode
          ? "Update flock details below. Schedules are managed separately on the flock schedule tab."
          : "Create a new flock by filling in the details below. Fields marked with * are required."
      }
      icon={Bird}
      tone="flock"
      size="full"
      busy={isSubmitting}
      dismissible={false}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitLabel={isEditMode ? "Save Changes" : "Create Flock"}
          busyLabel={isEditMode ? "Saving..." : "Creating..."}
          busy={isSubmitting}
        />
      }
    >
          <FormSection step={1} icon={Bird} title="Basic Information" description="Name, breed, origin and size of the flock.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditMode && editingFlock?.batch_number ? (
                <FormField label="Batch Number" className="md:col-span-2">
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={editingFlock.batch_number} disabled className={formInputClass(false, "pl-9")} />
                  </div>
                </FormField>
              ) : null}
              <FormField label="Flock Name" required htmlFor="name" error={errors.name}>
                <div className="relative">
                  <Bird className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter flock name" className={formInputClass(!!errors.name, "pl-9")} />
                </div>
              </FormField>

              <FormField label="Breed" required htmlFor="breed" error={errors.breed}>
                <div className="relative">
                  <Dna className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="breed" value={formData.breed} onChange={(e) => handleInputChange("breed", e.target.value)} placeholder="Enter breed" className={formInputClass(!!errors.breed, "pl-9")} />
                </div>
              </FormField>
              <FormField label="Source" required htmlFor="source" error={errors.source}>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="source" value={formData.source} onChange={(e) => handleInputChange("source", e.target.value)} placeholder="Enter source" className={formInputClass(!!errors.source, "pl-9")} />
                </div>
              </FormField>
              <FormField label="Quantity" required htmlFor="quantity" error={errors.quantity}>
                <div className="relative">
                  <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)} placeholder="Enter quantity" className={formInputClass(!!errors.quantity, "pl-9")} />
                </div>
              </FormField>
              <FormField label="Arrival Age (Days)" htmlFor="arrival_age_days" error={errors.arrival_age_days}>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="arrival_age_days" type="number" min="0" value={formData.arrival_age_days} onChange={(e) => handleInputChange("arrival_age_days", parseInt(e.target.value) || 0)} placeholder="Enter arrival age in days" className={formInputClass(!!errors.arrival_age_days, "pl-9")} />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection step={2} icon={CalendarIcon} title="Dates" description="When the flock arrived and when you expect it to end.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Arrival Date" required error={errors.arrival_date}>
                <button
                  type="button"
                  onClick={() => { setShowArrivalCalendar(!showArrivalCalendar); setShowEndCalendar(false) }}
                  className={cn(
                    formInputClass(!!errors.arrival_date),
                    "flex w-full items-center justify-between border px-3 text-sm hover:bg-white",
                    showArrivalCalendar && "border-sky-500 ring-2 ring-sky-100"
                  )}
                >
                  <span className={formData.arrival_date ? "font-medium text-slate-900" : "text-slate-400"}>
                    {formData.arrival_date ? format(new Date(formData.arrival_date + 'T12:00:00'), "EEEE, MMMM d, yyyy") : "Select arrival date"}
                  </span>
                  {showArrivalCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>
                {showArrivalCalendar && (
                  <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Calendar mode="single" selected={formData.arrival_date ? new Date(formData.arrival_date + 'T12:00:00') : undefined} onSelect={(date) => handleDateChange("arrival_date", date)} />
                  </div>
                )}
              </FormField>

              <FormField
                label="Expected End Date"
                required
                error={
                  errors.expected_end_date && !errors.expected_end_date.startsWith('Warning:')
                    ? errors.expected_end_date
                    : undefined
                }
                hint={
                  errors.expected_end_date?.startsWith('Warning:') ? (
                    <span className="text-amber-600">{errors.expected_end_date}</span>
                  ) : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => { setShowEndCalendar(!showEndCalendar); setShowArrivalCalendar(false) }}
                  className={cn(
                    formInputClass(!!errors.expected_end_date && !errors.expected_end_date.startsWith('Warning:')),
                    "flex w-full items-center justify-between border px-3 text-sm hover:bg-white",
                    errors.expected_end_date?.startsWith('Warning:') && "border-amber-300 bg-amber-50",
                    showEndCalendar && "border-sky-500 ring-2 ring-sky-100"
                  )}
                >
                  <span className={formData.expected_end_date ? "font-medium text-slate-900" : "text-slate-400"}>
                    {formData.expected_end_date ? format(new Date(formData.expected_end_date + 'T12:00:00'), "EEEE, MMMM d, yyyy") : "Select expected end date"}
                  </span>
                  {showEndCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>
                {showEndCalendar && (
                  <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Calendar mode="single" selected={formData.expected_end_date ? new Date(formData.expected_end_date + 'T12:00:00') : undefined} onSelect={(date) => handleDateChange("expected_end_date", date)} />
                  </div>
                )}
              </FormField>
            </div>
          </FormSection>

          <FormSection step={3} icon={Layers} title="Classification & Housing" description="Poultry type, growth stage and the house it lives in.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Poultry Type" required error={errors.poultry_type_id}>
                <Select
                  value={formData.poultry_type_id ? formData.poultry_type_id.toString() : ""}
                  onValueChange={(value) => {
                    handleInputChange("poultry_type_id", parseInt(value))
                    handleInputChange("flock_stage_id", 0)
                    handleInputChange("house_id", 0)
                  }}
                >
                  <SelectTrigger className={formInputClass(!!errors.poultry_type_id)}>
                    <SelectValue placeholder="Select poultry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(poultryTypes) ? poultryTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Flock Stage" required error={errors.flock_stage_id}>
                <Select
                  value={formData.flock_stage_id ? formData.flock_stage_id.toString() : ""}
                  onValueChange={(value) => handleInputChange("flock_stage_id", parseInt(value))}
                  disabled={!Array.isArray(filteredStages) || filteredStages.length === 0}
                >
                  <SelectTrigger className={formInputClass(!!errors.flock_stage_id)}>
                    <SelectValue placeholder="Select flock stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(filteredStages) ? filteredStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Poultry House" required error={errors.house_id} className="md:col-span-2">
                <Select
                  value={formData.house_id ? formData.house_id.toString() : ""}
                  onValueChange={(value) => handleInputChange("house_id", parseInt(value))}
                  disabled={!Array.isArray(filteredHouses) || filteredHouses.length === 0}
                >
                  <SelectTrigger className={formInputClass(!!errors.house_id)}>
                    <div className="flex min-w-0 items-center gap-2">
                      <Home className="h-4 w-4 shrink-0 text-slate-400" />
                      <SelectValue placeholder="Select poultry house" />
                    </div>
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
              </FormField>
            </div>
          </FormSection>

          {!isEditMode && formData.poultry_type_id > 0 && (
            <FormSection
              step={4}
              icon={CalendarCheck}
              title="Schedule Assignment"
              description="Assign schedules to this flock. Select one per category and expand a card to preview its items."
              action={schedulesLoading ? <Loader2 className="h-4 w-4 animate-spin text-sky-500" /> : undefined}
            >
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
            </FormSection>
          )}

          <FormSection
            step={isEditMode || formData.poultry_type_id <= 0 ? 4 : 5}
            icon={StickyNote}
            title="Notes"
            description="Anything else worth recording about this flock."
          >
            <FormField label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter any additional notes about this flock"
                rows={3}
                className={formTextareaClass()}
              />
            </FormField>
          </FormSection>

          {Object.values(errors).some(message => message.startsWith('Warning:')) && !warningsConfirmed && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800">Warning Confirmation Required</h3>
                  <p className="mt-1 text-sm text-amber-700">Please review the warnings above and confirm to proceed.</p>
                  <div className="mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setWarningsConfirmed(true)} className="rounded-xl border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200">
                      I understand and want to proceed
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </FormModal>
  )
}

export default AddFlockModal
