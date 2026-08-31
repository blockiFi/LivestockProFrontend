import { useEffect, useMemo, useState } from "react"
import { useLoaderData } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { updateFarmSettings, updateUserPreferences } from "@/lib/request"
import {
  getFarmNotificationSettings,
  getNotificationAnalytics,
  getNotificationPreferences,
  updateFarmNotificationSettings,
  updateNotificationChannelSettings,
  updateNotificationPreferences,
} from "@/lib/notificationRequest"
import { REMINDER_PRESETS } from "@/lib/notificationHelpers"
import type { RootState } from "@/store"
import type {
  FarmNotificationConfig,
  FarmNotificationTypeSetting,
  FarmSettings,
  NotificationAnalytics,
  NotificationCatalogGroup,
  NotificationPreferenceRow,
  UserNotificationSettings,
  UserSettings,
} from "@/lib/types"

type LoaderData = {
  currentFarm: { id: number } | null
  farmSettings: FarmSettings | null
  userSettings: UserSettings | null
}

export default function NotificationsSettingsPage() {
  const { currentFarm, farmSettings, userSettings } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const { canAny } = usePermissions()
  const canManageFarmSettings = canAny([...ACTIONS.farmSettings.manage])
  const canViewFarm = canAny([...ACTIONS.farmSettings.view])

  const [catalog, setCatalog] = useState<NotificationCatalogGroup[]>([])
  const [prefs, setPrefs] = useState<Record<string, NotificationPreferenceRow>>({})
  const [channelSettings, setChannelSettings] = useState<UserNotificationSettings | null>(null)
  const [farmTypes, setFarmTypes] = useState<FarmNotificationTypeSetting[]>([])
  const [farmConfig, setFarmConfig] = useState<FarmNotificationConfig | null>(null)
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const initialForm = useMemo(
    () => ({
      notify_schedules: userSettings?.notify_schedules ?? true,
      notify_low_stock: userSettings?.notify_low_stock ?? true,
      notify_mortality: userSettings?.notify_mortality ?? true,
      schedule_reminder_days: String(farmSettings?.schedule_reminder_days ?? 7),
      low_stock_alerts_enabled: farmSettings?.low_stock_alerts_enabled ?? true,
      mortality_alert_percent: String(farmSettings?.mortality_alert_percent ?? 2),
    }),
    [farmSettings, userSettings]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  useEffect(() => {
    if (!token) return
    void (async () => {
      const prefRes = await getNotificationPreferences(token, currentFarm?.id)
      if (prefRes.success && prefRes.data) {
        setCatalog(prefRes.data.catalog ?? [])
        setPrefs(prefRes.data.preferences ?? {})
        setChannelSettings(prefRes.data.settings)
      }
      if (currentFarm && canViewFarm) {
        const [farmRes, analyticsRes] = await Promise.all([
          getFarmNotificationSettings(token, currentFarm.id),
          getNotificationAnalytics(token, currentFarm.id),
        ])
        if (farmRes.success && farmRes.data) {
          setFarmTypes(farmRes.data.types ?? [])
          setFarmConfig(farmRes.data.config)
        }
        if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data)
      }
    })()
  }, [token, currentFarm, canViewFarm])

  const handleSaveThresholds = async () => {
    if (!currentFarm) return
    setSaving(true)
    const [userResponse, farmResponse] = await Promise.all([
      updateUserPreferences(token, {
        notify_schedules: form.notify_schedules,
        notify_low_stock: form.notify_low_stock,
        notify_mortality: form.notify_mortality,
      }),
      canManageFarmSettings
        ? updateFarmSettings(token, currentFarm.id, {
            schedule_reminder_days: Number(form.schedule_reminder_days),
            low_stock_alerts_enabled: form.low_stock_alerts_enabled,
            mortality_alert_percent: Number(form.mortality_alert_percent),
          })
        : Promise.resolve({ success: true, data: farmSettings } as const),
    ])
    setSaving(false)
    if (!userResponse.success) {
      toast.error(userResponse.error?.join(", ") || "Failed to update alert preferences")
      return
    }
    if (!farmResponse.success) {
      toast.error(farmResponse.error?.join(", ") || "Failed to update farm notifications")
      return
    }
    commit({
      notify_schedules: userResponse.data?.notify_schedules ?? form.notify_schedules,
      notify_low_stock: userResponse.data?.notify_low_stock ?? form.notify_low_stock,
      notify_mortality: userResponse.data?.notify_mortality ?? form.notify_mortality,
      schedule_reminder_days: String(farmResponse.data?.schedule_reminder_days ?? form.schedule_reminder_days),
      low_stock_alerts_enabled: farmResponse.data?.low_stock_alerts_enabled ?? form.low_stock_alerts_enabled,
      mortality_alert_percent: String(farmResponse.data?.mortality_alert_percent ?? form.mortality_alert_percent),
    })
    toast.success("Alert thresholds saved")
  }

  const handleSaveChannels = async () => {
    if (!token || !channelSettings) return
    const res = await updateNotificationChannelSettings(token, channelSettings)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to save delivery settings")
      return
    }
    if (res.data) setChannelSettings(res.data)
    if (channelSettings.browser_push_enabled && typeof Notification !== "undefined") {
      if (Notification.permission === "default") await Notification.requestPermission()
    }
    toast.success("Delivery settings saved")
  }

  const handleSavePrefs = async () => {
    if (!token) return
    setSavingPrefs(true)
    const res = await updateNotificationPreferences(token, {
      farm_id: currentFarm?.id,
      preferences: Object.entries(prefs).map(([type, row]) => ({
        type,
        in_app: row.in_app,
        email: row.email,
      })),
    })
    setSavingPrefs(false)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to save preferences")
      return
    }
    if (res.data?.preferences) setPrefs(res.data.preferences)
    toast.success("Notification preferences saved")
  }

  const handleSaveFarmAdmin = async () => {
    if (!token || !currentFarm || !farmConfig) return
    const res = await updateFarmNotificationSettings(token, currentFarm.id, {
      types: farmTypes,
      config: farmConfig,
    })
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to save farm notification settings")
      return
    }
    if (res.data?.types) setFarmTypes(res.data.types)
    if (res.data?.config) setFarmConfig(res.data.config)
    toast.success("Farm notification defaults saved")
  }

  const toggleFarmReminder = (minutes: number) => {
    setFarmConfig((current) => {
      const existing = current?.default_task_reminders ?? []
      const next = existing.includes(minutes)
        ? existing.filter((value) => value !== minutes)
        : [...existing, minutes].sort((a, b) => a - b)
      return { ...(current ?? {}), default_task_reminders: next.slice(0, 5) }
    })
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sent", analytics.notifications_sent],
            ["Read", analytics.notifications_read],
            ["Unread", analytics.notifications_unread],
            ["Email failed", analytics.email_failed],
            ["Reminders sent", analytics.task_reminders_sent],
            ["Overdue alerts", analytics.overdue_alerts],
            ["Emails sent", analytics.email_sent],
            ["Pending reminders", analytics.reminders_pending],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Delivery channels</CardTitle>
          <CardDescription>Sounds stay off unless you turn them on. Critical alerts still appear in-app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelSettings && (
            <>
              {[
                ["email_enabled", "Email notifications", "Send matching events to your inbox."],
                ["sound_enabled", "Notification sound", "A short chime for new high-priority alerts."],
                ["browser_push_enabled", "Browser notifications", "Use the browser banner when this tab is in the background."],
              ].map(([key, title, description]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={Boolean(channelSettings[key as keyof UserNotificationSettings])}
                    onCheckedChange={(checked) =>
                      setChannelSettings((current) =>
                        current ? { ...current, [key]: checked } : current
                      )
                    }
                  />
                </div>
              ))}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quiet hours start</Label>
                  <Input
                    type="time"
                    value={String(channelSettings.quiet_hours_start ?? "").slice(0, 5)}
                    onChange={(event) =>
                      setChannelSettings((current) =>
                        current ? { ...current, quiet_hours_start: event.target.value || null } : current
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quiet hours end</Label>
                  <Input
                    type="time"
                    value={String(channelSettings.quiet_hours_end ?? "").slice(0, 5)}
                    onChange={(event) =>
                      setChannelSettings((current) =>
                        current ? { ...current, quiet_hours_end: event.target.value || null } : current
                      )
                    }
                  />
                </div>
              </div>
              <Button type="button" onClick={handleSaveChannels}>
                Save delivery settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification types</CardTitle>
          <CardDescription>
            Choose in-app and email for each event. Locked channels cannot be turned off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {catalog.map((group) => (
            <div key={group.category} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Notification</th>
                      <th className="px-4 py-2 font-medium text-center">In-app</th>
                      <th className="px-4 py-2 font-medium text-center">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.types.map((type) => {
                      const row = prefs[type.type]
                      return (
                        <tr key={type.type} className="border-t">
                          <td className="px-4 py-3">
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Switch
                              checked={row?.in_app ?? type.default_channels.includes("in_app")}
                              disabled={row?.locked?.includes("in_app")}
                              onCheckedChange={(checked) =>
                                setPrefs((current) => ({
                                  ...current,
                                  [type.type]: { ...current[type.type], in_app: checked },
                                }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Switch
                              checked={row?.email ?? type.default_channels.includes("email")}
                              disabled={row?.locked?.includes("email")}
                              onCheckedChange={(checked) =>
                                setPrefs((current) => ({
                                  ...current,
                                  [type.type]: { ...current[type.type], email: checked },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <Button type="button" onClick={handleSavePrefs} disabled={savingPrefs}>
            {savingPrefs ? "Saving…" : "Save preferences"}
          </Button>
        </CardContent>
      </Card>

      <ActionGate anyOf={ACTIONS.farmSettings.manage}>
      {farmConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Farm administrator controls</CardTitle>
            <CardDescription>
              Defaults, mandatory alerts, reminder timing, and overdue escalation for this farm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <span className="text-sm font-medium">Escalate overdue tasks</span>
                <Switch
                  checked={Boolean(farmConfig.escalation_enabled)}
                  onCheckedChange={(checked) =>
                    setFarmConfig((current) => ({ ...(current ?? {}), escalation_enabled: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <span className="text-sm font-medium">Notify managers on overdue</span>
                <Switch
                  checked={Boolean(farmConfig.notify_managers_on_overdue)}
                  onCheckedChange={(checked) =>
                    setFarmConfig((current) => ({ ...(current ?? {}), notify_managers_on_overdue: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <span className="text-sm font-medium">Notify managers on completion</span>
                <Switch
                  checked={Boolean(farmConfig.notify_managers_on_completion)}
                  onCheckedChange={(checked) =>
                    setFarmConfig((current) => ({ ...(current ?? {}), notify_managers_on_completion: checked }))
                  }
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Notify manager after (minutes)</Label>
                <Input
                  type="number"
                  value={farmConfig.escalate_to_manager_after_minutes ?? 60}
                  onChange={(event) =>
                    setFarmConfig((current) => ({
                      ...(current ?? {}),
                      escalate_to_manager_after_minutes: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Raise to high priority after (minutes)</Label>
                <Input
                  type="number"
                  value={farmConfig.escalate_high_priority_after_minutes ?? 180}
                  onChange={(event) =>
                    setFarmConfig((current) => ({
                      ...(current ?? {}),
                      escalate_high_priority_after_minutes: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email retry attempts</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={farmConfig.email_max_attempts ?? 3}
                  onChange={(event) =>
                    setFarmConfig((current) => ({
                      ...(current ?? {}),
                      email_max_attempts: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Default task reminders</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((preset) => {
                  const selected = farmConfig.default_task_reminders?.includes(preset.minutes)
                  return (
                    <Button
                      key={preset.minutes}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleFarmReminder(preset.minutes)}
                    >
                      {preset.label}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-center">Enabled</th>
                    <th className="px-4 py-2 text-center">Mandatory</th>
                    <th className="px-4 py-2 text-center">Default in-app</th>
                    <th className="px-4 py-2 text-center">Default email</th>
                  </tr>
                </thead>
                <tbody>
                  {farmTypes.map((type, index) => (
                    <tr key={type.type} className="border-t">
                      <td className="px-4 py-3">{type.label}</td>
                      {(["enabled", "mandatory", "default_in_app", "default_email"] as const).map((field) => (
                        <td key={field} className="px-4 py-3 text-center">
                          <Switch
                            checked={Boolean(type[field])}
                            disabled={type.catalog_mandatory && field === "enabled"}
                            onCheckedChange={(checked) =>
                              setFarmTypes((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index ? { ...row, [field]: checked } : row
                                )
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" onClick={handleSaveFarmAdmin}>
              Save farm defaults
            </Button>
          </CardContent>
        </Card>
      )}
      </ActionGate>

      <Card>
        <CardHeader>
          <CardTitle>Operational alert thresholds</CardTitle>
          <CardDescription>These still drive feeding, medication, inventory, and mortality alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["notify_schedules", "Schedule reminders", "Upcoming medication, vaccination, and feeding activity."],
            ["notify_low_stock", "Low stock alerts", "Medication, vaccine, and feed inventory threshold alerts."],
            ["notify_mortality", "Mortality alerts", "High mortality events based on the configured threshold."],
          ].map(([key, title, description]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={form[key as keyof typeof form] as boolean}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-reminder-days">Schedule reminder window (days)</Label>
              <Input
                id="schedule-reminder-days"
                type="number"
                disabled={!canManageFarmSettings}
                value={form.schedule_reminder_days}
                onChange={(e) => setForm((prev) => ({ ...prev, schedule_reminder_days: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mortality-alert-percent">Mortality alert threshold (%)</Label>
              <Input
                id="mortality-alert-percent"
                type="number"
                disabled={!canManageFarmSettings}
                value={form.mortality_alert_percent}
                onChange={(e) => setForm((prev) => ({ ...prev, mortality_alert_percent: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ActionGate anyOf={ACTIONS.farmSettings.manage}>
        <SettingsSaveBar dirty={dirty} saving={saving} onSave={handleSaveThresholds} onDiscard={reset} />
      </ActionGate>
    </div>
  )
}
