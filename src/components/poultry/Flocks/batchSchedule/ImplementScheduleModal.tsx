import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ScheduleItem, VaccineProduct, MedicationProduct, AdministrationMethod } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { getAdministrationMethods, getVaccineProducts, getMedicationProducts } from "@/lib/request"
import { toast } from "react-toastify"

interface ImplementScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleItem: ScheduleItem
  batchScheduleId: number
  scheduleType: "medication" | "vaccination"
  onSuccess?: () => void
}

const ImplementScheduleModal = ({
  open,
  onOpenChange,
  scheduleItem,
  batchScheduleId,
  scheduleType,
  onSuccess,
}: ImplementScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date())
  const [actualDate, setActualDate] = useState<Date | undefined>(undefined)
  
  // Dropdown data
  const [vaccineProducts, setVaccineProducts] = useState<VaccineProduct[]>([])
  const [medicationProducts, setMedicationProducts] = useState<MedicationProduct[]>([])
  const [administrationMethods, setAdministrationMethods] = useState<AdministrationMethod[]>([])
  const [loadingData, setLoadingData] = useState(true)
   const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const [formData, setFormData] = useState({
    administered_by: "",
    poultry_vaccine_product_id: scheduleType === "vaccination" ? scheduleItem.poultry_vaccine_id?.toString() || "" : "",
    vaccine_product_batch_id: "",
    poultry_medication_id: scheduleType === "medication" ? scheduleItem.poultry_medication_id?.toString() || "" : "",
    dosage: scheduleItem.dose?.toString() || "",
    quantity: "",
    cost: "",
    notes: "",
    administration_method_id: "",
    status: "completed" as "scheduled" | "completed" | "missed" | "late",
  })

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      fetchDropdownData()
    }
  }, [open, scheduleType])

  const fetchDropdownData = async () => {
    setLoadingData(true)
    try {
      // Fetch administration methods
      const methodsResponse = await getAdministrationMethods(token, farmId!);
      if (methodsResponse.success && Array.isArray(methodsResponse.data)) {
        setAdministrationMethods(methodsResponse.data);
      } else {
        toast.error("Failed to fetch administration methods");
      }

      // Fetch vaccine or medication products based on type
      if (scheduleType === "vaccination") {
        const vaccineResponse = await getVaccineProducts(token, farmId!, false, scheduleItem.poultry_vaccine_id ?? undefined);
        if (vaccineResponse.success && Array.isArray(vaccineResponse.data)) {
          setVaccineProducts(vaccineResponse.data);
          console.log("Vaccine Products: ", vaccineResponse.data);
        } else {
          const errorMsg = vaccineResponse.error?.join(", ") || "Failed to fetch vaccine products";
          toast.error(errorMsg);
          console.error("Failed to fetch vaccine products:", vaccineResponse);
        }
      } else {
        const medicationResponse = await getMedicationProducts(token, farmId!, false, scheduleItem.poultry_medication_id ?? undefined);
        if (medicationResponse.success && Array.isArray(medicationResponse.data)) {
          setMedicationProducts(medicationResponse.data);
          console.log("Medication Products: ", medicationResponse.data);
        } else {
          const errorMsg = medicationResponse.error?.join(", ") || "Failed to fetch medication products";
          toast.error(errorMsg);
          console.error("Failed to fetch medication products:", medicationResponse);
        }
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      toast.error("An unexpected error occurred while loading data")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        batch_schedule_id: batchScheduleId,
        schedule_item_id: scheduleItem.id,
        scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
        actual_date: actualDate ? format(actualDate, "yyyy-MM-dd") : null,
        status: formData.status,
        administered_by: formData.administered_by || null,
        dosage: formData.dosage ? Number(formData.dosage) : null,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        cost: formData.cost ? Number(formData.cost) : null,
        notes: formData.notes || null,
        administration_method_id: formData.administration_method_id ? Number(formData.administration_method_id) : null,
        ...(scheduleType === "vaccination" && {
          poultry_vaccine_product_id: Number(formData.poultry_vaccine_product_id),
          vaccine_product_batch_id: formData.vaccine_product_batch_id ? Number(formData.vaccine_product_batch_id) : null,
        }),
        ...(scheduleType === "medication" && {
          poultry_medication_id: Number(formData.poultry_medication_id),
        }),
      }

      const response = await fetch(`/api/farms/${farmId}/${scheduleType}/batch-schedule-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create batch schedule item")
      }

      toast.success("Schedule implemented successfully!")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error implementing schedule:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to implement schedule"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Implement {scheduleType === "vaccination" ? "Vaccination" : "Medication"} Schedule
          </DialogTitle>
          <DialogDescription>
            Record the details of this {scheduleType} administration for {scheduleItem.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={scheduledDate} onSelect={(date) => date && setScheduledDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Actual Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !actualDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {actualDate ? format(actualDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={actualDate} onSelect={setActualDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Administered By */}
          <div className="space-y-2">
            <Label htmlFor="administered_by">Administered By</Label>
            <Input
              id="administered_by"
              value={formData.administered_by}
              onChange={(e) => handleInputChange("administered_by", e.target.value)}
              placeholder="Enter name of person who administered"
              maxLength={255}
            />
          </div>

          {/* Dosage, Quantity, Cost */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                type="number"
                min="0"
                value={formData.dosage}
                onChange={(e) => handleInputChange("dosage", e.target.value)}
                placeholder="e.g., 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="e.g., 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder="e.g., 50.00"
              />
            </div>
          </div>

          {/* Vaccination-specific fields */}
          {scheduleType === "vaccination" && (
            <div className="space-y-2">
              <Label htmlFor="vaccine_product">Vaccine Product *</Label>
              {loadingData ? (
                <div className="text-sm text-gray-500">Loading vaccine products...</div>
              ) : (
                <Select
                  value={formData.poultry_vaccine_product_id}
                  onValueChange={(value) => {
                    handleInputChange("poultry_vaccine_product_id", value)
                    const selectedProduct = vaccineProducts.find(p => p.id.toString() === value)
                    if (selectedProduct?.administration_method_id) {
                      handleInputChange("administration_method_id", selectedProduct.administration_method_id.toString())
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vaccine product" />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccineProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Medication-specific field */}
          {scheduleType === "medication" && (
            <div className="space-y-2">
              <Label htmlFor="medication">Medication Product *</Label>
              {loadingData ? (
                <div className="text-sm text-gray-500">Loading medication products...</div>
              ) : (
                <Select
                  value={formData.poultry_medication_id}
                  onValueChange={(value) => {
                    handleInputChange("poultry_medication_id", value)
                    const selectedProduct = medicationProducts.find(p => p.id.toString() === value)
                    if (selectedProduct?.administration_method_id) {
                      handleInputChange("administration_method_id", selectedProduct.administration_method_id.toString())
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication product" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicationProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Administration Method */}
          <div className="space-y-2">
            <Label htmlFor="admin_method">Administration Method</Label>
            {loadingData ? (
              <div className="text-sm text-gray-500">Loading methods...</div>
            ) : (
              <Select
                value={formData.administration_method_id}
                onValueChange={(value) => handleInputChange("administration_method_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select administration method" />
                </SelectTrigger>
                <SelectContent>
                  {administrationMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name} {method.description && `- ${method.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes or observations..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Implementing..." : "Implement Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ImplementScheduleModal
