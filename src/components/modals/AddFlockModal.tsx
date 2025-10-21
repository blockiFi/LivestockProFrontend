import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { PoultryType, PoultryHouse, FlockStage } from "@/lib/types"
import { getPoultryTypes, getPoultryHouses, getFlockStages } from "@/lib/request"

interface AddFlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (flockData: FlockFormData) => Promise<void>
}

interface FlockFormData {
  name: string
  batch_number: string
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
}

const AddFlockModal = ({ isOpen, onClose, onSubmit }: AddFlockModalProps) => {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [formData, setFormData] = useState<FlockFormData>({
    name: "",
    batch_number: "",
    breed: "",
    source: "",
    quantity: 0,
    arrival_date: "",
    arrival_age_days: 0,
    expected_end_date: "",
    poultry_type_id: 0,
    flock_stage_id: 0,
    house_id: 0,
    farm_id: farmId || 0,
    notes: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warningsConfirmed, setWarningsConfirmed] = useState(false)
  const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>([])
  const [poultryHouses, setPoultryHouses] = useState<PoultryHouse[]>([])
  const [flockStages, setFlockStages] = useState<FlockStage[]>([])
  const [filteredHouses, setFilteredHouses] = useState<PoultryHouse[]>([])
  const [filteredStages, setFilteredStages] = useState<FlockStage[]>([])

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

  // Filter houses and stages based on selected poultry type
  useEffect(() => {
    console.log("poultry houses data in AddFlockModal.tsx:", formData.poultry_type_id);
    if (formData.poultry_type_id > 0) {
      const housesArray = Array.isArray(poultryHouses) ? poultryHouses : []
      const filteredHouses = housesArray.filter(
        house => house.poultry_type_id === formData.poultry_type_id && house.status === 'empty'
      )
      setFilteredHouses(filteredHouses)

      const stagesArray = Array.isArray(flockStages) ? flockStages : []
      const filteredStages = stagesArray.filter(
        stage => stage.poultry_type_id === formData.poultry_type_id
      )
      setFilteredStages(filteredStages)
    } else {
      setFilteredHouses([])
      setFilteredStages([])
    }
  }, [formData.poultry_type_id, poultryHouses, flockStages])

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
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, [field]: formattedDate }))
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev
          return rest
        })
      }
      // Reset warning confirmation when date changes
      setWarningsConfirmed(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Flock name is required"
    if (!formData.batch_number.trim()) newErrors.batch_number = "Batch number is required"
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
      // Reset form and close modal only on successful submission
      setFormData({
        name: "",
        batch_number: "",
        breed: "",
        source: "",
        quantity: 0,
        arrival_date: "",
        arrival_age_days: 0,
        expected_end_date: "",
        poultry_type_id: 0,
        flock_stage_id: 0,
        house_id: 0,
        farm_id: farmId || 0,
        notes: ""
      })
      setErrors({})
      setWarningsConfirmed(false)
      onClose()
    } catch (error) {
      console.error("Error creating flock:", error)
      // Don't close the modal on error so user can fix the issue
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        batch_number: "",
        breed: "",
        source: "",
        quantity: 0,
        arrival_date: "",
        arrival_age_days: 0,
        expected_end_date: "",
        poultry_type_id: 0,
        flock_stage_id: 0,
        house_id: 0,
        farm_id: farmId || 0,
        notes: ""
      })
      setErrors({})
      setWarningsConfirmed(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Allow closing via X button (when open is false) but not when submitting
      if (!open && !isSubmitting) {
        handleClose()
      }
    }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing when pressing Escape
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Add New Flock</DialogTitle>
          <DialogDescription>
            Create a new flock by filling in the details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flock Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Flock Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter flock name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => handleInputChange("batch_number", e.target.value)}
                placeholder="Enter batch number"
                className={errors.batch_number ? "border-red-500" : ""}
              />
              {errors.batch_number && <p className="text-sm text-red-500">{errors.batch_number}</p>}
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => handleInputChange("breed", e.target.value)}
                placeholder="Enter breed"
                className={errors.breed ? "border-red-500" : ""}
              />
              {errors.breed && <p className="text-sm text-red-500">{errors.breed}</p>}
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                placeholder="Enter source"
                className={errors.source ? "border-red-500" : ""}
              />
              {errors.source && <p className="text-sm text-red-500">{errors.source}</p>}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            {/* Arrival Age Days */}
            <div className="space-y-2">
              <Label htmlFor="arrival_age_days">Arrival Age (Days)</Label>
              <Input
                id="arrival_age_days"
                type="number"
                min="0"
                value={formData.arrival_age_days}
                onChange={(e) => handleInputChange("arrival_age_days", parseInt(e.target.value) || 0)}
                placeholder="Enter arrival age in days"
                className={errors.arrival_age_days ? "border-red-500" : ""}
              />
              {errors.arrival_age_days && <p className="text-sm text-red-500">{errors.arrival_age_days}</p>}
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arrival Date */}
            <div className="space-y-2">
              <Label>Arrival Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.arrival_date && "text-muted-foreground",
                      errors.arrival_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.arrival_date ? format(new Date(formData.arrival_date), "PPP") : "Select arrival date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.arrival_date ? new Date(formData.arrival_date) : undefined}
                    onSelect={(date) => handleDateChange("arrival_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.arrival_date && <p className="text-sm text-red-500">{errors.arrival_date}</p>}
            </div>

            {/* Expected End Date */}
            <div className="space-y-2">
              <Label>Expected End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expected_end_date && "text-muted-foreground",
                      errors.expected_end_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expected_end_date ? format(new Date(formData.expected_end_date), "PPP") : "Select expected end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expected_end_date ? new Date(formData.expected_end_date) : undefined}
                    onSelect={(date) => handleDateChange("expected_end_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.expected_end_date && (
                <p className={`text-sm ${errors.expected_end_date.startsWith('Warning:') ? 'text-yellow-600' : 'text-red-500'}`}>
                  {errors.expected_end_date}
                </p>
              )}
            </div>
          </div>

          {/* Selection Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Poultry Type */}
            <div className="space-y-2">
              <Label>Poultry Type *</Label>
              <Select
                value={formData.poultry_type_id ? formData.poultry_type_id.toString() : ""}
                onValueChange={(value) => {
                  handleInputChange("poultry_type_id", parseInt(value))
                  // Reset dependent fields
                  handleInputChange("flock_stage_id", 0)
                  handleInputChange("house_id", 0)
                }}
              >
                <SelectTrigger className={errors.poultry_type_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select poultry type" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(poultryTypes) ? poultryTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              {errors.poultry_type_id && <p className="text-sm text-red-500">{errors.poultry_type_id}</p>}
            </div>

            {/* Flock Stage */}
            <div className="space-y-2">
              <Label>Flock Stage *</Label>
              <Select
                value={formData.flock_stage_id ? formData.flock_stage_id.toString() : ""}
                onValueChange={(value) => handleInputChange("flock_stage_id", parseInt(value))}
                disabled={!Array.isArray(filteredStages) || filteredStages.length === 0}
              >
                <SelectTrigger className={errors.flock_stage_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select flock stage" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(filteredStages) ? filteredStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              {errors.flock_stage_id && <p className="text-sm text-red-500">{errors.flock_stage_id}</p>}
            </div>

            {/* Poultry House */}
            <div className="space-y-2">
              <Label>Poultry House *</Label>
              <Select
                value={formData.house_id ? formData.house_id.toString() : ""}
                onValueChange={(value) => handleInputChange("house_id", parseInt(value))}
                disabled={!Array.isArray(filteredHouses) || filteredHouses.length === 0}
              >
                <SelectTrigger className={errors.house_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select poultry house" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(filteredHouses) ? filteredHouses.map((house) => (
                    <SelectItem key={house.id} value={house.id.toString()}>
                      {house.name} (Capacity: {house.capacity})
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              {errors.house_id && <p className="text-sm text-red-500">{errors.house_id}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes about this flock"
              rows={3}
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
                  <p className="mt-1 text-sm text-yellow-700">
                    Please review the warnings above and confirm that you want to proceed with creating this flock.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWarningsConfirmed(true)}
                      className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                    >
                      I understand and want to proceed
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Flock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddFlockModal
