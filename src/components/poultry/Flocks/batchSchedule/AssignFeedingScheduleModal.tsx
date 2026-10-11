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
import { CalendarRange, Loader2, Wheat } from "lucide-react"
import { toast } from "react-toastify"
import type { FeedingSchedule } from "@/lib/types"
import { createFeedingBatchSchedule, getFeedingSchedules } from "@/lib/request"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  farmId: number
  flockId: number
  poultryTypeId?: number | null
  poultryTypeName?: string | null
  /** When set, modal is in reassign mode for an existing batch assignment. */
  currentFeedingScheduleId?: number | null
  onAssigned?: () => void
}

function matchesPoultryType(
  schedule: FeedingSchedule,
  poultryTypeId?: number | null,
  poultryTypeName?: string | null
) {
  if (poultryTypeId && schedule.poultry_type_id === poultryTypeId) return true
  const typeName = poultryTypeName?.toLowerCase().trim()
  if (
    typeName &&
    (schedule.poultry_type_id == null || schedule.poultry_type_id === 0) &&
    (schedule.title || "").toLowerCase().includes(typeName)
  ) {
    return true
  }
  if (!poultryTypeId && !typeName) return true
  return false
}

export default function AssignFeedingScheduleModal({
  open,
  onOpenChange,
  token,
  farmId,
  flockId,
  poultryTypeId,
  poultryTypeName,
  currentFeedingScheduleId,
  onAssigned,
}: Props) {
  const isReassign = currentFeedingScheduleId != null && currentFeedingScheduleId > 0
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([])
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setSelectedId(
        currentFeedingScheduleId != null && currentFeedingScheduleId > 0
          ? String(currentFeedingScheduleId)
          : ""
      )
      const res = await getFeedingSchedules(token, farmId, false)
      if (cancelled) return
      if (res.success && Array.isArray(res.data)) {
        const filtered = res.data.filter((s) =>
          matchesPoultryType(s, poultryTypeId, poultryTypeName)
        )
        setSchedules(filtered)
        if (
          currentFeedingScheduleId &&
          filtered.some((s) => s.id === currentFeedingScheduleId)
        ) {
          setSelectedId(String(currentFeedingScheduleId))
        } else if (filtered.length === 1) {
          setSelectedId(String(filtered[0].id))
        }
      } else {
        setSchedules([])
        toast.error((res.error || []).join(", ") || "Failed to load feeding schedules")
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, token, farmId, poultryTypeId, poultryTypeName, currentFeedingScheduleId])

  const selected = useMemo(
    () => schedules.find((s) => String(s.id) === selectedId) || null,
    [schedules, selectedId]
  )

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error("Select a feeding schedule")
      return
    }
    if (isReassign && Number(selectedId) === currentFeedingScheduleId) {
      toast.info("This schedule is already assigned to the flock")
      return
    }
    setSaving(true)
    const res = await createFeedingBatchSchedule(token, farmId, {
      flock_id: flockId,
      feeding_schedule_id: Number(selectedId),
      status: "scheduled",
    })
    setSaving(false)
    if (!res.success) {
      toast.error((res.error || []).join(", ") || "Failed to assign schedule")
      return
    }
    toast.success(
      isReassign
        ? `Reassigned to "${selected?.title || "feeding schedule"}"`
        : `Assigned "${selected?.title || "feeding schedule"}"`
    )
    onOpenChange(false)
    onAssigned?.()
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isReassign ? "Change Feeding Schedule" : "Assign Feeding Schedule"}
      description={
        isReassign
          ? `Pick a different feeding program for this flock. Prior feed logs for the previous program will be cleared.`
          : `Choose an existing feeding program for this flock. Schedules for ${
              poultryTypeName || "this poultry type"
            } are listed below.`
      }
      icon={Wheat}
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
            (isReassign && Number(selectedId) === currentFeedingScheduleId)
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
          No feeding schedules found for this poultry type. Create one under Schedule Management
          first.
        </div>
      ) : (
        <FormSection icon={CalendarRange} title="Feeding program" description="The template this flock will follow.">
          <FormField label="Feeding schedule" required hint={selected?.description || undefined}>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={String(schedule.id)}>
                    {schedule.title}
                    {schedule.id === currentFeedingScheduleId ? " (current)" : ""}
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
