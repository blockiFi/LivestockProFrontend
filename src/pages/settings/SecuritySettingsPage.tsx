import { useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { logoutOtherDevices, updatePassword } from "@/lib/request"
import type { RootState } from "@/store"

export default function SecuritySettingsPage() {
  const token = useSelector((state: RootState) => state.authentication.token)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  })

  const handleSave = async () => {
    if (!form.current_password || !form.password || !form.password_confirmation) {
      toast.error("Complete all password fields")
      return
    }

    if (form.password !== form.password_confirmation) {
      toast.error("New password confirmation does not match")
      return
    }

    setSaving(true)
    const response = await updatePassword(token, form)
    setSaving(false)

    if (!response.success) {
      toast.error(response.error?.join(", ") || "Failed to update password")
      return
    }

    commit({
      current_password: "",
      password: "",
      password_confirmation: "",
    })
    toast.success("Password updated successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Protect your account and control active sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={form.current_password}
              onChange={(event) => setForm((prev) => ({ ...prev, current_password: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={form.password_confirmation}
                onChange={(event) => setForm((prev) => ({ ...prev, password_confirmation: event.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>End all other active sessions on other devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowSignOutDialog(true)}>
            Sign out other devices
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        title="Sign out other devices?"
        description="This will end all other active sessions and keep only this device signed in."
        type="warning"
        confirmText="Sign out others"
        showCancel
        onConfirm={async () => {
          const response = await logoutOtherDevices(token)
          if (response.success) {
            toast.success("Other devices signed out successfully")
          } else {
            toast.error(response.error?.join(", ") || "Failed to sign out other devices")
          }
        }}
      />

      <SettingsSaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={reset} />
    </div>
  )
}
