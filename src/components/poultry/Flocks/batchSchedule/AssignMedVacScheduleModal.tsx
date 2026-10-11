"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
} from "@/components/ui/form-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarRange, Loader2, Pill, Shield } from "lucide-react"
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="capitalize">{isReassign ? `Change ${label} Schedule` : `Assign ${label} Schedule`}</span>}
      description={
        isReassign
          ? `Pick a different ${label} program for this flock. Pending planned doses will be rebuilt from the new template; completed doses from the previous program are cleared.`
          : `Choose an existing ${label} program for this flock. Schedules for ${
              poultryTypeName || "this poultry type"
            } are listed below.`
      }
      icon={Icon}
      tone="schedule"
      size="sm"
      busy={saving}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          onConfirm={handleAssign}
          submitLabel={isReassign ? "Reassign schedule" : "Assign schedule"}
          busyLabel={isReassign ? "Reassigning…" : "Assigning…"}
          busy={saving}
          disabled={
            !selectedId ||
            schedules.length === 0 ||
            (isReassign && Number(selectedId) === currentScheduleId)
          }
        />
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading schedules…
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No {label} schedules found for this poultry type. Create one under Schedule Management
          first.
        </div>
      ) : (
        <FormSection
          icon={CalendarRange}
          title={<span className="capitalize">{label} program</span>}
          description="The template this flock will follow."
        >
          <FormField
            label={<span className="capitalize">{label} schedule</span>}
            required
            hint={selected?.description || undefined}
          >
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className={formInputClass()}>
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
          </FormField>
        </FormSection>
      )}
    </FormModal>
  )
}
