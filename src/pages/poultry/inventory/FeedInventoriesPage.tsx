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
  Wheat,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLoaderData } from "react-router-dom"
import AddFeedInventoryModal from "@/components/modals/AddFeedInventoryModal"
import { useRevalidator } from "react-router-dom"
import { toast } from "react-toastify"
import type {  FeedInventoryType } from "@/lib/types"

interface FeedInventoryItem {
  id: number
  name: string
  category: string
  manufacturer: string
  currentStock: number
  minimumStock: number
  lastUpdated : string
  quantity : number
  maximumStock: number
  unit: string
  costPerUnit: number
  expiryDate: string
  storageTemp: string
  batchNumber: string
  lastRestocked: string
  location: string
  notes: string
}


function getStockStatus(current: number, minimum: number, maximum: number) {
  if (current <= minimum) return { status: "low", color: "bg-red-100 text-red-800 border-red-200" }
  if (current >= maximum * 0.8) return { status: "high", color: "bg-green-100 text-green-800 border-green-200" }
  return { status: "medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
}

function FeedInventoryCard({
  item,
  onEdit,
  onDelete,
  onAdjust,
}: {
  item: FeedInventoryItem
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAdjust: (id: number) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const stockStatus = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock)
  const totalValue = item.currentStock * item.costPerUnit
  const isExpiring = new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return (
    <Card className={cn("transition-all duration-200", stockStatus.status === "low" && "border-red-200 bg-red-50/30")}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Wheat className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50">
                      {item.category}
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
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {item.currentStock} {item.unit}
                  </p>
                  <p className="text-xs text-gray-500">Min: {item.minimumStock}</p>
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
                  <p className="font-medium">${totalValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Expiry Date</p>
                  <p className="font-medium">{new Date(item.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Storage Temp</p>
                  <p className="font-medium">{item.storageTemp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Stocked Quantity </p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
              </div>
                  <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Available Quantity </p>
                  <p className="font-medium">{item.currentStock}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Batch Number</p>
                  <p className="font-medium">{item.batchNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="font-medium">{new Date(item.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{item.location}</p>
                </div>
              </div>
            </div>

            {item.notes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-1">Notes</p>
                <p className="text-sm text-blue-700">{item.notes}</p>
              </div>
            )}

            {/* <div className="flex items-center gap-2 pt-2 border-t">
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
            </div> */}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function FeedInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("stock")
  const [showAddModal, setShowAddModal] = useState(false)
  const revalidator = useRevalidator()
  const {feedInventories} = useLoaderData() as { feedInventories: FeedInventoryType[] | null }

  const initialList = feedInventories ?? [] as FeedInventoryType[]
  const [items, setItems] = useState<FeedInventoryType[]>(initialList)
  useEffect(() => { setItems(initialList) }, [initialList])

  console.log("Feedin Inventories : " , feedInventories);


  const feedInventoriesData = feedInventories ?? [] as FeedInventoryType[]

  // normalize items to the shape FeedInventoryCard expects (sanitizes various API shapes)
  const normalizedItems: FeedInventoryItem[] = feedInventoriesData.map((item) => {
    const available = (item as any).available_quantity ?? (item as any).currentStock ?? 0

    const minStock = (item as any).poultry_feed_type?.min_stock_level ?? (item as any).minimumStock ?? 0
    const maxStock = (item as any).poultry_feed_type?.max_stock_level ?? (item as any).maximumStock ?? 0
    const name = (item as any).poultry_feed_type?.name ?? (item as any).name ?? ((item as any).feed_type?.name ?? 'Unknown')

    return {
      id: (item as any).id,
      name,
      lastUpdated : (item as any).updated_at ?? new Date().toISOString(),
      quantity : (item as any).quantity ?? 0,
      category: (item as any).category ?? (item as any).poultry_feed_type?.category ?? 'General',
      manufacturer: (item as any).manufacturer ?? '',
      currentStock: Number(available),
      minimumStock: Number(minStock),
      maximumStock: Number(maxStock),
      unit: (item as any).unit ?? (item as any).poultry_feed_type?.unit ?? '',
      costPerUnit: Number((item as any).unit_cost ?? (item as any).costPerUnit ?? 0),
      expiryDate: (item as any).expiryDate ?? (item as any).expiry_date ?? '',
      storageTemp: (item as any).storage_temperature ?? (item as any).storageTemp ?? '',
      batchNumber: (item as any).batch_number ?? (item as any).batchNumber ?? '',
      lastRestocked: (item as any).last_restocked ?? (item as any).lastRestocked ?? new Date().toISOString(),
      location: (item as any).location ?? '',
      notes: (item as any).notes ?? '',
    }
  })

  // derived stats
  const lowStockItems = normalizedItems.filter((item) => item.currentStock <= item.minimumStock).length
  const expiringItems = normalizedItems.filter((item) => {
    if (!item.expiryDate) return false
    const exp = new Date(item.expiryDate)
    return !isNaN(exp.getTime()) && exp < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = normalizedItems.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

  // action handlers
  const handleEdit = (id: number) => {
    console.log("Edit Feed:", id)
  }

  const handleDelete = (id: number) => {
    console.log("Delete Feed:", id)
  }

  const handleAdjust = (id: number) => {
    console.log("Adjust stock:", id)
  }

  // categories for filter dropdown
  const categories = Array.from(new Set(normalizedItems.map((item) => item.category)))

  const filteredAndSorted = useMemo(() => {
    return normalizedItems
      .filter((item) => {
        // search filter
        if (searchTerm) {
          const q = searchTerm.toLowerCase()
          const name = item.name.toLowerCase()
          const manu = item.manufacturer?.toString().toLowerCase() ?? ''
          if (!name.includes(q) && !manu.includes(q)) return false
        }

        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false

        if (stockFilter !== 'all') {
          if (stockFilter === 'low' && !(item.currentStock <= item.minimumStock)) return false
          if (stockFilter === 'high' && !(item.currentStock >= item.maximumStock * 0.8)) return false
          if (stockFilter === 'medium' && !(item.currentStock > item.minimumStock && item.currentStock < item.maximumStock * 0.8)) return false
        }

        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'stock':
            return b.currentStock - a.currentStock
          case 'value':
            return b.currentStock * b.costPerUnit - a.currentStock * a.costPerUnit
          case 'expiry': {
            const da = new Date(a.expiryDate || 0).getTime()
            const db = new Date(b.expiryDate || 0).getTime()
            return da - db
          }
          case 'name':
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [normalizedItems, searchTerm, categoryFilter, stockFilter, sortBy])

  // pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // reset to first page when filters/search/perPage change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, stockFilter, sortBy, perPage, normalizedItems.length])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / perPage))
  const paginatedItems = filteredAndSorted.slice((currentPage - 1) * perPage, currentPage * perPage)

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))
  const handlePerPageChange = (n: number) => {
    setPerPage(n)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed Inventory</h1>
              <p className="text-gray-600">Track and manage Feed stock levels and expiry dates</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feed
              </Button>
              <AddFeedInventoryModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                existingItems={items}
                onCreated={async (item) => {
                  try {
                    await revalidator.revalidate()
                    toast.success('Feed inventory added')
                  } catch (_) {
                    setItems((prev) => [item, ...prev])
                    toast.success('Feed inventory added (local)')
                  }
                  setShowAddModal(false)
                }}
              />
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
                  <p className="text-2xl font-bold">{normalizedItems.length}</p>
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
          {filteredAndSorted.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            paginatedItems.map((item) => (
              <FeedInventoryCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdjust={handleAdjust}
              />
            ))
          )}
          {/* pagination controls */}
          {filteredAndSorted.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {(filteredAndSorted.length === 0) ? 0 : (currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, filteredAndSorted.length)} of {filteredAndSorted.length}
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(perPage)} onValueChange={(v) => handlePerPageChange(Number(v))}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={goPrev} disabled={currentPage <= 1}>
                  Prev
                </Button>
                <div className="text-sm text-gray-700">Page {currentPage} / {totalPages}</div>
                <Button size="sm" variant="outline" onClick={goNext} disabled={currentPage >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
