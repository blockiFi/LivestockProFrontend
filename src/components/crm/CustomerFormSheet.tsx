import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RootState } from "@/store"
import type { Customer } from "@/lib/types"
import { createCustomer, updateCustomer, type CustomerPayload } from "@/lib/crmRequest"
import { getCountries, type CountryOption } from "@/lib/request"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSaved: (customer: Customer) => void
}

const emptyForm = (countryId = ""): CustomerPayload & { is_active: boolean } => ({
  name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  notes: "",
  is_active: true,
  country_id: countryId ? Number(countryId) : 0,
})

export default function CustomerFormSheet({ open, onOpenChange, customer, onSaved }: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (!token) return
    getCountries(token).then((res) => {
      if (res.success && res.data) setCountries(res.data)
    })
  }, [token])

  useEffect(() => {
    if (!open) return
    if (customer) {
      setForm({
        name: customer.name,
        company_name: customer.company_name ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
        notes: customer.notes ?? "",
        is_active: customer.is_active,
        country_id: customer.country_id,
      })
    } else {
      setForm(emptyForm(countries[0] ? String(countries[0].id) : ""))
    }
  }, [open, customer, countries])

  const title = customer ? "Edit customer" : "Add customer"
  const canSave = useMemo(() => form.name.trim().length > 0 && form.country_id > 0, [form])

  const handleSave = async () => {
    if (!token || !farmId || !canSave) return
    setSaving(true)
    const payload: CustomerPayload = {
      name: form.name.trim(),
      company_name: form.company_name?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      notes: form.notes?.trim() || null,
      is_active: form.is_active,
      country_id: form.country_id,
    }

    const response = customer
      ? await updateCustomer(token, farmId, customer.id, payload)
      : await createCustomer(token, farmId, payload)

    setSaving(false)
    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to save customer")
      return
    }

    toast.success(customer ? "Customer updated" : "Customer created")
    onSaved(response.data)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-6 sm:p-8">
        <SheetHeader className="p-0 pr-8">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-company">Company</Label>
            <Input
              id="customer-company"
              value={form.company_name ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={form.country_id ? String(form.country_id) : ""}
              onValueChange={(value) => setForm((prev) => ({ ...prev, country_id: Number(value) }))}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              value={form.address ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-city">City</Label>
              <Input
                id="customer-city"
                value={form.city ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-state">State</Label>
              <Input
                id="customer-state"
                value={form.state ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-notes">Notes</Label>
            <Textarea
              id="customer-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active customer</p>
              <p className="text-xs text-muted-foreground">Inactive customers stay in history but are hidden from pickers.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? "Saving..." : "Save customer"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
