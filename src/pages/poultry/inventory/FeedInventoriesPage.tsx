"use client"
import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  Thermometer,
  Plus,
  Edit,
  Trash2,
  PackageX,
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
import CloseFeedInventoryModal from "@/components/modals/CloseFeedInventoryModal"
import UpdateFeedInventoryCostModal from "@/components/modals/UpdateFeedInventoryCostModal"
import { useRevalidator } from "react-router-dom"
import { toast } from "react-toastify"
import type {  FeedInventoryType } from "@/lib/types"
import { Naira, formatCurrency, formatDate, getExpiryStatus } from "@/lib/utils"
import { FEED_BAG_KG, formatBagsFromKg } from "@/lib/feed-bags"
import FeedInventoryUsageSection from "@/components/poultry/inventory/FeedInventoryUsageSection"
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog"
import { GetToken, getFarm, deleteFeedInventory } from "@/lib/request"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

interface FeedInventoryItem {
  id: number
  name: string
  category: string
  manufacturer: string
  stockedQuantity: number
  availableQuantity: number
  minimumStock: number
  lastUpdated : string
  maximumStock: number
  unit: string
  costPerUnit: number
  expiryDate: string
  storageTemp: string
  batchNumber: string
  lastRestocked: string
  location: string
  notes: string
  usageCount: number
  canDelete?: boolean
  status: string
  damagedQuantity: number
  closeNotes: string
  allocatedFlockLabel?: string
  createdAt: string
  manufactureDate: string
  closedAt: string
  lastUsedDate: string
}

