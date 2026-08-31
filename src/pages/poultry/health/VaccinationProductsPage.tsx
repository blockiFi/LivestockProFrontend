"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Edit,
  Eye,
  Package,
  Plus,
  RefreshCw,
  Search,
  Syringe,
  Trash2,
} from "lucide-react"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { VaccineProductForm } from "@/components/poultry/health/VaccineProductForm"
import { usePermissions } from "@/hooks/usePermissions"
import {
  hasAnyPermission,
  missingPermissions,
  VACCINE_PRODUCT_PAGE_PERMISSIONS,
} from "@/lib/vaccineProductPermissions"
import {
  deleteVaccineProduct,
  getFarm,
  getPoultryVaccineData,
  getVaccines,
  GetToken,
} from "@/lib/request"
import type { PoultryVaccineInventory, VaccineData, VaccineProduct } from "@/lib/types"
import { formatCurrency, Naira } from "@/lib/utils"

type ProductRow = {
  product: VaccineProduct
  vaccine: VaccineData
}

function getInventories(product: VaccineProduct): PoultryVaccineInventory[] {
  return product.inventories ?? []
}

function availableStock(product: VaccineProduct): number {
  return getInventories(product).reduce(
    (sum, inv) => sum + Number(inv.available_quantity ?? inv.quantity ?? 0),
    0
  )
}

function stockValue(product: VaccineProduct): number {
  return getInventories(product).reduce(
    (sum, inv) => sum + Number(inv.available_quantity ?? inv.quantity ?? 0) * Number(inv.unit_cost ?? 0),
    0
  )
}

function stockBadge(available: number, minLevel: number) {
  if (available <= minLevel) return "destructive"
  if (available <= minLevel * 1.5) return "secondary"
  return "default"
}

