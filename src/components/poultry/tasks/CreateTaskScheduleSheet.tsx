import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SECTIONS, WEEKDAYS } from "./taskHelpers"
import { describeReminderOffset, REMINDER_PRESETS } from "@/lib/notificationHelpers"
import type {
  FarmTaskAssignmentMode,
  FarmTaskPriority,
  FarmTaskRecurrence,
  FarmTaskSchedule,
  FarmTaskSchedulePayload,
  FarmTaskSection,
  FarmTaskTemplate,
  FarmUserRoleSummary,
  FlockRecord,
} from "@/lib/types"
import { Loader2 } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workers: FarmUserRoleSummary[]
  flocks?: FlockRecord[]
  templates: FarmTaskTemplate[]
  initial?: FarmTaskSchedule | null
  templatePreset?: FarmTaskTemplate | null
  onSubmit: (payload: FarmTaskSchedulePayload) => Promise<void>
  saving?: boolean
}

const emptyForm = () => ({
  title: "",
  description: "",
  section: "general" as FarmTaskSection,
  priority: "medium" as FarmTaskPriority,
  instructions: "",
  notes: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  indefinite: true,
  start_time: "06:30",
  due_time: "",
  continuous: false,
  recurrence: "none" as FarmTaskRecurrence,
  repeat_interval: 1,
  days_of_week: [1] as number[],
  month_day: 1,
  assignment_mode: "single" as FarmTaskAssignmentMode,
  assignee_ids: [] as number[],
  flock_id: null as number | null,
  animal_group: "",
  medication_name: "",
  dosage_instructions: "",
  require_completion_confirmation: false,
  require_supervisor_approval: false,
  require_signature: false,
  template_id: null as number | null,
  reminders_enabled: true,
  reminders: [30] as number[],
  customReminder: "",
})

