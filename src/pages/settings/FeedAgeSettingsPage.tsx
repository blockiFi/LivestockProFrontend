import { useMemo } from "react"
import { useLoaderData } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsSaveBar } from "@/components/settings/SettingsSaveBar"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { formatFeedAgeRange } from "@/lib/feed-age"
import { updateFeedAgeRanges } from "@/lib/request"
import type { RootState } from "@/store"
import type { FeedType } from "@/lib/types"

type RangeRow = {
  poultry_feed_type_id: number
  name: string
  poultry_type_name: string
  poultry_type_id: number
  start_age: string
  end_age: string
  default_start_age: number | null
  default_end_age: number | null
  has_farm_override: boolean
}

type LoaderData = {
  currentFarm: { id: number } | null
  feedTypes: FeedType[]
  permissions: string[]
}

function toRow(feedType: FeedType): RangeRow {
  const start =
    feedType.effective_start_age !== undefined && feedType.effective_start_age !== null
      ? feedType.effective_start_age
      : feedType.start_age
  const end =
    feedType.effective_end_age !== undefined
      ? feedType.effective_end_age
      : feedType.end_age

  return {
    poultry_feed_type_id: feedType.id,
    name: feedType.name,
    poultry_type_name: feedType.poultry_type?.name ?? `Type #${feedType.poultry_type_id}`,
    poultry_type_id: feedType.poultry_type_id,
    start_age: start != null ? String(start) : "",
    end_age: end != null ? String(end) : "",
    default_start_age: feedType.default_start_age ?? feedType.start_age ?? null,
    default_end_age: feedType.default_end_age ?? feedType.end_age ?? null,
    has_farm_override: Boolean(feedType.has_farm_override),
  }
}

export default function FeedAgeSettingsPage() {
  const { currentFarm, feedTypes } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.feedTypes.manage])
  const canView = canAny([...ACTIONS.feedTypes.view])

  const initialForm = useMemo(
    () => ({
      rows: (feedTypes ?? []).map(toRow),
    }),
    [feedTypes]
  )

  const { form, setForm, dirty, saving, setSaving, reset, commit } = useSettingsForm(initialForm)

  const grouped = useMemo(() => {
    const map = new Map<string, RangeRow[]>()
    for (const row of form.rows) {
      const key = row.poultry_type_name
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries())
  }, [form.rows])

  const updateRow = (feedTypeId: number, patch: Partial<Pick<RangeRow, "start_age" | "end_age">>) => {
    setForm((prev) => ({
      rows: prev.rows.map((row) =>
        row.poultry_feed_type_id === feedTypeId ? { ...row, ...patch } : row
      ),
    }))
  }

  const handleSave = async () => {
    if (!currentFarm) return

    for (const row of form.rows) {
      if (row.start_age === "") {
        toast.error(`${row.name}: From day is required`)
        return
      }
      const start = Number(row.start_age)
      const end = row.end_age === "" ? null : Number(row.end_age)
      if (!Number.isFinite(start) || start < 0) {
        toast.error(`${row.name}: From day must be a non-negative number`)
        return
      }
      if (end !== null && (!Number.isFinite(end) || end < start)) {
        toast.error(`${row.name}: To day must be ≥ From day (or leave blank for open-ended)`)
        return
      }
    }

    setSaving(true)
    const response = await updateFeedAgeRanges(
      token,
      currentFarm.id,
      form.rows.map((row) => ({
        poultry_feed_type_id: row.poultry_feed_type_id,
        start_age: Number(row.start_age),
        end_age: row.end_age === "" ? null : Number(row.end_age),
      }))
    )
    setSaving(false)

    if (!response.success || !response.data) {
      toast.error(response.error?.join(", ") || "Failed to update feed age ranges")
      return
    }

    commit({ rows: response.data.map(toRow) })
    toast.success("Feed age ranges updated successfully")
  }

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feed usage ages</CardTitle>
          <CardDescription>You do not have permission to view feed age settings.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed usage ages</CardTitle>
          <CardDescription>
            Set the bird-age day range each feed type is intended for (e.g. Starter = day 1–14). Leave
            &quot;To day&quot; blank for an open-ended range. These are farm overrides — global defaults
            are shown as hints when unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feed types available for this farm.</p>
          ) : (
            grouped.map(([poultryTypeName, rows]) => (
              <div key={poultryTypeName} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">{poultryTypeName}</h3>
                <div className="space-y-3">
                  {rows.map((row) => {
                    const defaultHint = formatFeedAgeRange(row.default_start_age, row.default_end_age)
                    return (
                      <div
                        key={row.poultry_feed_type_id}
                        className="grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1.2fr)_1fr_1fr]"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{row.name}</p>
                          {defaultHint && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Default: day {defaultHint}
                              {row.has_farm_override ? " · farm override active" : ""}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`start-${row.poultry_feed_type_id}`}>From day</Label>
                          <Input
                            id={`start-${row.poultry_feed_type_id}`}
                            type="number"
                            min={0}
                            value={row.start_age}
                            disabled={!canManage}
                            onChange={(e) => updateRow(row.poultry_feed_type_id, { start_age: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`end-${row.poultry_feed_type_id}`}>To day</Label>
                          <Input
                            id={`end-${row.poultry_feed_type_id}`}
                            type="number"
                            min={0}
                            placeholder="Open-ended"
                            value={row.end_age}
                            disabled={!canManage}
                            onChange={(e) => updateRow(row.poultry_feed_type_id, { end_age: e.target.value })}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ActionGate anyOf={ACTIONS.feedTypes.manage}>
        <SettingsSaveBar dirty={dirty} saving={saving} onSave={handleSave} onDiscard={reset} />
      </ActionGate>
    </div>
  )
}