export default function VaccinationProductsPage() {
  const { permissions } = usePermissions()
  const missingPagePerms = missingPermissions(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.viewPage)
  const canAddProduct = hasAnyPermission(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.createProduct)

  const [vaccines, setVaccines] = useState<VaccineData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [vaccineFilter, setVaccineFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "stock" | "value">("name")
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<VaccineProduct | null>(null)
  const [detailProduct, setDetailProduct] = useState<ProductRow | null>(null)

  const loadData = useCallback(async () => {
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getPoultryVaccineData(token, farm.id)
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data]
        setVaccines(list as VaccineData[])
      } else {
        const fallback = await getVaccines(token, farm.id)
        if (fallback.success && fallback.data) {
          setVaccines(fallback.data.map((v) => ({ ...v, products: [] })))
        } else {
          toast.error("Failed to load vaccine products")
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const rows: ProductRow[] = useMemo(
    () =>
      vaccines.flatMap((vaccine) =>
        (vaccine.products ?? []).map((product) => ({ product, vaccine }))
      ),
    [vaccines]
  )

  const filteredRows = useMemo(() => {
    let list = rows
    if (vaccineFilter !== "all") {
      list = list.filter((row) => String(row.vaccine.id) === vaccineFilter)
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      list = list.filter(
        ({ product, vaccine }) =>
          product.name.toLowerCase().includes(term) ||
          product.manufacturer.toLowerCase().includes(term) ||
          vaccine.name.toLowerCase().includes(term)
      )
    }
    if (stockFilter !== "all") {
      list = list.filter(({ product }) => {
        const available = availableStock(product)
        const min = product.min_stock_level ?? 0
        if (stockFilter === "low") return available <= min
        if (stockFilter === "ok") return available > min
        return true
      })
    }
    return [...list].sort((a, b) => {
      if (sortBy === "stock") return availableStock(b.product) - availableStock(a.product)
      if (sortBy === "value") return stockValue(b.product) - stockValue(a.product)
      return a.product.name.localeCompare(b.product.name)
    })
  }, [rows, vaccineFilter, search, stockFilter, sortBy])

  const stats = useMemo(() => {
    const totalProducts = rows.length
    const lowStock = rows.filter(
      ({ product }) => availableStock(product) <= (product.min_stock_level ?? 0)
    ).length
    const totalValue = rows.reduce((sum, { product }) => sum + stockValue(product), 0)
    const farmProducts = rows.filter(({ product }) => product.farm_id != null).length
    return { totalProducts, lowStock, totalValue, farmProducts, vaccineTypes: vaccines.length }
  }, [rows, vaccines])

  const handleDelete = async (product: VaccineProduct) => {
    if (product.farm_id == null) {
      toast.error("Default platform products cannot be deleted")
      return
    }
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) return
    const res = await deleteVaccineProduct(token, farm.id, product.id)
    if (res.success) {
      toast.success("Product deleted")
      void loadData()
    } else {
      toast.error((res.error || []).join("\n") || "Delete failed")
    }
  }

  const openCreate = () => {
    setDetailProduct(null)
    setEditingProduct(null)
    setFormOpen(true)
  }

  const openEdit = (product: VaccineProduct) => {
    setDetailProduct(null)
    setEditingProduct(product)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vaccination Products</h1>
          <p className="text-muted-foreground">
            Manage vaccine catalogue, dosage details, and stock thresholds for your farm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/inventory/vaccination">View inventory</Link>
          </Button>
          <ActionGate anyOf={ACTIONS.vaccineProducts.manage}>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add vaccine product
            </Button>
          </ActionGate>
        </div>
      </div>

      {missingPagePerms.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex gap-3 pt-6 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Limited access — vaccine product permissions missing</p>
              <p className="mt-1">
                Your role needs one of: {missingPagePerms.join(", ")}. Ask the farm owner to assign these,
                or run on the server:{" "}
                <code className="rounded bg-amber-100 px-1 text-xs">
                  php artisan db:seed --class=GrantVaccineHealthPermissionsSeeder
                </code>
                , then log out and back in.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!canAddProduct && missingPagePerms.length === 0 && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="pt-6 text-sm text-amber-950">
            You can view products but cannot add them. Need one of:{" "}
            {VACCINE_PRODUCT_PAGE_PERMISSIONS.createProduct.join(", ")}.
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <VaccineProductForm
          vaccines={vaccines}
          editingProduct={editingProduct}
          onCancel={() => {
            setFormOpen(false)
            setEditingProduct(null)
          }}
          onSuccess={() => {
            setFormOpen(false)
            setEditingProduct(null)
            void loadData()
          }}
          onVaccineCreated={(vaccine) => setVaccines((prev) => [...prev, vaccine])}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <Syringe className="h-8 w-8 text-violet-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Farm-owned</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{stats.farmProducts}</p>
            <Package className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low stock</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{stats.lowStock}</p>
            <AlertTriangle className="h-8 w-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Naira}{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                className="pl-9"
                placeholder="Product, manufacturer, vaccine…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Vaccine type</Label>
            <Select value={vaccineFilter} onValueChange={setVaccineFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {vaccines.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Stock</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low stock</SelectItem>
                  <SelectItem value="ok">Healthy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-72" />
      ) : filteredRows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Syringe className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No vaccine products found</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Add your first product or adjust filters. You can also use platform defaults and add stock in inventory.
            </p>
            <ActionGate anyOf={ACTIONS.vaccineProducts.manage}>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add vaccine product
              </Button>
            </ActionGate>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Vaccine</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map(({ product, vaccine }) => {
                const available = availableStock(product)
                const min = product.min_stock_level ?? 0
                const method = (product as VaccineProduct & { administration_method?: { name?: string } }).administration_method?.name
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-left text-primary hover:underline"
                        onClick={() => setDetailProduct({ product, vaccine })}
                      >
                        {product.name}
                      </button>
                      {method && <p className="text-xs text-muted-foreground">{method}</p>}
                    </TableCell>
                    <TableCell>{vaccine.name}</TableCell>
                    <TableCell>{product.manufacturer}</TableCell>
                    <TableCell>
                      {product.dosage != null ? `${product.dosage} ${product.dosage_unit || ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stockBadge(available, min)}>
                        {available} / min {min}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Naira}{formatCurrency(stockValue(product))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.farm_id == null ? "Platform" : "Farm"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailProduct({ product, vaccine })}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <ActionGate anyOf={ACTIONS.vaccineProducts.update}>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ActionGate>
                        <ActionGate anyOf={ACTIONS.vaccineProducts.delete}>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={product.farm_id == null}
                            onClick={() => void handleDelete(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </ActionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}


      <Dialog open={Boolean(detailProduct) && !formOpen} onOpenChange={(open) => !open && setDetailProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{detailProduct.product.name}</DialogTitle>
                <DialogDescription>
                  {detailProduct.vaccine.name} · {detailProduct.product.manufacturer}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Withdrawal</dt><dd>{detailProduct.product.withdrawal_period ?? 0} {detailProduct.product.withdrawal_period_unit}</dd></div>
                <div><dt className="text-muted-foreground">Min stock</dt><dd>{detailProduct.product.min_stock_level ?? 0}</dd></div>
                <div><dt className="text-muted-foreground">Available</dt><dd>{availableStock(detailProduct.product)}</dd></div>
                <div><dt className="text-muted-foreground">Stock value</dt><dd>{Naira}{formatCurrency(stockValue(detailProduct.product))}</dd></div>
              </dl>
              <div className="space-y-2">
                <h4 className="font-medium">Inventory batches</h4>
                {getInventories(detailProduct.product).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stock recorded yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getInventories(detailProduct.product).map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.batch_number || "—"}</TableCell>
                          <TableCell className="text-right">{inv.available_quantity ?? inv.quantity}</TableCell>
                          <TableCell>{inv.expiry_date ? new Date(inv.expiry_date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="capitalize">{inv.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link to="/inventory/vaccination">Manage inventory</Link>
                </Button>
                <ActionGate anyOf={ACTIONS.vaccineProducts.update}>
                  <Button onClick={() => { setDetailProduct(null); openEdit(detailProduct.product) }}>Edit product</Button>
                </ActionGate>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
