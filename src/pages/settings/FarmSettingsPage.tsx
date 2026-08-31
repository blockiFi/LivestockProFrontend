import { useMemo, useState } from "react"
import { useLoaderData } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { StoreFarm, updateFarm } from "@/lib/request"
import { setActiveFarm } from "@/store/AuthenticationSlice"
import type { RootState } from "@/store"
import type { Farm } from "@/lib/types"

type LoaderData = {
  currentFarm: Farm | null
  countries: Array<{ id: number; name: string; code?: string | null }>
  permissions: string[]
}

export default function FarmSettingsPage() {
  const { currentFarm, countries } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const dispatch = useDispatch()
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.farmSettings.manage])

  const initialForm = useMemo(
    () => ({
      name: currentFarm?.name ?? "",
      address: currentFarm?.address ?? "",
      city: currentFarm?.city ?? "",
      state: currentFarm?.state ?? "",
      country_id: String(currentFarm?.country_id ?? ""),
      postal_code: currentFarm?.postal_code ?? "",
      phone: currentFarm?.phone ?? "",
      email: currentFarm?.email ?? "",
      website: currentFarm?.website ?? "",
      registration_number: currentFarm?.registration_number ?? "",
      tax_id: currentFarm?.tax_id ?? "",
      size_hectares: currentFarm?.size_hectares ?? "",
      established_date: currentFarm?.established_date?.slice(0, 10) ?? "",
      status: currentFarm?.status ? "active" : "inactive",
      notes: "",
    }),
    [currentFarm]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  const handleSave = async () => {
    if (!currentFarm) return

    setSaving(true)
    const response = await updateFarm(token, currentFarm.id, {
      ...form,
      country_id: Number(form.country_id),
      size_hectares: form.size_hectares ? Number(form.size_hectares) : null,
      established_date: form.established_date || null,
      logo: selectedLogo,
    })
    setSaving(false)

    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to update farm")
      return
    }

    StoreFarm(response.data)
    dispatch(setActiveFarm(response.data))
    commit({
      ...form,
      country_id: String(response.data.country_id),
      status: response.data.status ? "active" : "inactive",
    })
    setSelectedLogo(null)
    toast.success("Farm profile updated successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Farm profile</CardTitle>
          <CardDescription>Update the basic identity and registration details for your farm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-name">Farm name</Label>
              <Input id="farm-name" value={form.name} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-country">Country</Label>
              <Select value={form.country_id} onValueChange={(value) => setForm((prev) => ({ ...prev, country_id: value }))} disabled={!canManage}>
                <SelectTrigger id="farm-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm-address">Address</Label>
            <Textarea id="farm-address" value={form.address} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} rows={3} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="farm-city">City</Label>
              <Input id="farm-city" value={form.city} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-state">State</Label>
              <Input id="farm-state" value={form.state} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-postal">Postal code</Label>
              <Input id="farm-postal" value={form.postal_code} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-phone">Phone</Label>
              <Input id="farm-phone" value={form.phone} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-email">Email</Label>
              <Input id="farm-email" type="email" value={form.email} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-website">Website</Label>
              <Input id="farm-website" value={form.website} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-registration">Registration number</Label>
              <Input id="farm-registration" value={form.registration_number} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, registration_number: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="farm-tax-id">Tax ID</Label>
              <Input id="farm-tax-id" value={form.tax_id} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, tax_id: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-size">Size (hectares)</Label>
              <Input id="farm-size" type="number" value={form.size_hectares} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, size_hectares: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-established">Established date</Label>
              <Input id="farm-established" type="date" value={form.established_date} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, established_date: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-status">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))} disabled={!canManage}>
                <SelectTrigger id="farm-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-logo">Farm logo</Label>
              <Input id="farm-logo" type="file" accept="image/png,image/jpeg,image/jpg,image/gif" disabled={!canManage} onChange={(e) => setSelectedLogo(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ActionGate anyOf={ACTIONS.farmSettings.manage}>
        <SettingsSaveBar dirty={dirty || !!selectedLogo} saving={saving} onSave={handleSave} onDiscard={() => { reset(); setSelectedLogo(null) }} />
      </ActionGate>
    </div>
  )
}
