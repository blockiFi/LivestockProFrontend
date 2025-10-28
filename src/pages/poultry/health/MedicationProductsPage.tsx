"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pill,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  AlertCircle,
  BarChart3,
  Settings,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react"
import type { Medication, MedicationData, MedicationProduct, AdministrationMethod } from "@/lib/types"
import { useLoaderData, useRevalidator } from "react-router-dom"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MedicationInventory } from "@/lib/types"
import { Naira, formatCurrency } from "@/lib/utils"
import { GetToken, getFarm, createMedication } from "@/lib/request"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// If the backend helper for fetching administration methods is not exported from "@/lib/request",
// provide a lightweight local implementation that fetches the administration methods directly.
// Adjust the endpoint if your API uses a different URL/route.
const getAdministrationMethods = async (token: string, farmId: number) => {
  try {
    const res = await fetch(`/api/administration-methods?farm_id=${farmId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return { success: false, data: [] }
    const data = await res.json()
    return { success: true, data: data?.data ?? data ?? [] }
  } catch (e) {
    return { success: false, data: [] }
  }
}

// Form for creating a Medication Product via API
interface NewMedicationForm {
  poultry_medication_id: number | null
  name: string
  manufacturer: string
  administration_method_id: number | null
  withdrawal_period: number
  withdrawal_period_unit: "days" | "hours"
  dosage: number | null
  dosage_unit: string
  image_url?: string
  min_stock_level: number
}

// Dynamic medication color handling
// A broad palette of Tailwind color combinations to support many medications
const MEDICATION_BADGE_COLORS: string[] = [
  "bg-red-100 text-red-800 border-red-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "bg-lime-100 text-lime-800 border-lime-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-slate-100 text-slate-800 border-slate-200",
  "bg-stone-100 text-stone-800 border-stone-200",
  "bg-zinc-100 text-zinc-800 border-zinc-200",
]

// Deterministically pick a color based on medication id (supports numerous medications)
const getMedicationBadgeColor = (medicationId: number) => {
  if (!MEDICATION_BADGE_COLORS.length) return "bg-gray-100 text-gray-800 border-gray-200"
  const idx = Math.abs(Number(medicationId)) % MEDICATION_BADGE_COLORS.length
  return MEDICATION_BADGE_COLORS[idx]
}

// Stock status color helper
const stockStatusColor = (quantity: number, minLevel: number) => {
  if (quantity <= minLevel) return "bg-red-100 text-red-800"
  if (quantity <= minLevel * 1.5) return "bg-yellow-100 text-yellow-800"
  return "bg-green-100 text-green-800"
}

// Expiry coloring helper: red (expired), orange (≤1 mo), amber (2 mo), yellow (3 mo), lime (4 mo), green (>4 mo)
const monthsUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null
  const exp = new Date(dateStr)
  if (Number.isNaN(exp.getTime())) return null
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const days = Math.ceil((exp.getTime() - now.getTime()) / msPerDay)
  return Math.ceil(days / 30)
}

const expiryColorClass = (dateStr?: string | null): string => {
  const m = monthsUntil(dateStr)
  if (m === null) return "bg-gray-100 text-gray-700 border-gray-200"
  if (m <= 0) return "bg-red-100 text-red-800 border-red-200" // expired
  if (m === 1) return "bg-orange-100 text-orange-800 border-orange-200" // ≤ 1 month
  if (m === 2) return "bg-amber-100 text-amber-800 border-amber-200" // 2 months
  if (m === 3) return "bg-yellow-100 text-yellow-800 border-yellow-200" // 3 months
  if (m === 4) return "bg-lime-100 text-lime-800 border-lime-200" // 4 months
  return "bg-green-100 text-green-800 border-green-200" // > 4 months
}

// Normalize inventories from various possible backend keys into a single array
const getProductInventories = (product: MedicationProduct): MedicationInventory[] => {
  const p: any = product as any
  const raw = p.inventory ?? p.inventories ?? p.medication_inventories ?? p.poultry_medication_inventories ?? []
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((inv: any) => ({
    ...inv,
    id: Number(inv.id),
    medication_product_id: Number(inv.medication_product_id ?? inv.poultry_medication_product_id ?? product.id),
    farm_id: inv.farm_id != null ? Number(inv.farm_id) : 0,
    quantity: Number(inv.quantity ?? 0),
    available_quantity: inv.available_quantity != null ? Number(inv.available_quantity) : Number(inv.quantity ?? 0),
    unit_cost: Number(inv.unit_cost ?? 0),
    manufacturer: inv.manufacturer ?? product.manufacturer ?? "",
    batch_number: inv.batch_number ?? "",
    status: inv.status ?? "available",
    manufacture_date: inv.manufacture_date ?? null,
    last_restocked: inv.last_restocked ?? null,
    expiry_date: inv.expiry_date ?? null,
    created_at: inv.created_at ?? "",
    updated_at: inv.updated_at ?? "",
    deleted_at: inv.deleted_at ?? null,
    created_by: inv.created_by ?? null,
  })) as MedicationInventory[]
}

function CreateMedicationModal({
 medications,
   isOpen,
   onClose,
   onSubmit,
   editingMedication,
 }: {
   medications: MedicationData[]
   isOpen: boolean
   onClose: () => void
   onSubmit: (medication: NewMedicationForm) => Promise<boolean>
   editingMedication?: Medication
 }) {
  const defaultForm: NewMedicationForm = {
    poultry_medication_id: null,
    name: "",
    manufacturer: "",
    administration_method_id: null,
    withdrawal_period: 0,
    withdrawal_period_unit: "days",
    dosage: null,
    dosage_unit: "",
    image_url: "",
    min_stock_level: 0,
  }

  const mapMedicationToForm = (med: Medication): NewMedicationForm => ({
    poultry_medication_id: (med as any).id ?? null,
    name: "",
    manufacturer: (med as any).manufacturer ?? "",
    administration_method_id: null,
    withdrawal_period: 0,
    withdrawal_period_unit: "days",
    dosage: null,
    dosage_unit: "",
    image_url: "",
    min_stock_level: 0,
  })

  const [formData, setFormData] = useState<NewMedicationForm>(() =>
    editingMedication ? mapMedicationToForm(editingMedication) : defaultForm
  )

  const [adminMethods, setAdminMethods] = useState<AdministrationMethod[]>([])
  useEffect(() => {
    const loadMethods = async () => {
      if (!isOpen) return
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) return
      const res = await getAdministrationMethods(token, farm.id)
      if (res.success) setAdminMethods(res.data || [])
    }
    loadMethods()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.manufacturer || !formData.poultry_medication_id || !formData.administration_method_id) {
      toast.error("Please fill in name, manufacturer, medication and administration method")
      return
    }
    const ok = await onSubmit(formData)
    if (ok) {
      handleClose()
    }
  }

  const handleClose = () => {
    setFormData({
      poultry_medication_id: null,
      name: "",
      manufacturer: "",
      administration_method_id: null,
      withdrawal_period: 0,
      withdrawal_period_unit: "days",
      dosage: null,
      dosage_unit: "",
      image_url: "",
      min_stock_level: 0,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            {editingMedication ? "Edit Medication" : "Add New Medication"}
          </DialogTitle>
          <DialogDescription>
            {editingMedication ? "Update medication details" : "Create a new medication entry"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Enter manufacturer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Medication *</Label>
                <Select
                  value={formData.poultry_medication_id == null ? undefined : String(formData.poultry_medication_id)}
                  onValueChange={(value: string) =>
                    setFormData((prev: NewMedicationForm) => {
                      // convert numeric string ids back to numbers; non-numeric values map to null
                      const num = Number(value)
                      return { ...prev, poultry_medication_id: Number.isNaN(num) ? null : num }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {
                        medications.map((med) => (
                            <SelectItem key={med.id} value={String(med.id)}>{med.name}</SelectItem>
                        ) )
                    }
         
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="method">Administration Method *</Label>
                <Select
                  value={formData.administration_method_id == null ? undefined : String(formData.administration_method_id)}
                  onValueChange={(value: string) =>
                    setFormData((prev: NewMedicationForm) => ({ ...prev, administration_method_id: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select administration method..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adminMethods.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.01"
                  value={formData.dosage ?? ''}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, dosage: e.target.value === '' ? null : Number.parseFloat(e.target.value) }))}
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <Label htmlFor="dosage_unit">Dosage Unit</Label>
                <Select
                  value={formData.dosage_unit}
                  onValueChange={(value) => setFormData((prev: NewMedicationForm) => ({ ...prev, dosage_unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="mg">Milligrams (mg)</SelectItem>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="withdrawal">Withdrawal Period</Label>
                <Input
                  id="withdrawal"
                  type="number"
                  value={formData.withdrawal_period}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, withdrawal_period: Number.parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="withdrawal_unit">Withdrawal Period Unit</Label>
                <Select
                  value={formData.withdrawal_period_unit}
                  onValueChange={(value: "days" | "hours") => setFormData((prev: NewMedicationForm) => ({ ...prev, withdrawal_period_unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, min_stock_level: Number.parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData((prev: NewMedicationForm) => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
           </Card>

           <DialogFooter>
             <Button type="button" variant="outline" onClick={handleClose}>
               Cancel
             </Button>
             <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
               {editingMedication ? "Update Medication" : "Add Medication"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   )
}

function ProductCard({
  product,
  medication,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  product: MedicationProduct
  medication: Medication
  onEdit: (product: MedicationProduct) => void
  onDelete: (id: number) => void
  onViewDetails: (product: MedicationProduct) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inventories = getProductInventories(product)
  const totalAvailable = inventories.reduce((sum, inv) => sum + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)
  const minStock = Number((product as any).min_stock_level ?? 0)
  const stockStatus = stockStatusColor(totalAvailable, minStock)
  const isLowStock = totalAvailable <= minStock
  const totalValue = inventories.reduce((sum, inv) => sum + (Number(inv.available_quantity ?? inv.quantity) || 0) * (Number(inv.unit_cost) || 0), 0)
  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "-")

  // Inventory table pagination state
  const [invPage, setInvPage] = useState(1)
  const [invPageSize, setInvPageSize] = useState(10)
  const totalInvPages = Math.max(1, Math.ceil((inventories.length || 0) / invPageSize))
  if (invPage > totalInvPages) {
    // Clamp page if data shrinks
    setInvPage(totalInvPages)
  }
  const startIndex = (invPage - 1) * invPageSize
  const endIndex = Math.min(startIndex + invPageSize, inventories.length)
  const pagedInventories = inventories.slice(startIndex, endIndex)

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors duration-150 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-purple-100">
                   <Pill className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">{product.name}</CardTitle>
                    <Badge className={getMedicationBadgeColor(medication.id)}>
                      {medication.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{product.manufacturer}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock</p>
                  <Badge className={stockStatus}>
                    {totalAvailable} units
                    {isLowStock && " ⚠️"}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Value</p>
                  <p className="font-medium">{Naira}{formatCurrency(totalValue)}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-gray-700">{medication.description}</p>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Dosage</p>
                  <p className="font-medium">{product.dosage}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Withdrawal Period</p>
                  <p className="font-medium">{product.withdrawal_period} {product.withdrawal_period_unit}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total Stock Value</p>
                  <p className="font-medium">{Naira}{formatCurrency(totalValue)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Min Stock Level</p>
                  <p className="font-medium">{minStock} units</p>
                </div>
              </div>
            </div>

            {/* Inventories Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">Inventories</h4>
                {inventories.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Rows per page</span>
                    <Select value={String(invPageSize)} onValueChange={(v) => { setInvPageSize(Number(v)); setInvPage(1); }}>
                      <SelectTrigger className="h-7 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5,10,20,50].map(sz => (
                          <SelectItem key={sz} value={String(sz)}>{sz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {inventories.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Manufactured</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedInventories.map((inv) => {
                        const qty = Number(inv.quantity) || 0
                        const available = Number(inv.available_quantity ?? inv.quantity) || 0
                        const unitCost = Number(inv.unit_cost) || 0
                        const rowValue = available * unitCost
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.batch_number || "-"}</TableCell>
                            <TableCell>{inv.manufacturer || "-"}</TableCell>
                            <TableCell className="text-right">{qty}</TableCell>
                            <TableCell className="text-right">{available}</TableCell>
                            <TableCell className="text-right">{Naira}{formatCurrency(unitCost)}</TableCell>
                            <TableCell className="text-right">{Naira}{formatCurrency(rowValue)}</TableCell>
                            <TableCell>{formatDate(inv.manufacture_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={expiryColorClass(inv.expiry_date)}>
                                {formatDate(inv.expiry_date)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{inv.status || "unknown"}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                    <TableCaption>
                      Showing {inventories.length === 0 ? 0 : startIndex + 1}-{endIndex} of {inventories.length}
                    </TableCaption>
                  </Table>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invPage <= 1}
                      onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-gray-600">
                      Page {invPage} of {totalInvPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={invPage >= totalInvPages}
                      onClick={() => setInvPage((p) => Math.min(totalInvPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-3 border rounded-md bg-gray-50 text-sm text-gray-600">No inventory records.</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button size="sm" variant="ghost" onClick={() => onViewDetails(product)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(product.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

 const  MedicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  // Removed unused typeFilter; keep only filters that affect the list
  const [stockFilter] = useState<string>("all")
  const [sortBy] = useState<string>("name")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>()
  const revalidator = useRevalidator()
  
    // Use the loader data shape returned by the route loader: { medications }
    const loaderData = useLoaderData() as { medications: MedicationData[] | null }
    const medications: MedicationData[] = Array.isArray(loaderData)
      ? (loaderData as unknown as MedicationData[])
      : loaderData?.medications ?? []

    // Flatten products with reference to parent medication
    const products = useMemo(() => {
      return (medications ?? []).flatMap((med) => (med.products || []).map((p) => ({ product: p, medication: med })))
    }, [medications])

    // Build dynamic category options based on medications list
    const categoryOptions = useMemo(() => {
      const base: { value: string; label: string }[] = [{ value: 'all', label: 'All Medications' }]
      const medOpts = (medications ?? []).map((m) => ({ value: String(m.id), label: m.name }))
      return base.concat(medOpts)
    }, [medications])

    // Filter and sort products
    const filteredProducts = useMemo(() => {
      let list = products
      // Category filter by medication id
      if (categoryFilter !== 'all') {
        list = list.filter((item) => String(item.medication.id) === categoryFilter)
      }
      // Search across product name/manufacturer and medication name
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        list = list.filter(({ product, medication }) =>
          product.name.toLowerCase().includes(term) ||
          product.manufacturer.toLowerCase().includes(term) ||
          (medication.name || '').toLowerCase().includes(term)
        )
      }
      // Stock filter (based on available vs min stock if present)
      if (stockFilter !== 'all') {
        list = list.filter(({ product }) => {
          const available = getProductInventories(product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)
          const minStock = Number((product as any).min_stock_level ?? 0)
          if (stockFilter === 'low') return available <= minStock
          if (stockFilter === 'medium') return available > minStock && available <= minStock * 1.5
          if (stockFilter === 'high') return available > minStock * 1.5
          return true
        })
      }
      // Sorting
      const sorted = [...list]
      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.product.name.localeCompare(b.product.name)
          case 'stock': {
            const aAvail = getProductInventories(a.product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)
            const bAvail = getProductInventories(b.product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)
            return bAvail - aAvail
          }
          case 'cost': {
            const aVal = getProductInventories(a.product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0) * (Number(inv.unit_cost) || 0), 0)
            const bVal = getProductInventories(b.product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0) * (Number(inv.unit_cost) || 0), 0)
            return bVal - aVal
          }
          case 'category':
            return a.medication.name.localeCompare(b.medication.name)
          default:
            return 0
        }
      })
      return sorted
    }, [products, categoryFilter, searchTerm, stockFilter, sortBy])

  const handleCreateMedication = async (form: NewMedicationForm): Promise<boolean> => {
    try {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) {
        toast.error("Missing authentication or active farm")
        return false
      }
      if (!form.poultry_medication_id || !form.administration_method_id || !form.name || !form.manufacturer) {
        toast.error("Please complete all required fields")
        return false
      }
      const payload = {
        poultry_medication_id: Number(form.poultry_medication_id),
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim(),
        administration_method_id: Number(form.administration_method_id),
        withdrawal_period: Number(form.withdrawal_period) || 0,
        withdrawal_period_unit: form.withdrawal_period_unit,
        dosage: form.dosage == null ? undefined : Number(form.dosage),
        dosage_unit: form.dosage_unit || undefined,
        image_url: form.image_url?.trim() || undefined,
        min_stock_level: Number(form.min_stock_level) || 0,
      }
      const res = await createMedication(token, farm.id, payload)
      if (res.success) {
        toast.success("Medication product created successfully!")
        revalidator.revalidate()
        return true
      } else {
        toast.error((res.error || []).join("\n"))
        return false
      }
    } catch (e) {
      toast.error("Failed to create medication product")
      return false
    }
  }

  const handleUpdateMedication = async (_medicationData: NewMedicationForm): Promise<boolean> => {
    // TODO: implement update via backend when available
    toast.info("Update medication not implemented yet")
    return false
  }

  // Calculate statistics
  const totalMedications = (medications ?? []).reduce((count, med) => count + ((med.products || []).length), 0)
  // Low stock products count (available <= min_stock_level)
  const lowStockCount = (products ?? []).reduce((sum, { product }) => {
    const available = getProductInventories(product).reduce((s, inv) => s + (Number(inv.available_quantity ?? inv.quantity) || 0), 0)
    const minStock = Number((product as any).min_stock_level ?? 0)
    return sum + (available <= minStock ? 1 : 0)
  }, 0)
  // Estimate stock value from inventories on products if present
  const totalStockValue = (medications ?? []).reduce((sum, med) => {
    const productValue = (med.products || []).reduce((pSum, prod) => {
      const invValue = getProductInventories(prod).reduce((iSum, inv) => iSum + (Number(inv.quantity) || 0) * (Number(inv.unit_cost) || 0), 0)
      return pSum + invValue
    }, 0)
    return sum + productValue
  }, 0)
  const categoriesCount = new Set((medications ?? []).map((m) => m.type || "unknown")).size

  return (
    <TooltipProvider>
      <div className="min-h-screen  p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Medications Management</h1>
                <p className="text-gray-600">Manage your poultry medication inventory and safety information</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setEditingMedication(undefined)
                    setIsCreateModalOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Medications</p>
                    <p className="text-2xl font-bold">{totalMedications}</p>
                  </div>
                  <Pill className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Low Stock Items</p>
                    <p className="text-2xl font-bold">{lowStockCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Stock Value</p>
                    <p className="text-2xl font-bold">{Naira}{formatCurrency(totalStockValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Medications </p>
                    <p className="text-2xl font-bold">{categoriesCount}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Card */}
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                      Search Medications
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search by product or medication..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Medication Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                 


                
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medications List */}
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500">Try adjusting your filters or create a new product</p>
                </CardContent>
              </Card>
            ) : (
              filteredProducts.map(({ product, medication }) => (
                <ProductCard
                  key={`${medication.id}-${product.id}`}
                  product={product}
                  medication={medication}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onViewDetails={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateMedicationModal
        medications={medications}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingMedication(undefined)
        }}
        onSubmit={editingMedication ? handleUpdateMedication : handleCreateMedication}
        editingMedication={editingMedication}
      />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
     </TooltipProvider>
    )
 }

export default MedicationsPage;