import { useMemo, useState } from "react"
import { useLoaderData } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { updateUserProfile } from "@/lib/request"
import { setUser } from "@/store/AuthenticationSlice"
import type { RootState } from "@/store"
import type { User } from "@/lib/types"

type LoaderData = {
  currentUser: User | null
}

export default function ProfileSettingsPage() {
  const { currentUser } = useLoaderData() as LoaderData
  const dispatch = useDispatch()
  const token = useSelector((state: RootState) => state.authentication.token)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)

  const initialForm = useMemo(
    () => ({
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
    }),
    [currentUser]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  const previewUrl = useMemo(() => {
    if (selectedPhoto) {
      return URL.createObjectURL(selectedPhoto)
    }
    return currentUser?.profile_photo ?? null
  }, [currentUser?.profile_photo, selectedPhoto])

  const handleSave = async () => {
    setSaving(true)
    const response = await updateUserProfile(token, {
      ...form,
      phone: form.phone || "",
      profile_photo: selectedPhoto,
    })
    setSaving(false)

    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to update profile")
      return
    }

    dispatch(setUser(response.data))
    commit({
      name: response.data.name ?? "",
      email: response.data.email ?? "",
      phone: response.data.phone ?? "",
    })
    setSelectedPhoto(null)
    toast.success("Profile updated successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your basic account information and avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-slate-100">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-slate-500">
                  {form.name.trim().charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-photo">Profile photo</Label>
              <Input
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={(event) => setSelectedPhoto(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email address</Label>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone number</Label>
            <Input
              id="profile-phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
            Keep your name, email, and contact details up to date so invitations, invoice ownership, and farm events
            stay correctly attributed.
          </div>
        </CardContent>
      </Card>

      <SettingsSaveBar
        dirty={dirty || !!selectedPhoto}
        saving={saving}
        onSave={handleSave}
        onDiscard={() => {
          reset()
          setSelectedPhoto(null)
        }}
      />
    </div>
  )
}
