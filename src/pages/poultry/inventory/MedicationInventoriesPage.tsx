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
} from "lucide-react"
import { cn, Naira, formatCurrency, getExpiryStatus } from "@/lib/utils"
import { useLoaderData, useRevalidator } from "react-router-dom"
import type { MedicationInventory } from "@/lib/types"
import AddMedicationInventoryModal from "@/components/modals/AddMedicationInventoryModal"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { toast } from "react-toastify"



function getStockStatus(current: number, minimum: number, maximum: number) {
  if (current <= minimum) return { status: "low", color: "bg-red-100 text-red-800 border-red-200" }
  if (current >= maximum * 0.8) return { status: "high", color: "bg-green-100 text-green-800 border-green-200" }
  return { status: "medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
}

function MedicationInventoryCard({
  item,
  onEdit,
  onDelete,
  onAdjust,
}: {
  item: MedicationInventory
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAdjust: (id: number) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // normalize fields from backend / different shapes so component is robust
  const available = item.available_quantity ?? 0
  const unitCost = item.unit_cost ?? 0
  const expiry = (item as any).expiry_date ?? ""
  const lastRestocked = (item as any).last_restocked ?? (item as any).lastRestocked ?? (item as any).lastRestockedDate ?? ""
  const batchNumber = (item as any).batch_number ?? (item as any).batchNumber ?? ""
  const storageTemp = (item as any).storage_temp ?? (item as any).storageTemp ?? ""
  const unit = (item as any).unit ?? (item as any).unit_of_measure ?? ""
  const notes = (item as any).notes ?? (item as any).note ?? ""
  const maxStock = (item as any).maximumStock ?? (item as any).maximum_stock ?? (item as any).maximum ?? 0
  const minStock = (item.product as any)?.min_stock_level ?? 0
  const displayName = (item.product as any)?.name ?? (item as any).name ?? "Unknown"
  const displayCategory = (item as any).product?.category ?? (item as any).category ?? "Uncategorized"
  const location = (item as any).location ?? "-"
  const totalQuantity = (item as any).quantity ?? 0
  const stockStatus = getStockStatus(available, minStock, maxStock)
  const totalValue = available * unitCost
  const isExpiring = getExpiryStatus(expiry) === "expiring_soon"
  const isExpired = getExpiryStatus(expiry) === "expired"

  return (
    <Card className={cn("group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden", stockStatus.status === "low" && "border-red-200 bg-red-50/30")}>
      <div className={`h-2 bg-gradient-to-r ${
        stockStatus.status === "low" ? "from-red-500 to-red-600" :
        stockStatus.status === "high" ? "from-green-500 to-green-600" :
        "from-yellow-500 to-yellow-600"
      }`}></div>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors pb-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Pill className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-900">{displayName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50">
                      {displayCategory}
                    </Badge>
                    <Badge className={cn("font-medium text-xs", stockStatus.color)}>
                      {stockStatus.status.toUpperCase()}
                    </Badge>
                    {isExpired && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {isExpiring && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {available} {unit}
                  </p>
                  <p className="text-xs text-gray-500">Min: {minStock}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="font-medium">{Naira}{formatCurrency(totalValue)}</p>
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
                  <p className="font-medium">{storageTemp || "-"}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Quantity </p>
                  <p className="font-medium">{totalQuantity || "-"}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Available Quantity </p>
                  <p className="font-medium">{available || "-"}</p>
                </div>
              </div>
               <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Dosage</p>
                  <p className="font-medium">{item.product?.dosage || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Batch Number</p>
                  <p className="font-medium">{batchNumber || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Last Restocked</p>
                  <p className="font-medium">{lastRestocked ? new Date(lastRestocked).toLocaleDateString() : "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{location}</p>
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
              <ActionGate anyOf={ACTIONS.medicationInventory.update}>
                <Button size="sm" onClick={() => onAdjust(item.id)} className="bg-blue-600 hover:bg-blue-700">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Adjust Stock
                </Button>
              </ActionGate>
              <ActionGate anyOf={ACTIONS.medicationInventory.update}>
                <Button size="sm" variant="outline" onClick={() => onEdit(item.id)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </ActionGate>
              <ActionGate anyOf={ACTIONS.medicationInventory.delete}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </ActionGate>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function MedicationInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("stock")
  const [showAddModal, setShowAddModal] = useState(false)
  const {medicationInventories} =  useLoaderData() as {medicationInventories: MedicationInventory[]}
  const revalidator = useRevalidator()
  const [items, setItems] = useState<MedicationInventory[]>(() => medicationInventories ?? [])
  useEffect(() => {
    setItems(medicationInventories ?? [])
  }, [medicationInventories])
  const filteredAndSorted = useMemo(() => {
    const list = medicationInventories ?? items

    const filtered = list.filter((item) => {
      const name = (item.product as any)?.name ?? (item as any).name ?? ""
      const manufacturer = ((item as any).manufacturer ?? "") as string
      const search = searchTerm.toLowerCase()

      const matchesSearch = name.toLowerCase().includes(search) || manufacturer.toLowerCase().includes(search)

      const matchesCategory = categoryFilter === "all" || ((item.product as any)?.name ?? (item as any).category ?? "") === categoryFilter

      const available = item.available_quantity ?? (item as any).quantity ?? 0
      const min = (item.product as any)?.min_stock_level ?? 0
      const max = (item as any).maximumStock ?? (item as any).maximum_stock ?? (item as any).maximum ?? 0

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
          return (a.product?.name ?? "").localeCompare(b.product?.name ?? "")
        case "stock":
          return (b.available_quantity ?? b.quantity ?? 0) - (a.available_quantity ?? a.quantity ?? 0)
        case "value":
          return (b.available_quantity ?? b.quantity ?? 0) * (b.unit_cost ?? 0) - (a.available_quantity ?? a.quantity ?? 0) * (a.unit_cost ?? 0)
        case "expiry":
          return new Date((a as any).expiry_date ?? (a as any).expiryDate ?? (a as any).expiry ?? "").getTime() - new Date((b as any).expiry_date ?? (b as any).expiryDate ?? (b as any).expiry ?? "").getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [searchTerm, categoryFilter, stockFilter, sortBy, medicationInventories])

  const lowStockItems = (medicationInventories ?? []).filter((item) => (item.available_quantity ?? (item as any).quantity ?? 0) <= ((item.product as any)?.min_stock_level ?? Infinity)).length
  const expiringItems = (medicationInventories ?? []).filter((item) => {
    const expiry = (item as any).expiry_date ?? (item as any).expiryDate ?? (item as any).expiry
    return getExpiryStatus(expiry) === "expiring_soon"
  }).length
  const totalValue = (medicationInventories ?? []).reduce((sum, item) => sum + (item.available_quantity ?? (item as any).quantity ?? 0) * ((item as any).unit_cost ?? (item as any).unitCost ?? 0), 0)

  const handleEdit = (id: number) => {
    console.log("Edit medication:", id)
  }

  const handleDelete = (id: number) => {
    console.log("Delete medication:", id)
  }

  const handleAdjust = (id: number) => {
    console.log("Adjust stock:", id)
  }

  const categories = Array.from(
    new Set((medicationInventories ?? []).map((item) => (item.product as any)?.name ?? (item as any).category ?? "")),
  ).filter((cat) => !!cat)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Medication Inventory</h1>
              <p className="text-gray-600 text-lg">Track and manage medication stock levels and expiry dates</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" className="border-gray-300">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
              <ActionGate anyOf={ACTIONS.medicationInventory.create}>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Medication Inventory
                </Button>
              </ActionGate>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-blue-900">{medicationInventories.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-red-900">{lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-900">{expiringItems}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-green-900">{Naira}{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-11 border-gray-300">
                  <SelectValue placeholder="Category" />
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

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[140px] h-11 border-gray-300">
                  <SelectValue placeholder="Stock Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-11 border-gray-300">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stock">Stock Level</SelectItem>
                  <SelectItem value="value">Total Value</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-500 whitespace-nowrap">
                Showing {filteredAndSorted.length} items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        <div className="space-y-4">
          {filteredAndSorted.length === 0 ? (
            <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No medication inventory found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find inventory items."
                  : "Get started by adding your first medication inventory item."}
              </p>
              {(!searchTerm && categoryFilter === "all" && stockFilter === "all") && (
                <ActionGate anyOf={ACTIONS.medicationInventory.create}>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Inventory Item
                  </Button>
                </ActionGate>
              )}
            </Card>
          ) : (
            filteredAndSorted.map((item: MedicationInventory) => (
              <MedicationInventoryCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdjust={handleAdjust}
              />
            ))
          )}
        </div>
      </div>

      <AddMedicationInventoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingItems={items}
        onCreated={async (item) => {
          // trigger loader revalidation so page reloads server data
          try {
            await revalidator.revalidate()
            toast.success('Medication inventory added')
          } catch (e) {
            // fallback to optimistic update if revalidation fails
            setItems((prev) => [item, ...prev])
            toast.success('Medication inventory added (local)')
          }
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
