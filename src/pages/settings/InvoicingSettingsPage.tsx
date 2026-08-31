import { useMemo } from "react"
import { useLoaderData } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { updateFarmSettings } from "@/lib/request"
import type { RootState } from "@/store"
import type { FarmSettings } from "@/lib/types"

type LoaderData = {
  currentFarm: { id: number } | null
  farmSettings: FarmSettings | null
  permissions: string[]
}

export default function InvoicingSettingsPage() {
  const { currentFarm, farmSettings } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.farmSettings.manage])

  const initialForm = useMemo(
    () => ({
      invoice_prefix: farmSettings?.invoice_prefix ?? "INV",
      invoice_next_number: String(farmSettings?.invoice_next_number ?? 1),
      invoice_tax_enabled: farmSettings?.invoice_tax_enabled ?? true,
      invoice_tax_rate: String(farmSettings?.invoice_tax_rate ?? 10),
      invoice_payment_instructions: farmSettings?.invoice_payment_instructions ?? "",
      invoice_footer_note: farmSettings?.invoice_footer_note ?? "",
    }),
    [farmSettings]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  const handleSave = async () => {
    if (!currentFarm) return

    setSaving(true)
    const response = await updateFarmSettings(token, currentFarm.id, {
      invoice_prefix: form.invoice_prefix,
      invoice_next_number: Number(form.invoice_next_number),
      invoice_tax_enabled: form.invoice_tax_enabled,
      invoice_tax_rate: Number(form.invoice_tax_rate || 0),
      invoice_payment_instructions: form.invoice_payment_instructions || null,
      invoice_footer_note: form.invoice_footer_note || null,
    })
    setSaving(false)

    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to update invoicing settings")
      return
    }

    commit({
      invoice_prefix: response.data.invoice_prefix,
      invoice_next_number: String(response.data.invoice_next_number),
      invoice_tax_enabled: response.data.invoice_tax_enabled,
      invoice_tax_rate: String(response.data.invoice_tax_rate),
      invoice_payment_instructions: response.data.invoice_payment_instructions ?? "",
      invoice_footer_note: response.data.invoice_footer_note ?? "",
    })
    toast.success("Invoicing settings updated successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoicing defaults</CardTitle>
          <CardDescription>Control numbering, tax behavior, and default invoice content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">Invoice prefix</Label>
              <Input id="invoice-prefix" value={form.invoice_prefix} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, invoice_prefix: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-next-number">Next invoice number</Label>
              <Input id="invoice-next-number" type="number" value={form.invoice_next_number} disabled={!canManage} onChange={(e) => setForm((prev) => ({ ...prev, invoice_next_number: e.target.value }))} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Apply tax by default</p>
                <p className="text-sm text-muted-foreground">New invoices inherit this tax setting automatically.</p>
              </div>
              <Switch checked={form.invoice_tax_enabled} disabled={!canManage} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, invoice_tax_enabled: checked }))} />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="invoice-tax-rate">Tax rate (%)</Label>
              <Input
                id="invoice-tax-rate"
                type="number"
                value={form.invoice_tax_rate}
                disabled={!canManage || !form.invoice_tax_enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, invoice_tax_rate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-payment-instructions">Default payment instructions</Label>
            <Textarea
              id="invoice-payment-instructions"
              rows={5}
              value={form.invoice_payment_instructions}
              disabled={!canManage}
              onChange={(e) => setForm((prev) => ({ ...prev, invoice_payment_instructions: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-footer-note">Footer note</Label>
            <Textarea
              id="invoice-footer-note"
              rows={4}
              value={form.invoice_footer_note}
              disabled={!canManage}
              onChange={(e) => setForm((prev) => ({ ...prev, invoice_footer_note: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <ActionGate anyOf={ACTIONS.farmSettings.manage}>
        <SettingsSaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={reset} />
      </ActionGate>
    </div>
  )
}
