"use client"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Pill,
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Calendar,
  Thermometer,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  BarChart3,
  AlertCircle,
  ShoppingCart,
  Droplet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLoaderData } from "react-router-dom"
import type { VaccineInventory } from "@/lib/types"
import AddVaccineInventoryModal from "@/components/modals/AddVaccineInventoryModal"



function getStockStatus(current: number, minimum: number, maximum: number) {
  if (current <= minimum) return { status: "low", color: "bg-red-100 text-red-800 border-red-200" }
  if (current >= maximum * 0.8) return { status: "high", color: "bg-green-100 text-green-800 border-green-200" }
  return { status: "medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
}

function VaccinationInventoryCard({
  item,
  onEdit,
  onDelete,
  onAdjust,
}: {
  item: VaccineInventory
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAdjust: (id: number) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // normalize fields to handle different backend shapes
  const available = (item.available_quantity as number) || 0
  const min = (item.product?.min_stock_level ?? 0) as number
  const max = (item.quantity ?? 0) as number
  const cost = (item.unit_cost ?? 0) as number
  const expiry = (item.expiry_date) as string | undefined
  const lastRestocked = (item.updated_at) as string | undefined
  const batch = (item.batch_number) as string
  const notes = (item.notes) as string
  const name = (item.manufacturer) as string
  const category = (item.product?.name) as string
  // ensure dosage is a number (fallback to 1) and normalize unit
  const dosage = Number(item.product?.dosage ?? 1)
  const dosageUnit = (item.product?.dosage_unit ?? "") as string

  const stockStatus = getStockStatus(available, min, max)
  const totalValue = available * cost
  const isExpiring = expiry ? new Date(expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false

  return (
    <Card className={cn("transition-all duration-200", stockStatus.status === "low" && "border-red-200 bg-red-50/30")}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">{name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50">
                      {category}
                    </Badge>
                    <Badge className={cn("font-medium text-xs", stockStatus.color)}>
                      {stockStatus.status.toUpperCase()}
                    </Badge>
                    {isExpiring && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
                  <p className="text-sm font-medium text-gray-900">
                    {available * dosage} {dosageUnit}
                  </p>
                 
                  <p className="text-xs text-gray-500">Min: {min}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
       
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="font-medium">${totalValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Expiry Date</p>
                  <p className="font-medium">{expiry ? new Date(expiry).toLocaleDateString() : "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Storage Temp</p>
                  <p className="font-medium">{ "-"}</p>
                </div>
              </div>
               <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Available Quantity</p>
                  <p className="font-medium">{available || "-"}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="font-medium">{available || "-"}</p>
                </div>
              </div>
               <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Dosage Per Unit</p>
                  <p className="font-medium">{dosage|| "-"} {dosageUnit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Batch Number</p>
                  <p className="font-medium">{batch || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="font-medium">{lastRestocked ? new Date(lastRestocked).toLocaleDateString() : "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{}</p>
                </div>
              </div>
            </div>

            {notes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-1">Notes</p>
                <p className="text-sm text-blue-700">{notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button size="sm" onClick={() => onAdjust(item.id)} className="bg-blue-600 hover:bg-blue-700">
                <TrendingDown className="h-3 w-3 mr-1" />
                Adjust Stock
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(item.id)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function VaccinationInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("stock")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)

  const { vaccineInventories } = useLoaderData() as { vaccineInventories: VaccineInventory[] }
  console.log('Vaccination Inventories page:', vaccineInventories);
  
  const initialList = vaccineInventories ?? []
  // local items state so we can optimistically add new inventory locally without waiting for a reload
  const [items, setItems] = useState<VaccineInventory[]>(initialList)

  // sync when loader data changes
  useEffect(() => {
    setItems(initialList)
  }, [initialList])

  // modal state
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredAndSorted = useMemo(() => {
    const filtered = items.filter((item) => {
      const name = ((item.product as any)?.name ?? "").toString()
      const manufacturer = ((item.manufacturer ?? "") as string).toString()
      const search = searchTerm.toLowerCase()

      const matchesSearch = name.toLowerCase().includes(search) || manufacturer.toLowerCase().includes(search)
      const matchesCategory = categoryFilter === "all" || ( (item.product )?.name ?? "") === categoryFilter

      const available =  item.available_quantity
      const min = item.product?.min_stock_level ?? 0
      const max = item.quantity 

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && available <= min) ||
        (stockFilter === "medium" && available > min && (max ? available < max * 0.8 : available > min)) ||
        (stockFilter === "high" && max && available >= max * 0.8)

      return matchesSearch && matchesCategory && matchesStock
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return ((a.product )?.name ?? "").toString().localeCompare(((b.product )?.name ?? "").toString())
        case "stock":
          return (b.available_quantity ?? 0) - (a.available_quantity ?? 0)
        case "value":
          return (b.available_quantity ) * (b.unit_cost ) - ( a.available_quantity ) * (a.unit_cost )
        case "expiry":
          return new Date(a.expiry_date ).getTime() - new Date( b.expiry_date).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [searchTerm, categoryFilter, stockFilter, sortBy, items])

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / perPage)
  const paginatedList = useMemo(() => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredAndSorted.slice(start, end)
  }, [filteredAndSorted, page, perPage])

  // Ensure current page is within range when filtered results change
  useEffect(() => {
    if (totalPages === 0) {
      setPage(1)
      return
    }
    if (page > totalPages) setPage(totalPages)
  }, [totalPages])

  const lowStockItems = items.filter((item) => ( item.available_quantity ) <= ((item.product )?.min_stock_level ?? Infinity)).length
  const expiringItems = items.filter((item) => {
    const expiry =  item.expiry_date
    return expiry ? new Date(expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false
  }).length
  const totalValue = items.reduce((sum, item) => sum + (item.available_quantity ) * ( item.unit_cost ), 0)

  const handleEdit = (id: number) => {
    console.log("Edit Vaccination:", id)
  }

  const handleDelete = (id: number) => {
    console.log("Delete Vaccination:", id)
  }

  const handleAdjust = (id: number) => {
    console.log("Adjust stock:", id)
  }

  const categories = Array.from(new Set(items.map((item) => ( (item.product )?.name ?? "").toString()))).filter((c) => !!c)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, categoryFilter, stockFilter, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Vaccination Inventory</h1>
              <p className="text-gray-600">Track and manage Vaccination stock levels and expiry dates</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vaccination
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
                  <p className="text-blue-100 text-sm">Total Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Low Stock</p>
                  <p className="text-2xl font-bold">{lowStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Expiring Soon</p>
                  <p className="text-2xl font-bold">{expiringItems}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Value</p>
                  <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(1)}k</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by name or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Stock Level</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="value">Total Value</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        <div className="space-y-4">
          {paginatedList.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            paginatedList.map((item) => (
              <VaccinationInventoryCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdjust={handleAdjust}
              />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="text-gray-700 hover:bg-gray-100"
              >
                Previous
              </Button>
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="text-gray-700 hover:bg-gray-100"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Vaccination Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <AddVaccineInventoryModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            existingItems={items}
            onCreated={(item) => setItems((prev) => [item, ...prev])}
          />
        </div>
      )}
    </div>
  )
}
