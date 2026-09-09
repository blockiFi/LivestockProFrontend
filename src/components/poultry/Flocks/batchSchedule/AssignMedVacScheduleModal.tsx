"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Pill, Shield } from "lucide-react"
import { toast } from "react-toastify"
import type { DetailedSchedule } from "@/lib/types"
import { createBatchSchedule, getSchedules } from "@/lib/request"

type ScheduleKind = "medication" | "vaccination"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  farmId: number
  flockId: number
  type: ScheduleKind
  poultryTypeId?: number | null
  poultryTypeName?: string | null
  /** When set, modal is in reassign mode for an existing batch assignment. */
  currentScheduleId?: number | null
  onAssigned?: () => void
}

function matchesPoultryType(
  schedule: DetailedSchedule,
  poultryTypeId?: number | null,
  poultryTypeName?: string | null
) {
  if (poultryTypeId && schedule.poultry_type_id === poultryTypeId) return true
  const typeName = poultryTypeName?.toLowerCase().trim()
  if (
    typeName &&
    (schedule.poultry_type_id == null || schedule.poultry_type_id === 0) &&
    (schedule.name || "").toLowerCase().includes(typeName)
  ) {
    return true
  }
  if (!poultryTypeId && !typeName) return true
  return false
}

export default function AssignMedVacScheduleModal({
  open,
  onOpenChange,
  token,
  farmId,
  flockId,
  type,
  poultryTypeId,
  poultryTypeName,
  currentScheduleId,
  onAssigned,
}: Props) {
  const isReassign = currentScheduleId != null && currentScheduleId > 0
  const label = type === "medication" ? "medication" : "vaccination"
  const Icon = type === "medication" ? Pill : Shield
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [schedules, setSchedules] = useState<DetailedSchedule[]>([])
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setSelectedId(
        currentScheduleId != null && currentScheduleId > 0 ? String(currentScheduleId) : ""
      )
      const res = await getSchedules(token, farmId, type, false)
      if (cancelled) return
      if (res.success && Array.isArray(res.data)) {
        const filtered = res.data.filter((s) =>
          matchesPoultryType(s, poultryTypeId, poultryTypeName)
        )
        setSchedules(filtered)
        if (currentScheduleId && filtered.some((s) => s.id === currentScheduleId)) {
          setSelectedId(String(currentScheduleId))
        } else if (filtered.length === 1) {
          setSelectedId(String(filtered[0].id))
        }
      } else {
        setSchedules([])
        toast.error((res.error || []).join(", ") || `Failed to load ${label} schedules`)
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, token, farmId, type, poultryTypeId, poultryTypeName, currentScheduleId, label])

  const selected = useMemo(
    () => schedules.find((s) => String(s.id) === selectedId) || null,
    [schedules, selectedId]
  )

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error(`Select a ${label} schedule`)
      return
    }
    if (isReassign && Number(selectedId) === currentScheduleId) {
      toast.info(`This ${label} schedule is already assigned to the flock`)
      return
    }
    setSaving(true)
    const res = await createBatchSchedule(token, farmId, type, {
      flock_id: flockId,
      schedule_id: Number(selectedId),
      status: "active",
    })
    setSaving(false)
    if (!res.success) {
      toast.error((res.error || []).join(", ") || `Failed to assign ${label} schedule`)
      return
    }
    toast.success(
      isReassign
        ? `Reassigned to "${selected?.name || `${label} schedule`}"`
        : `Assigned "${selected?.name || `${label} schedule`}"`
    )
    onOpenChange(false)
    onAssigned?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize">
            <Icon className={`h-5 w-5 ${type === "medication" ? "text-purple-600" : "text-emerald-600"}`} />
            {isReassign ? `Change ${label} Schedule` : `Assign ${label} Schedule`}
          </DialogTitle>
          <DialogDescription>
            {isReassign
              ? `Pick a different ${label} program for this flock. Pending planned doses will be rebuilt from the new template; completed doses from the previous program are cleared.`
              : `Choose an existing ${label} program for this flock. Schedules for ${
                  poultryTypeName || "this poultry type"
                } are listed below.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading schedules…
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No {label} schedules found for this poultry type. Create one under Schedule Management
            first.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="capitalize">{label} schedule</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={String(schedule.id)}>
                      {schedule.name}
                      {schedule.id === currentScheduleId ? " (current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected?.description && (
              <p className="text-xs text-muted-foreground">{selected.description}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              saving ||
              !selectedId ||
              schedules.length === 0 ||
              (isReassign && Number(selectedId) === currentScheduleId)
            }
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isReassign ? "Reassigning…" : "Assigning…"}
              </>
            ) : isReassign ? (
              "Reassign schedule"
            ) : (
              "Assign schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
