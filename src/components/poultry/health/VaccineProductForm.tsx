import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Syringe, X } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/hooks/usePermissions"
import type { AdministrationMethod, VaccineData, VaccineProduct } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  hasAnyPermission,
  missingPermissions,
  VACCINE_PRODUCT_PAGE_PERMISSIONS,
} from "@/lib/vaccineProductPermissions"
import {
  createVaccine,
  createVaccineProduct,
  getAdministrationMethods,
  getVaccines,
  GetToken,
  getFarm,
  updateVaccineProduct,
} from "@/lib/request"

const selectClassName = cn(
  "border-input flex h-9 w-full min-w-0 appearance-none rounded-md border bg-white px-3 py-1 text-base shadow-xs outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
)

const defaultForm = {
  poultry_vaccine_id: "",
  name: "",
  manufacturer: "",
  administration_method_id: "",
  withdrawal_period: 0,
  withdrawal_period_unit: "days" as "days" | "hours",
  dosage: "",
  dosage_unit: "ml",
  min_stock_level: 0,
}

interface VaccineProductFormProps {
  vaccines: VaccineData[]
  editingProduct?: VaccineProduct | null
  onCancel: () => void
  onSuccess: () => void
  onVaccineCreated?: (vaccine: VaccineData) => void
}

export function VaccineProductForm({
  vaccines,
  editingProduct,
  onCancel,
  onSuccess,
  onVaccineCreated,
}: VaccineProductFormProps) {
  const isEditing = Boolean(editingProduct)
  const { permissions, isLoading: permissionsLoading } = usePermissions()
  const [form, setForm] = useState(defaultForm)
  const [adminMethods, setAdminMethods] = useState<AdministrationMethod[]>([])
  const [fetchedVaccines, setFetchedVaccines] = useState<VaccineData[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNewVaccine, setShowNewVaccine] = useState(false)
  const [newVaccineName, setNewVaccineName] = useState("")
  const [newVaccineDescription, setNewVaccineDescription] = useState("")
  const [newVaccineAge, setNewVaccineAge] = useState(1)

  const canCreateProduct = hasAnyPermission(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.createProduct)
  const canUpdateProduct = hasAnyPermission(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.updateProduct)
  const canCreateVaccineType = hasAnyPermission(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.createVaccineType)
  const canSubmit = isEditing ? canUpdateProduct : canCreateProduct

  const missingForSubmit = isEditing
    ? missingPermissions(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.updateProduct)
    : missingPermissions(permissions, VACCINE_PRODUCT_PAGE_PERMISSIONS.createProduct)

  const isDefaultProduct = isEditing && editingProduct?.farm_id == null
  const readOnly = isDefaultProduct

  useEffect(() => {
    if (editingProduct) {
      setForm({
        poultry_vaccine_id: String(editingProduct.poultry_vaccine_id),
        name: editingProduct.name,
        manufacturer: editingProduct.manufacturer,
        administration_method_id: editingProduct.administration_method_id
          ? String(editingProduct.administration_method_id)
          : "",
        withdrawal_period: editingProduct.withdrawal_period ?? 0,
        withdrawal_period_unit: (editingProduct.withdrawal_period_unit as "days" | "hours") || "days",
        dosage: editingProduct.dosage != null ? String(editingProduct.dosage) : "",
        dosage_unit: editingProduct.dosage_unit || "ml",
        min_stock_level: editingProduct.min_stock_level ?? 0,
      })
    } else {
      setForm(defaultForm)
    }
    setShowNewVaccine(false)
    setLoadError(null)
  }, [editingProduct])

  useEffect(() => {
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) {
      setLoadError("Not signed in or no active farm selected.")
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([getAdministrationMethods(token, farm.id), getVaccines(token, farm.id)])
      .then(([methodsRes, vaccinesRes]) => {
        if (methodsRes.success && methodsRes.data) {
          setAdminMethods(methodsRes.data)
        } else {
          setLoadError((methodsRes.error || []).join(" ") || "Could not load administration methods.")
        }
        if (vaccinesRes.success && vaccinesRes.data) {
          setFetchedVaccines(vaccinesRes.data.map((v) => ({ ...v, products: [] })))
        } else {
          setLoadError((prev) =>
            prev ||
            (vaccinesRes.error || []).join(" ") ||
            "Could not load vaccine types. Check vaccine permissions and re-login.",
          )
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const vaccineOptions = useMemo(() => {
    const byId = new Map<number, VaccineData>()
    for (const vaccine of [...vaccines, ...fetchedVaccines]) {
      if (vaccine?.id == null || !vaccine.name) continue
      byId.set(Number(vaccine.id), vaccine)
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [vaccines, fetchedVaccines])

  const handleCreateVaccineType = async () => {
    if (!canCreateVaccineType) {
      toast.error(`Need one of: ${VACCINE_PRODUCT_PAGE_PERMISSIONS.createVaccineType.join(", ")}`)
      return
    }
    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) return
    if (!newVaccineName.trim()) {
      toast.error("Vaccine name is required")
      return
    }
    const res = await createVaccine(token, farm.id, {
      name: newVaccineName.trim(),
      description: newVaccineDescription.trim() || `${newVaccineName.trim()} vaccination`,
      administration_age: newVaccineAge,
    })
    if (!res.success || !res.data) {
      toast.error((res.error || []).join("\n") || "Failed to create vaccine type")
      return
    }
    const created: VaccineData = { ...res.data, products: [] }
    setFetchedVaccines((prev) => [...prev.filter((v) => v.id !== created.id), created])
    onVaccineCreated?.(created)
    setForm((prev) => ({ ...prev, poultry_vaccine_id: String(created.id) }))
    setShowNewVaccine(false)
    setNewVaccineName("")
    setNewVaccineDescription("")
    toast.success("Vaccine type created")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error(`You need one of: ${missingForSubmit.join(", ")}. Re-login after permissions are granted.`)
      return
    }

    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm) {
      toast.error("Missing authentication or active farm")
      return
    }

    const poultryVaccineId = Number(form.poultry_vaccine_id)
    const adminMethodId = Number(form.administration_method_id)
    if (!form.name.trim() || !form.manufacturer.trim() || !poultryVaccineId || !adminMethodId) {
      toast.error("Please complete all required fields")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        poultry_vaccine_id: poultryVaccineId,
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim(),
        administration_method_id: adminMethodId,
        withdrawal_period: form.withdrawal_period || 0,
        withdrawal_period_unit: form.withdrawal_period_unit,
        dosage: form.dosage === "" ? undefined : Number(form.dosage),
        dosage_unit: form.dosage_unit || undefined,
        min_stock_level: form.min_stock_level ?? 0,
      }

      const res = isEditing && editingProduct
        ? await updateVaccineProduct(token, farm.id, editingProduct.id, payload)
        : await createVaccineProduct(token, farm.id, payload)

      if (res.success) {
        toast.success(isEditing ? "Vaccine product updated" : "Vaccine product created")
        onSuccess()
      } else {
        toast.error((res.error || []).join("\n") || "Request failed")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-violet-200 shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Syringe className="h-5 w-5 text-violet-600" />
            {isEditing ? "Edit vaccine product" : "Add vaccine product"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details below. All fields are editable — save is checked against your permissions.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {permissionsLoading && (
          <p className="mb-4 text-sm text-muted-foreground">Loading your permissions…</p>
        )}

        {!permissionsLoading && !canSubmit && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              You can fill the form, but saving needs an extra permission
            </p>
            <p className="mt-1">Need one of: {missingForSubmit.join(", ")}</p>
            <p className="mt-2 text-xs">
              Run <code className="rounded bg-amber-100 px-1">php artisan db:seed --class=GrantVaccineHealthPermissionsSeeder</code> then log out and back in.
            </p>
          </div>
        )}

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        )}

        {loading && <p className="mb-4 text-sm text-muted-foreground">Loading vaccine types and methods…</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="vp-vaccine-type">Vaccine type *</Label>
              <div className="flex flex-wrap items-end gap-2">
                <select
                  id="vp-vaccine-type"
                  className={selectClassName}
                  style={{ flex: "1 1 12rem" }}
                  value={form.poultry_vaccine_id}
                  onChange={(e) => setForm((p) => ({ ...p, poultry_vaccine_id: e.target.value }))}
                  disabled={readOnly}
                  required
                >
                  <option value="" disabled>
                    {loading ? "Loading…" : "Select vaccine type"}
                  </option>
                  {vaccineOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {!isEditing && (
                  <Button type="button" variant="outline" onClick={() => setShowNewVaccine((v) => !v)}>
                    New type
                  </Button>
                )}
              </div>
            </div>

            {showNewVaccine && (
              <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="vp-new-vaccine-name">New vaccine name</Label>
                    <Input
                      id="vp-new-vaccine-name"
                      value={newVaccineName}
                      onChange={(e) => setNewVaccineName(e.target.value)}
                      placeholder="e.g. Newcastle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vp-new-vaccine-age">Administration age (days)</Label>
                    <Input
                      id="vp-new-vaccine-age"
                      type="number"
                      min={1}
                      value={newVaccineAge}
                      onChange={(e) => setNewVaccineAge(Number(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vp-new-vaccine-desc">Description</Label>
                  <Textarea
                    id="vp-new-vaccine-desc"
                    value={newVaccineDescription}
                    onChange={(e) => setNewVaccineDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button type="button" size="sm" onClick={() => void handleCreateVaccineType()}>
                  Save vaccine type
                </Button>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="vp-product-name">Product name *</Label>
              <Input
                id="vp-product-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Lasota Live"
                readOnly={readOnly}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-manufacturer">Manufacturer *</Label>
              <Input
                id="vp-manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
                placeholder="e.g. Zoetis"
                readOnly={readOnly}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-admin-method">Administration method *</Label>
              <select
                id="vp-admin-method"
                className={selectClassName}
                value={form.administration_method_id}
                onChange={(e) => setForm((p) => ({ ...p, administration_method_id: e.target.value }))}
                disabled={readOnly}
                required
              >
                <option value="" disabled>
                  Select method
                </option>
                {adminMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-min-stock">Minimum stock alert</Label>
              <Input
                id="vp-min-stock"
                type="number"
                min={0}
                value={form.min_stock_level}
                onChange={(e) => setForm((p) => ({ ...p, min_stock_level: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-dosage">Dosage</Label>
              <Input
                id="vp-dosage"
                type="number"
                step="0.01"
                min={0}
                value={form.dosage}
                onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-dosage-unit">Dosage unit</Label>
              <select
                id="vp-dosage-unit"
                className={selectClassName}
                value={form.dosage_unit}
                onChange={(e) => setForm((p) => ({ ...p, dosage_unit: e.target.value }))}
                disabled={readOnly}
              >
                <option value="ml">ml</option>
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="dose">dose</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-withdrawal">Withdrawal period</Label>
              <Input
                id="vp-withdrawal"
                type="number"
                min={0}
                value={form.withdrawal_period}
                onChange={(e) => setForm((p) => ({ ...p, withdrawal_period: Number(e.target.value) || 0 }))}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vp-withdrawal-unit">Withdrawal unit</Label>
              <select
                id="vp-withdrawal-unit"
                className={selectClassName}
                value={form.withdrawal_period_unit}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    withdrawal_period_unit: e.target.value as "days" | "hours",
                  }))
                }
                disabled={readOnly}
              >
                <option value="days">Days</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          {isDefaultProduct && (
            <p className="text-sm text-muted-foreground">
              Platform default products cannot be edited. Add a new farm product instead.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || readOnly || !canSubmit}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