const formatInventoryDate = (value?: string | null) => {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return formatDate(value)
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
  onClose,
  farmId,
  token,
  inventories,
  onUsageMoved,
}: {
  item: FeedInventoryItem
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAdjust: (id: number) => void
  onClose: (id: number) => void
  farmId: number
  token: string
  inventories: FeedInventoryType[]
  onUsageMoved?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const stockStatus = getStockStatus(item.availableQuantity, item.minimumStock, item.maximumStock)
  const totalValue = item.availableQuantity * item.costPerUnit
  const expiryStatus = getExpiryStatus(item.expiryDate)

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden",
      stockStatus.status === "low" && "border-red-200 bg-red-50/30",
      expiryStatus === "expired" && "border-red-300 bg-red-50/40"
    )}>
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
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wheat className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-900">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50">
                      {item.category}
                    </Badge>
                    <Badge className={cn("font-medium text-xs", stockStatus.color)}>
                      {stockStatus.status.toUpperCase()}
                    </Badge>
                    {item.status === "closed" && (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                        CLOSED
                      </Badge>
                    )}
                    {expiryStatus === "expired" && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {expiryStatus === "expiring_soon" && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
                    {item.batchNumber ? (
                      <span className="font-medium text-gray-700">Batch {item.batchNumber}</span>
                    ) : null}
                    <span>
                      Received{" "}
                      <span className="font-medium text-gray-800">
                        {formatInventoryDate(item.createdAt)}
                      </span>
                    </span>
                    {item.manufactureDate ? (
                      <span>
                        Mfg{" "}
                        <span className="font-medium text-gray-800">
                          {formatInventoryDate(item.manufactureDate)}
                        </span>
                      </span>
                    ) : null}
                    <span>
                      Expires{" "}
                      <span
                        className={cn(
                          "font-medium",
                          expiryStatus === "expired" && "text-red-700",
                          expiryStatus === "expiring_soon" && "text-orange-700",
                          expiryStatus !== "expired" && expiryStatus !== "expiring_soon" && "text-gray-800"
                        )}
                      >
                        {formatInventoryDate(item.expiryDate)}
                      </span>
                    </span>
                    {item.status === "closed" && item.closedAt ? (
                      <span>
                        Closed{" "}
                        <span className="font-medium text-gray-800">
                          {formatInventoryDate(item.closedAt)}
                        </span>
                      </span>
                    ) : null}
                    {item.lastUsedDate ? (
                      <span>
                        Last used{" "}
                        <span className="font-medium text-gray-800">
                          {formatInventoryDate(item.lastUsedDate)}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {item.availableQuantity} {item.unit}
                  </p>
                  <p className="text-xs font-medium text-amber-700">
                    {formatBagsFromKg(item.availableQuantity)} remaining
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Dates
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Received</p>
                  <p className="font-medium text-gray-900">{formatInventoryDate(item.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Manufactured</p>
                  <p className="font-medium text-gray-900">{formatInventoryDate(item.manufactureDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expires</p>
                  <p
                    className={cn(
                      "font-medium",
                      expiryStatus === "expired" && "text-red-700",
                      expiryStatus === "expiring_soon" && "text-orange-700"
                    )}
                  >
                    {formatInventoryDate(item.expiryDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last used</p>
                  <p className="font-medium text-gray-900">{formatInventoryDate(item.lastUsedDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last updated</p>
                  <p className="font-medium text-gray-900">{formatInventoryDate(item.lastUpdated)}</p>
                </div>
                {item.status === "closed" ? (
                  <div>
                    <p className="text-xs text-gray-500">Closed</p>
                    <p className="font-medium text-gray-900">{formatInventoryDate(item.closedAt)}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="font-medium">{Naira}{formatCurrency(totalValue)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Unit Cost</p>
                  <p className="font-medium">
                    {Naira}{formatCurrency(item.costPerUnit)}/{item.unit}
                  </p>
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
                  <p className="text-xs text-gray-500">Stocked Quantity</p>
                  <p className="font-medium">
                    {item.stockedQuantity} {item.unit}
                    <span className="text-xs text-muted-foreground font-normal">
                      {" "}({formatBagsFromKg(item.stockedQuantity)})
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Available Quantity</p>
                  <p className="font-medium">
                    {item.availableQuantity} {item.unit}
                    <span className="text-xs text-muted-foreground font-normal">
                      {" "}({formatBagsFromKg(item.availableQuantity)} remaining)
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Bag size</p>
                  <p className="font-medium">{FEED_BAG_KG} kg / bag</p>
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

            {item.status === "closed" && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                <p className="text-xs font-medium text-gray-800">Closed Inventory</p>
                <p className="text-sm text-gray-700">
                  Damaged: {item.damagedQuantity.toFixed(2)} {item.unit}
                </p>
                {item.closeNotes && (
                  <p className="text-sm text-gray-600">Reason: {item.closeNotes}</p>
                )}
                {item.allocatedFlockLabel && (
                  <p className="text-sm text-gray-600">
                    Cost allocated to: {item.allocatedFlockLabel}
                  </p>
                )}
              </div>
            )}

            {farmId > 0 && token && isExpanded && (
              <FeedInventoryUsageSection
                inventoryId={item.id}
                farmId={farmId}
                token={token}
                unit={item.unit}
                inventories={inventories}
                onUsageMoved={onUsageMoved}
              />
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <ActionGate anyOf={ACTIONS.feedInventory.update}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(item.id)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Update Cost
                </Button>
              </ActionGate>
              {item.status !== "closed" && item.availableQuantity > 0 && (
                <ActionGate anyOf={ACTIONS.feedInventory.update}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClose(item.id)}
                    className="text-amber-700 hover:text-amber-800 border-amber-200"
                  >
                    <PackageX className="h-3 w-3 mr-1" />
                    Close as Damaged
                  </Button>
                </ActionGate>
              )}
              {item.canDelete && (
                <ActionGate anyOf={ACTIONS.feedInventory.delete}>
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
              )}
            </div>
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
  const [deleteTarget, setDeleteTarget] = useState<FeedInventoryItem | null>(null)
  const [closeTarget, setCloseTarget] = useState<FeedInventoryItem | null>(null)
  const [costTarget, setCostTarget] = useState<FeedInventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const revalidator = useRevalidator()
  const {feedInventories} = useLoaderData() as { feedInventories: FeedInventoryType[] | null }

  const [items, setItems] = useState<FeedInventoryType[]>(() => feedInventories ?? [])
  useEffect(() => {
    setItems(feedInventories ?? [])
  }, [feedInventories])

  const feedInventoriesData = feedInventories ?? items
  const farmId = getFarm()?.id ?? 0
  const token = GetToken() ?? ""

  // normalize items to the shape FeedInventoryCard expects (sanitizes various API shapes)
  const normalizedItems: FeedInventoryItem[] = feedInventoriesData.map((item) => {
    // quantity = current remaining stock; available_quantity = original stocked amount
    const availableQuantity = Number((item as any).quantity ?? 0)
    const stockedQuantity = Number(
      (item as any).available_quantity ?? (item as any).quantity ?? 0
    )

    const minStock = (item as any).poultry_feed_type?.min_stock_level ?? (item as any).minimumStock ?? 0
    const maxStock = (item as any).poultry_feed_type?.max_stock_level ?? (item as any).maximumStock ?? 0
    const name = (item as any).poultry_feed_type?.name ?? (item as any).name ?? ((item as any).feed_type?.name ?? 'Unknown')

    return {
      id: (item as any).id,
      name,
      lastUpdated : (item as any).updated_at ?? new Date().toISOString(),
      stockedQuantity,
      availableQuantity,
      category: (item as any).category ?? (item as any).poultry_feed_type?.category ?? 'General',
      manufacturer: (item as any).manufacturer ?? '',
      minimumStock: Number(minStock),
      maximumStock: Number(maxStock),
      unit: (item as any).unit ?? (item as any).poultry_feed_type?.unit ?? 'kg',
      costPerUnit: Number((item as any).unit_cost ?? (item as any).costPerUnit ?? 0),
      expiryDate: (item as any).expiryDate ?? (item as any).expiry_date ?? '',
      manufactureDate: (item as any).manufacture_date ?? (item as any).manufactureDate ?? '',
      createdAt: (item as any).created_at ?? (item as any).createdAt ?? '',
      closedAt: (item as any).closed_at ?? (item as any).closedAt ?? '',
      lastUsedDate: (item as any).last_usage_date ?? (item as any).lastUsedDate ?? '',
      storageTemp: (item as any).storage_temperature ?? (item as any).storageTemp ?? '',
      batchNumber: (item as any).batch_number ?? (item as any).batchNumber ?? '',
      lastRestocked: (item as any).last_restocked ?? (item as any).lastRestocked ?? new Date().toISOString(),
      location: (item as any).location ?? '',
      notes: (item as any).notes ?? '',
      usageCount: Number((item as any).feed_usages_count ?? 0),
      canDelete: Boolean((item as any).can_delete),
      status: (item as any).status ?? 'available',
      damagedQuantity: Number((item as any).damaged_quantity ?? 0),
      closeNotes: (item as any).close_notes ?? '',
      allocatedFlockLabel: (item as any).allocated_flock
        ? `${(item as any).allocated_flock.name ?? 'Flock'} (${(item as any).allocated_flock.batch_number ?? '—'})`
        : '',
    }
  })

  // derived stats
  const lowStockItems = normalizedItems.filter((item) => item.availableQuantity <= item.minimumStock).length
  const expiringItems = normalizedItems.filter((item) => getExpiryStatus(item.expiryDate) === "expiring_soon").length
  const totalValue = normalizedItems.reduce((sum, item) => sum + item.availableQuantity * item.costPerUnit, 0)

  // action handlers
  const handleEdit = (id: number) => {
    const item = normalizedItems.find((entry) => entry.id === id) ?? null
    if (item) {
      setCostTarget(item)
    }
  }

  const handleDelete = (id: number) => {
    const item = normalizedItems.find((entry) => entry.id === id) ?? null
    if (item) {
      setDeleteTarget(item)
    }
  }

  const handleClose = (id: number) => {
    const item = normalizedItems.find((entry) => entry.id === id) ?? null
    if (item) {
      setCloseTarget(item)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !token || !farmId) return

    setIsDeleting(true)
    try {
      const response = await deleteFeedInventory(token, farmId, deleteTarget.id)
      if (response.success) {
        toast.success("Feed inventory deleted successfully")
        setDeleteTarget(null)
        revalidator.revalidate()
      } else {
        const message = Array.isArray(response.error)
          ? response.error.join(", ")
          : (typeof response.error === "string" ? response.error : "Failed to delete feed inventory")
        toast.error(message)
      }
    } catch {
      toast.error("Failed to delete feed inventory")
    } finally {
      setIsDeleting(false)
    }
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
          if (stockFilter === 'low' && !(item.availableQuantity <= item.minimumStock)) return false
          if (stockFilter === 'high' && !(item.availableQuantity >= item.maximumStock * 0.8)) return false
          if (stockFilter === 'medium' && !(item.availableQuantity > item.minimumStock && item.availableQuantity < item.maximumStock * 0.8)) return false
        }

        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'stock':
            return b.availableQuantity - a.availableQuantity
          case 'value':
            return b.availableQuantity * b.costPerUnit - a.availableQuantity * a.costPerUnit
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Feed Inventory</h1>
              <p className="text-gray-600 text-lg">Track and manage feed stock levels and expiry dates</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" className="border-gray-300">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
              <ActionGate anyOf={ACTIONS.feedInventory.create}>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Feed Inventory
                </Button>
              </ActionGate>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-blue-900">{normalizedItems.length}</p>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No feed inventory found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find inventory items."
                  : "Get started by adding your first feed inventory item."}
              </p>
              {(!searchTerm && categoryFilter === "all" && stockFilter === "all") && (
                <ActionGate anyOf={ACTIONS.feedInventory.create}>
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
            paginatedItems.map((item) => (
              <FeedInventoryCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClose={handleClose}
                onAdjust={handleAdjust}
                farmId={farmId}
                token={token}
                inventories={feedInventoriesData}
                onUsageMoved={() => revalidator.revalidate()}
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

      <DeleteConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Feed Inventory"
        itemName={deleteTarget?.name}
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" (batch ${deleteTarget.batchNumber || "—"})? This action cannot be undone.`
            : undefined
        }
      />

      <CloseFeedInventoryModal
        isOpen={Boolean(closeTarget)}
        onClose={() => setCloseTarget(null)}
        inventory={closeTarget}
        onClosed={() => {
          toast.success("Inventory closed and remaining stock recorded as damaged")
          setCloseTarget(null)
          revalidator.revalidate()
        }}
      />

      <UpdateFeedInventoryCostModal
        isOpen={Boolean(costTarget)}
        onClose={() => setCostTarget(null)}
        inventory={costTarget}
        onUpdated={() => {
          setCostTarget(null)
          revalidator.revalidate()
        }}
      />
    </div>
  )
}
