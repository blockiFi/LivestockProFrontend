import { useEffect, useMemo, useState } from "react"
import { BarChart3, Settings, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MedicationData, AdministrationMethod } from "@/lib/types"
import { useLoaderData, useRevalidator } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GetToken, getFarm, createMedicationProduct, createMedication } from "@/lib/request"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Textarea } from "@/components/ui/textarea"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

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

function CreateMedicationModal({
  medications,
  isOpen,
  onClose,
  onSubmit,
}: {
  medications: MedicationData[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: NewMedicationForm) => Promise<boolean>
}) {
  const [formData, setFormData] = useState<NewMedicationForm>({
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
  const [adminMethods, setAdminMethods] = useState<AdministrationMethod[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load administration methods when modal opens
  useEffect(() => {
    const load = async () => {
      if (!isOpen) return
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) return
      try {
        const mod = await import("@/lib/request")
        const anyMod = mod as any
        if (typeof anyMod.getAdministrationMethods === "function") {
          const res = await anyMod.getAdministrationMethods(token, farm.id)
          if (res.success) setAdminMethods(res.data || [])
        } else {
          // Module does not export getAdministrationMethods; leave adminMethods empty
          setAdminMethods([])
        }
      } catch (err) {
        console.error("Failed to load administration methods", err)
        setAdminMethods([])
      }
    }
    load()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.manufacturer || !formData.poultry_medication_id || !formData.administration_method_id) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      setSubmitting(true)
      const ok = await onSubmit(formData)
      if (ok) {
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medication Product</DialogTitle>
          <DialogDescription>Create a new medication product for your inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Medication *</Label>
              <Select value={formData.poultry_medication_id == null ? undefined : String(formData.poultry_medication_id)} onValueChange={(v) => setFormData((p) => ({ ...p, poultry_medication_id: Number(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Administration Method *</Label>
              <Select value={formData.administration_method_id == null ? undefined : String(formData.administration_method_id)} onValueChange={(v) => setFormData((p) => ({ ...p, administration_method_id: Number(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {adminMethods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Oxytetracycline 10%" />
            </div>
            <div>
              <Label>Manufacturer *</Label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))} placeholder="e.g., VetPharm" />
            </div>
            <div>
              <Label>Dosage</Label>
              <Input type="number" step="0.01" value={formData.dosage ?? ''} onChange={(e) => setFormData((p) => ({ ...p, dosage: e.target.value === '' ? null : Number.parseFloat(e.target.value) }))} placeholder="e.g., 10" />
            </div>
            <div>
              <Label>Dosage Unit</Label>
              <Select value={formData.dosage_unit} onValueChange={(v) => setFormData((p) => ({ ...p, dosage_unit: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
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
              <Label>Withdrawal Period</Label>
              <Input type="number" value={formData.withdrawal_period} onChange={(e) => setFormData((p) => ({ ...p, withdrawal_period: Number.parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Withdrawal Unit</Label>
              <Select value={formData.withdrawal_period_unit} onValueChange={(v: "days" | "hours") => setFormData((p) => ({ ...p, withdrawal_period_unit: v }))}>
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
              <Label>Minimum Stock Level</Label>
              <Input type="number" value={formData.min_stock_level} onChange={(e) => setFormData((p) => ({ ...p, min_stock_level: Number.parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Image URL (optional)</Label>
              <Input value={formData.image_url || ''} onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? "Adding..." : "Add Medication"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateMedicationCategoryModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => Promise<boolean>
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Medication name is required")
      return
    }
    try {
      setSubmitting(true)
      const ok = await onSubmit({ name: name.trim(), description: description.trim() || undefined })
      if (ok) {
        setName("")
        setDescription("")
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
          <DialogDescription>Create a new medication category</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Antibiotics" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Medication"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState("Name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const revalidator = useRevalidator()

  const loaderData = useLoaderData() as { medications: MedicationData[] | null }
  const medications: MedicationData[] = Array.isArray(loaderData)
    ? (loaderData as unknown as MedicationData[])
    : loaderData?.medications ?? []

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filteredCategories = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return medications
    return medications.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q),
    )
  }, [debouncedSearch, medications])

  const sortedCategories = useMemo(() => {
    const arr = [...filteredCategories]
    switch (sortBy) {
      case "Name":
        return arr.sort((a, b) => a.name.localeCompare(b.name))
      case "Products (Most)":
        return arr.sort((a, b) => b.products.length - a.products.length)
      case "Products (Least)":
        return arr.sort((a, b) => a.products.length - b.products.length)
      default:
        return arr
    }
  }, [filteredCategories, sortBy])

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
      const res = await createMedicationProduct(token, farm.id, payload)
      if (res.success) {
        toast.success("Medication product created successfully!")
        revalidator.revalidate()
        return true
      } else {
        const err = Array.isArray(res.error) ? res.error.join("\n") : (res.error || "Failed to create medication product")
        toast.error(err)
        return false
      }
    } catch (e) {
      toast.error("Failed to create medication product")
      return false
    }
  }

  const handleCreateMedicationCategory = async (data: { name: string; description?: string }): Promise<boolean> => {
    try {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) {
        toast.error("Missing authentication or active farm")
        return false
      }
      const res = await createMedication(token, farm.id, data)
      if (res.success) {
        toast.success("Medication created successfully")
        revalidator.revalidate()
        return true
      }
      const err = Array.isArray(res.error) ? res.error.join("\n") : (res.error || "Failed to create medication")
      toast.error(err)
      return false
    } catch (e) {
      toast.error("Failed to create medication")
      return false
    }
  }

  const totalProducts = medications.reduce((sum, cat) => sum + cat.products.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Medication Categories</h1>
              <p className="text-gray-600 text-lg">Organize and manage your medication categories and products</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="border-gray-300">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
              <ActionGate anyOf={ACTIONS.medications.create}>
                <Button 
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Medication Category
                </Button>
              </ActionGate>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Categories</p>
                <p className="text-3xl font-bold text-blue-900">{medications.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-green-900">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or description..."
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-11 border-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Name">Name (A-Z)</SelectItem>
                <SelectItem value="Products (Most)">Products (Most)</SelectItem>
                <SelectItem value="Products (Least)">Products (Least)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Showing {sortedCategories.length} of {medications.length} categories
            </div>
          </div>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex gap-2 md:justify-end mb-6">
          <Button variant="outline" onClick={() => setViewMode("grid")} className="border-gray-300">Grid</Button>
          <Button variant="outline" onClick={() => setViewMode("list")} className="border-gray-300">List</Button>
        </div>

        {/* Categories Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => {
                const colorVariants = [
                  "from-blue-500 to-blue-600",
                  "from-purple-500 to-purple-600",
                  "from-green-500 to-green-600",
                  "from-orange-500 to-orange-600",
                  "from-pink-500 to-pink-600",
                  "from-indigo-500 to-indigo-600",
                ]
                const colorIndex = category.id % colorVariants.length
                const gradient = colorVariants[colorIndex]

                return (
                  <Card
                    key={category.id}
                    className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                    <div className="p-6 bg-white">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Settings className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Medications</p>
                          <p className="text-2xl font-bold text-gray-900">{category.products.length}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="text-lg font-bold text-green-600">Active</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">Updated: {new Date(category.updated_at).toLocaleDateString()}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Categories List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {sortedCategories.map((category) => {
                const colorVariants = [
                  "from-blue-500 to-blue-600",
                  "from-purple-500 to-purple-600",
                  "from-green-500 to-green-600",
                  "from-orange-500 to-orange-600",
                  "from-pink-500 to-pink-600",
                  "from-indigo-500 to-indigo-600",
                ]
                const colorIndex = category.id % colorVariants.length
                const gradient = colorVariants[colorIndex]

                return (
                  <Card
                    key={category.id}
                    className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                    <div className="p-6 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Settings className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                            <p className="text-xs text-gray-500">Updated: {new Date(category.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Medications</p>
                          <p className="text-3xl font-bold text-gray-900">{category.products.length}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Usage Frequency</p>
                          <p className="font-bold text-gray-900">0</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Total Medications</p>
                          <p className="font-bold text-gray-900">{category.products.length}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="font-bold text-green-600">Active</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                          <p className="font-bold text-gray-900">{new Date(category.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
      </div>

      <CreateMedicationCategoryModal isOpen={isCreateCategoryOpen} onClose={() => setIsCreateCategoryOpen(false)} onSubmit={handleCreateMedicationCategory} />
      <CreateMedicationModal medications={medications} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateMedication} />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
    </div>
  )
}