export default function CreateTaskScheduleSheet({
  open,
  onOpenChange,
  workers,
  flocks = [],
  templates,
  initial,
  templatePreset,
  onSubmit,
  saving,
}: Props) {
  const [form, setForm] = useState(emptyForm())

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? "",
        section: initial.section,
        priority: initial.priority,
        instructions: initial.instructions ?? "",
        notes: initial.notes ?? "",
        start_date: String(initial.start_date).slice(0, 10),
        end_date: initial.end_date ? String(initial.end_date).slice(0, 10) : "",
        indefinite: Boolean(initial.indefinite),
        start_time: initial.start_time ? String(initial.start_time).slice(0, 5) : "06:30",
        due_time: initial.due_time ? String(initial.due_time).slice(0, 5) : "",
        continuous: !initial.start_time,
        recurrence: initial.recurrence,
        repeat_interval: initial.repeat_interval || 1,
        days_of_week: initial.days_of_week?.length ? initial.days_of_week : [1],
        month_day: initial.month_day || 1,
        assignment_mode: initial.assignment_mode,
        assignee_ids: (initial.assignees ?? []).map((a) => a.user_id),
        flock_id: initial.flock_id ?? null,
        animal_group: initial.animal_group ?? "",
        medication_name: initial.medication_name ?? "",
        dosage_instructions: initial.dosage_instructions ?? "",
        require_completion_confirmation: initial.require_completion_confirmation,
        require_supervisor_approval: initial.require_supervisor_approval,
        require_signature: initial.require_signature,
        template_id: initial.template_id ?? null,
        reminders_enabled: initial.reminders_enabled !== false,
        reminders: (initial.reminders ?? []).map((row) => row.offset_minutes),
        customReminder: "",
      })
      return
    }
    if (templatePreset) {
      setForm({
        ...emptyForm(),
        title: templatePreset.title,
        description: templatePreset.description ?? "",
        section: templatePreset.section,
        priority: templatePreset.priority,
        instructions: templatePreset.instructions ?? "",
        notes: templatePreset.notes ?? "",
        animal_group: templatePreset.animal_group ?? "",
        medication_name: templatePreset.medication_name ?? "",
        dosage_instructions: templatePreset.dosage_instructions ?? "",
        require_completion_confirmation: templatePreset.require_completion_confirmation,
        require_supervisor_approval: templatePreset.require_supervisor_approval,
        require_signature: templatePreset.require_signature,
        template_id: templatePreset.id,
      })
      return
    }
    setForm(emptyForm())
  }, [open, initial, templatePreset])

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const has = prev.days_of_week.includes(day)
      return {
        ...prev,
        days_of_week: has
          ? prev.days_of_week.filter((d) => d !== day)
          : [...prev.days_of_week, day].sort(),
      }
    })
  }

  const toggleAssignee = (id: number) => {
    setForm((prev) => {
      const has = prev.assignee_ids.includes(id)
      if (has) return { ...prev, assignee_ids: prev.assignee_ids.filter((x) => x !== id) }
      if (prev.assignment_mode === "single") return { ...prev, assignee_ids: [id] }
      return { ...prev, assignee_ids: [...prev.assignee_ids, id] }
    })
  }

  const moveAssignee = (id: number, dir: -1 | 1) => {
    setForm((prev) => {
      const ids = [...prev.assignee_ids]
      const idx = ids.indexOf(id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= ids.length) return prev
      ;[ids[idx], ids[next]] = [ids[next], ids[idx]]
      return { ...prev, assignee_ids: ids }
    })
  }

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => String(x.id) === id)
    if (!t) return
    setForm((prev) => ({
      ...prev,
      template_id: t.id,
      title: t.title,
      description: t.description ?? "",
      section: t.section,
      priority: t.priority,
      instructions: t.instructions ?? "",
      notes: t.notes ?? "",
      animal_group: t.animal_group ?? "",
      medication_name: t.medication_name ?? "",
      dosage_instructions: t.dosage_instructions ?? "",
      require_completion_confirmation: t.require_completion_confirmation,
      require_supervisor_approval: t.require_supervisor_approval,
      require_signature: t.require_signature,
    }))
  }

  const handleSubmit = async () => {
    const payload: FarmTaskSchedulePayload = {
      template_id: form.template_id,
      title: form.title.trim(),
      description: form.description || undefined,
      section: form.section,
      priority: form.priority,
      instructions: form.instructions || undefined,
      notes: form.notes || undefined,
      start_date: form.start_date,
      end_date: form.indefinite ? null : form.end_date || null,
      indefinite: form.indefinite,
      start_time: form.continuous ? null : form.start_time || null,
      due_time: form.continuous ? null : form.due_time || null,
      recurrence: form.recurrence,
      repeat_interval: form.repeat_interval,
      days_of_week:
        form.recurrence === "weekly" || form.recurrence === "custom"
          ? form.days_of_week
          : null,
      month_day: form.recurrence === "monthly" ? form.month_day : null,
      assignment_mode: form.assignment_mode,
      assignee_ids: form.assignee_ids,
      flock_id: form.flock_id || null,
      animal_group: form.animal_group || undefined,
      medication_name: form.section === "medication" ? form.medication_name : undefined,
      dosage_instructions:
        form.section === "medication" ? form.dosage_instructions : undefined,
      require_completion_confirmation: form.require_completion_confirmation,
      require_supervisor_approval: form.require_supervisor_approval,
      require_signature: form.require_signature,
      reminders_enabled: form.reminders_enabled,
      reminders: form.reminders_enabled ? form.reminders : [],
    }
    await onSubmit(payload)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 sm:p-8">
        <SheetHeader className="p-0 pr-8">
          <SheetTitle>{initial ? "Edit task schedule" : "Create task schedule"}</SheetTitle>
          <SheetDescription>
            Define timing, recurrence, and worker assignment. Instances are generated automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          {templates.length > 0 && !initial && (
            <div className="space-y-2">
              <Label>From template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional — load a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Feed Layers"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Farm section</Label>
              <Select
                value={form.section}
                onValueChange={(v) => setForm((p) => ({ ...p, section: v as FarmTaskSection }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: v as FarmTaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Link to batch (optional)</Label>
            <Select
              value={form.flock_id ? String(form.flock_id) : "none"}
              onValueChange={(v) =>
                setForm((p) => ({
                  ...p,
                  flock_id: v === "none" ? null : Number(v),
                  animal_group:
                    v === "none"
                      ? p.animal_group
                      : flocks.find((f) => String(f.id) === v)?.batch_number ||
                        flocks.find((f) => String(f.id) === v)?.name ||
                        p.animal_group,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Farm-wide task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific batch</SelectItem>
                {flocks.map((flock) => (
                  <SelectItem key={flock.id} value={String(flock.id)}>
                    {flock.batch_number ? `Batch #${flock.batch_number}` : flock.name}
                    {flock.name && flock.batch_number ? ` · ${flock.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.section === "medication" && (
            <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Medication details
              </p>
              <div className="space-y-2">
                <Label>Animal group</Label>
                <Input
                  value={form.animal_group}
                  onChange={(e) => setForm((p) => ({ ...p, animal_group: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Medication name</Label>
                <Input
                  value={form.medication_name}
                  onChange={(e) => setForm((p) => ({ ...p, medication_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage / instructions</Label>
                <Textarea
                  value={form.dosage_instructions}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dosage_instructions: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={form.end_date}
                disabled={form.indefinite}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={form.indefinite}
              onCheckedChange={(c) => setForm((p) => ({ ...p, indefinite: Boolean(c) }))}
            />
            Indefinite (no end date)
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={form.continuous}
              onCheckedChange={(c) => setForm((p) => ({ ...p, continuous: Boolean(c) }))}
            />
            Continuous (no specific start time)
          </label>

          {!form.continuous && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due time</Label>
                <Input
                  type="time"
                  value={form.due_time}
                  onChange={(e) => setForm((p) => ({ ...p, due_time: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Recurrence</Label>
              <Select
                value={form.recurrence}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, recurrence: v as FarmTaskRecurrence }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["none", "daily", "weekly", "monthly", "custom"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repeat interval</Label>
              <Input
                type="number"
                min={1}
                value={form.repeat_interval}
                onChange={(e) =>
                  setForm((p) => ({ ...p, repeat_interval: Number(e.target.value) || 1 }))
                }
              />
            </div>
          </div>

          {(form.recurrence === "weekly" || form.recurrence === "custom") && (
            <div className="space-y-2">
              <Label>Days of week</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    size="sm"
                    variant={form.days_of_week.includes(d.value) ? "default" : "outline"}
                    className="h-8"
                    onClick={() => toggleDay(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {form.recurrence === "monthly" && (
            <div className="space-y-2">
              <Label>Day of month</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.month_day}
                onChange={(e) =>
                  setForm((p) => ({ ...p, month_day: Number(e.target.value) || 1 }))
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Assignment mode</Label>
            <Select
              value={form.assignment_mode}
              onValueChange={(v) =>
                setForm((p) => ({
                  ...p,
                  assignment_mode: v as FarmTaskAssignmentMode,
                  assignee_ids:
                    v === "single" && p.assignee_ids.length > 1
                      ? [p.assignee_ids[0]]
                      : p.assignee_ids,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single worker</SelectItem>
                <SelectItem value="alternating">Alternating workers</SelectItem>
                <SelectItem value="all">All selected workers</SelectItem>
              </SelectContent>
            </Select>
            {form.assignment_mode === "alternating" && (
              <p className="text-xs text-slate-500">
                Order matters: Worker A → Worker B → Worker A… Use arrows to reorder.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assigned workers</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {workers.length === 0 && (
                <p className="text-sm text-slate-500 p-2">No farm users found.</p>
              )}
              {workers.map((w) => {
                const selected = form.assignee_ids.includes(w.id)
                const order = form.assignee_ids.indexOf(w.id)
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                  >
                    <label className="flex items-center gap-2 text-sm flex-1 cursor-pointer">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleAssignee(w.id)}
                      />
                      <span>
                        {w.name}
                        {order >= 0 && form.assignment_mode === "alternating" ? (
                          <span className="ml-2 text-xs text-slate-400">#{order + 1}</span>
                        ) : null}
                      </span>
                    </label>
                    {selected && form.assignment_mode === "alternating" && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => moveAssignee(w.id, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => moveAssignee(w.id, 1)}
                        >
                          ↓
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Reminders</Label>
                <p className="text-xs text-slate-500">
                  Sent for every occurrence of a recurring task, in the farm timezone.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.reminders_enabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, reminders_enabled: Boolean(checked) }))
                  }
                />
                Enabled
              </label>
            </div>
            {form.reminders_enabled && (
              <>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_PRESETS.map((preset) => {
                    const selected = form.reminders.includes(preset.minutes)
                    return (
                      <Button
                        key={preset.minutes}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        disabled={!selected && form.reminders.length >= 5}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            reminders: selected
                              ? prev.reminders.filter((value) => value !== preset.minutes)
                              : [...prev.reminders, preset.minutes].sort((a, b) => a - b),
                          }))
                        }
                      >
                        {preset.label}
                      </Button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10080}
                    placeholder="Custom minutes before"
                    value={form.customReminder}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, customReminder: event.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const minutes = Number(form.customReminder)
                      if (!Number.isFinite(minutes) || minutes < 0) return
                      setForm((prev) => ({
                        ...prev,
                        customReminder: "",
                        reminders: Array.from(new Set([...prev.reminders, Math.round(minutes)]))
                          .sort((a, b) => a - b)
                          .slice(0, 5),
                      }))
                    }}
                  >
                    Add
                  </Button>
                </div>
                {form.reminders.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {form.reminders.map((minutes) => describeReminderOffset(minutes)).join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Completion requirements</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.require_completion_confirmation}
                  onCheckedChange={(c) =>
                    setForm((p) => ({ ...p, require_completion_confirmation: Boolean(c) }))
                  }
                />
                Require completion confirmation
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.require_supervisor_approval}
                  onCheckedChange={(c) =>
                    setForm((p) => ({ ...p, require_supervisor_approval: Boolean(c) }))
                  }
                />
                Require supervisor approval
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.require_signature}
                  onCheckedChange={(c) =>
                    setForm((p) => ({ ...p, require_signature: Boolean(c) }))
                  }
                />
                Require signature / sign-off
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              className="gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save changes" : "Create schedule"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
