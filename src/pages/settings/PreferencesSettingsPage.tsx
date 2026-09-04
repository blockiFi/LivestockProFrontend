import { useMemo } from "react"
import { useLoaderData } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { Switch } from "@/components/ui/switch"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { updateUserPreferences } from "@/lib/request"
import { useTheme } from "@/providers/ThemeProvider"
import type { RootState } from "@/store"
import type { UserSettings } from "@/lib/types"

const timezones = ["UTC", "Africa/Lagos", "Europe/London", "America/New_York"]
const dateFormats = ["Y-m-d", "d/m/Y", "m/d/Y"]

type LoaderData = {
  userSettings: UserSettings | null
}

export default function PreferencesSettingsPage() {
  const { userSettings } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const { setTheme } = useTheme()

  const initialForm = useMemo(
    () => ({
      theme: "light" as const,
      locale: userSettings?.locale ?? "en",
      timezone: userSettings?.timezone ?? "UTC",
      date_format: userSettings?.date_format ?? "Y-m-d",
      notify_schedules: userSettings?.notify_schedules ?? true,
      notify_low_stock: userSettings?.notify_low_stock ?? true,
      notify_mortality: userSettings?.notify_mortality ?? true,
    }),
    [userSettings]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  const handleSave = async () => {
    setSaving(true)
    const response = await updateUserPreferences(token, form)
    setSaving(false)

    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to update preferences")
      return
    }

    setTheme("light")
    commit({
      theme: "light",
      locale: response.data.locale,
      timezone: response.data.timezone,
      date_format: response.data.date_format,
      notify_schedules: response.data.notify_schedules,
      notify_low_stock: response.data.notify_low_stock,
      notify_mortality: response.data.notify_mortality,
    })
    toast.success("Preferences updated successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Personalize locale, dates, and your in-app alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Locale</Label>
              <Select value={form.locale} onValueChange={(value) => setForm((prev) => ({ ...prev, locale: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date format</Label>
              <Select value={form.date_format} onValueChange={(value) => setForm((prev) => ({ ...prev, date_format: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Schedule reminders</p>
                <p className="text-sm text-muted-foreground">Show upcoming medication and vaccination reminders.</p>
              </div>
              <Switch checked={form.notify_schedules} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notify_schedules: checked }))} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Low stock alerts</p>
                <p className="text-sm text-muted-foreground">Notify you when inventory drops under its threshold.</p>
              </div>
              <Switch checked={form.notify_low_stock} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notify_low_stock: checked }))} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Mortality alerts</p>
                <p className="text-sm text-muted-foreground">Show alerts when mortality rates exceed the configured limit.</p>
              </div>
              <Switch checked={form.notify_mortality} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notify_mortality: checked }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsSaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={reset} />
    </div>
  )
}
