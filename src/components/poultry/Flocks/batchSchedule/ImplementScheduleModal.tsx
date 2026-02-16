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
import {
  CalendarIcon,
  Loader2,
  ClipboardCheck,
  User,
  Beaker,
  Package,
  DollarSign,
  Syringe,
  Pill,
  StickyNote,
  ChevronDown,
  ChevronUp
} from "lucide-react"
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
  const [showScheduledCalendar, setShowScheduledCalendar] = useState(false)
  const [showActualCalendar, setShowActualCalendar] = useState(false)
  
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Implement {scheduleType === "vaccination" ? "Vaccination" : "Medication"} Schedule
            </DialogTitle>
            <DialogDescription className="text-indigo-100">
              Record the details of this {scheduleType} administration for {scheduleItem.name}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* ── Status Section ── */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-indigo-500" />
              Status
            </h3>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="h-9 text-sm">
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
          </div>

          {/* ── Dates Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Date */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                  Scheduled Date *
                </Label>
                <button
                  type="button"
                  onClick={() => { setShowScheduledCalendar(!showScheduledCalendar); setShowActualCalendar(false) }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-gray-300",
                    showScheduledCalendar && "border-indigo-500 ring-2 ring-indigo-100"
                  )}
                >
                  <span className="text-gray-900 font-medium">
                    {format(scheduledDate, "EEEE, MMMM d, yyyy")}
                  </span>
                  {showScheduledCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {showScheduledCalendar && (
                  <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                    <Calendar mode="single" selected={scheduledDate} onSelect={(date) => { if (date) { setScheduledDate(date); setShowScheduledCalendar(false) } }} />
                  </div>
                )}
              </div>

              {/* Actual Date */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-green-400" />
                  Actual Date
                </Label>
                <button
                  type="button"
                  onClick={() => { setShowActualCalendar(!showActualCalendar); setShowScheduledCalendar(false) }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 border-gray-300",
                    showActualCalendar && "border-indigo-500 ring-2 ring-indigo-100"
                  )}
                >
                  <span className={actualDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {actualDate ? format(actualDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                  </span>
                  {showActualCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {showActualCalendar && (
                  <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                    <Calendar mode="single" selected={actualDate} onSelect={(date) => { setActualDate(date); setShowActualCalendar(false) }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Administration Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              Administration
            </h3>
            <div className="space-y-1">
              <Label htmlFor="administered_by" className="text-xs text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-400" />
                Administered By
              </Label>
              <Input id="administered_by" value={formData.administered_by} onChange={(e) => handleInputChange("administered_by", e.target.value)} placeholder="Enter name of person who administered" maxLength={255} className="h-9 text-sm" />
            </div>
          </div>

          {/* ── Dosage & Cost Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-green-500" />
              Dosage &amp; Cost
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dosage" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Beaker className="h-3.5 w-3.5 text-green-400" />
                  Dosage
                </Label>
                <Input id="dosage" type="number" min="0" value={formData.dosage} onChange={(e) => handleInputChange("dosage", e.target.value)} placeholder="e.g., 10" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-green-400" />
                  Quantity
                </Label>
                <Input id="quantity" type="number" min="0" step="0.01" value={formData.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} placeholder="e.g., 100" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cost" className="text-xs text-gray-600 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-green-400" />
                  Cost
                </Label>
                <Input id="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={(e) => handleInputChange("cost", e.target.value)} placeholder="e.g., 50.00" className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* ── Product Selection ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              {scheduleType === "vaccination" ? <Syringe className="h-4 w-4 text-teal-500" /> : <Pill className="h-4 w-4 text-purple-500" />}
              {scheduleType === "vaccination" ? "Vaccine Product" : "Medication Product"}
            </h3>

            {scheduleType === "vaccination" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Vaccine Product *</Label>
                {loadingData ? (
                  <div className="text-sm text-gray-500 p-2">Loading vaccine products...</div>
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
                    <SelectTrigger className="h-9 text-sm">
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

            {scheduleType === "medication" && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Medication Product *</Label>
                {loadingData ? (
                  <div className="text-sm text-gray-500 p-2">Loading medication products...</div>
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
                    <SelectTrigger className="h-9 text-sm">
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

            <div className="space-y-1">
              <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-teal-400" />
                Administration Method
              </Label>
              {loadingData ? (
                <div className="text-sm text-gray-500 p-2">Loading methods...</div>
              ) : (
                <Select value={formData.administration_method_id} onValueChange={(value) => handleInputChange("administration_method_id", value)}>
                  <SelectTrigger className="h-9 text-sm">
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
          </div>

          {/* ── Notes ── */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Add any additional notes or observations..." rows={3} className="resize-none" />
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
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
