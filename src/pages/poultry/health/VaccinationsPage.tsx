"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, Settings, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { VaccineData, AdministrationMethod } from "@/lib/types"
import { useLoaderData, useRevalidator } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GetToken, getFarm, createVaccineProduct } from "@/lib/request"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Textarea } from "@/components/ui/textarea"
import axios from "@/lib/axios"

interface NewVaccineForm {
  poultry_vaccine_id: number | null
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

function CreateVaccineModal({
  vaccines,
  isOpen,
  onClose,
  onSubmit,
}: {
  vaccines: VaccineData[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: NewVaccineForm) => Promise<boolean>
}) {
  const [formData, setFormData] = useState<NewVaccineForm>({
    poultry_vaccine_id: null,
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
    if (!formData.name || !formData.manufacturer || !formData.poultry_vaccine_id || !formData.administration_method_id) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      setSubmitting(true)
      const ok = await onSubmit(formData)
      if (ok) {
        setFormData({
          poultry_vaccine_id: null,
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
          <DialogTitle>Add Vaccine Product</DialogTitle>
          <DialogDescription>Create a new vaccine product for your inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vaccine *</Label>
              <Select value={formData.poultry_vaccine_id == null ? undefined : String(formData.poultry_vaccine_id)} onValueChange={(v) => setFormData((p) => ({ ...p, poultry_vaccine_id: Number(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccines.map((m) => (
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
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., ND Vaccine" />
            </div>
            <div>
              <Label>Manufacturer *</Label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))} placeholder="e.g., VetLabs" />
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
              {submitting ? "Adding..." : "Add Vaccine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateVaccineCategoryModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; administration_age: number }) => Promise<boolean>
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [administrationAge, setAdministrationAge] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const age = administrationAge === "" ? 0 : Number(administrationAge)
    if (!name.trim() || !description.trim() || !age || age < 1) {
      toast.error("Name, description and administration age (>=1) are required")
      return
    }
    try {
      setSubmitting(true)
      const ok = await onSubmit({ name: name.trim(), description: description.trim(), administration_age: age })
      if (ok) {
        setName("")
        setDescription("")
        setAdministrationAge("")
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
          <DialogTitle>Add Vaccine</DialogTitle>
          <DialogDescription>Create a new vaccine category</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Newcastle Disease" />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" />
          </div>
          <div>
            <Label>Administration Age (days) *</Label>
            <Input
              type="number"
              min={1}
              value={administrationAge}
              onChange={(e) => setAdministrationAge(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g., 7"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Vaccine"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function VaccinationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState("Name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const revalidator = useRevalidator()

  const loaderData = useLoaderData() as { vaccines: VaccineData[] | null }
  const vaccines: VaccineData[] = Array.isArray(loaderData)
    ? (loaderData as unknown as VaccineData[])
    : loaderData?.vaccines ?? []

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filteredCategories = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return vaccines
    return vaccines.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description || "").toLowerCase().includes(q),
    )
  }, [debouncedSearch, vaccines])

  const sortedCategories = useMemo(() => {
    const arr = [...filteredCategories]
    switch (sortBy) {
      case "Name":
        return arr.sort((a, b) => a.name.localeCompare(b.name))
      case "Products (Most)":
        return arr.sort((a, b) => (a.products?.length || 0) - (b.products?.length || 0)).reverse()
      case "Products (Least)":
        return arr.sort((a, b) => (a.products?.length || 0) - (b.products?.length || 0))
      default:
        return arr
    }
  }, [filteredCategories, sortBy])

  const handleCreateVaccineProduct = async (form: NewVaccineForm): Promise<boolean> => {
    try {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) {
        toast.error("Missing authentication or active farm")
        return false
      }
      if (!form.poultry_vaccine_id || !form.administration_method_id || !form.name || !form.manufacturer) {
        toast.error("Please complete all required fields")
        return false
      }
      const payload = {
        poultry_vaccine_id: Number(form.poultry_vaccine_id),
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
      const res = await createVaccineProduct(token, farm.id, payload)
      if (res.success) {
        toast.success("Vaccine product created successfully!")
        revalidator.revalidate()
        return true
      } else {
        const err = Array.isArray(res.error) ? res.error.join("\n") : (res.error || "Failed to create vaccine product")
        toast.error(err)
        return false
      }
    } catch (e) {
      toast.error("Failed to create vaccine product")
      return false
    }
  }

  const handleCreateVaccineCategory = async (data: { name: string; description: string; administration_age: number }): Promise<boolean> => {
    try {
      const token = GetToken()
      const farm = getFarm()
      if (!token || !farm) {
        toast.error("Missing authentication or active farm")
        return false
      }
      const response = await axios.post(
        `/api/farms/${farm.id}/vaccines`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 201) {
        toast.success("Vaccine created successfully")
        revalidator.revalidate()
        return true
      }
      toast.error(`Failed to create vaccine (${response.status})`)
      return false
    } catch (e: any) {
      const msg = e?.response?.data?.errors || e?.response?.data?.message || "Failed to create vaccine"
      toast.error(Array.isArray(msg) ? msg.join("\n") : String(msg))
      return false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Vaccine Categories</h2>
              <p className="text-muted-foreground">Organize and manage your vaccine categories</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => setIsCreateCategoryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vaccine
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg bg-blue-500 text-white p-6">
              <p className="text-sm font-medium opacity-90">Total Categories</p>
              <p className="text-3xl font-bold mt-2">{vaccines.length}</p>
              <div className="mt-4 text-2xl">📁</div>
            </div>
            <div className="rounded-lg bg-green-500 text-white p-6">
              <p className="text-sm font-medium opacity-90">Total Products</p>
              <p className="text-3xl font-bold mt-2">{vaccines.reduce((sum, cat) => sum + (cat.products?.length || 0), 0)}</p>
              <div className="mt-4 text-2xl">💉</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Search Vaccine Categories</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or description..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Sort by</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Name">Name (A-Z)</SelectItem>
                      <SelectItem value="Products (Most)">Products (Most)</SelectItem>
                      <SelectItem value="Products (Least)">Products (Least)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 md:justify-end">
              <Button variant="outline" onClick={() => setViewMode("grid")} className="">Grid</Button>
              <Button variant="outline" onClick={() => setViewMode("list")} className="">List</Button>
            </div>
          </div>

          {/* Categories Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className={` h-24 flex items-center justify-center text-white text-4xl`}>
                    💉
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{category.products?.length || 0}</p>
                      </div>
                      <div></div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">Updated: {category.updated_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border border-border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={` h-16 w-16 rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0`}
                      >
                        💉
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                        <p className="text-xs text-muted-foreground">Updated: {category.updated_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Products</p>
                      <p className="text-2xl font-bold">{category.products?.length || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Usage Frequency</p>
                      <p className="font-semibold">0</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Products</p>
                      <p className="font-semibold">{category.products?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold text-green-600">Active</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-semibold">{category.updated_at}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <CreateVaccineCategoryModal isOpen={isCreateCategoryOpen} onClose={() => setIsCreateCategoryOpen(false)} onSubmit={handleCreateVaccineCategory} />
      <CreateVaccineModal vaccines={vaccines} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateVaccineProduct} />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
    </div>
  )
}
