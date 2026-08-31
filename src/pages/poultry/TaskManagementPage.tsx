import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { toast } from "react-toastify"
import { getFarmUsers } from "@/lib/request"
import {
  approveFarmTaskInstance,
  completeFarmTaskInstance,
  createFarmTaskSchedule,
  createFarmTaskTemplate,
  deleteFarmTaskSchedule,
  deleteFarmTaskTemplate,
  getFarmTaskInstances,
  getFarmTaskNotifications,
  getFarmTaskSchedules,
  getFarmTaskStats,
  getFarmTaskTemplates,
  markAllFarmTaskNotificationsRead,
  markFarmTaskNotificationRead,
  seedFarmTaskRosterExample,
  startFarmTaskInstance,
  updateFarmTaskSchedule,
} from "@/lib/farmTaskRequest"
import type {
  FarmTaskInstance,
  FarmTaskNotification,
  FarmTaskSchedule,
  FarmTaskSchedulePayload,
  FarmTaskStats,
  FarmTaskTemplate,
  FarmUserRoleSummary,
} from "@/lib/types"
import CreateTaskScheduleSheet from "@/components/poultry/tasks/CreateTaskScheduleSheet"
import CompleteTaskDialog from "@/components/poultry/tasks/CompleteTaskDialog"
import {
  cnStatus,
  formatTaskDate,
  formatTaskTime,
  priorityBadgeClass,
  sectionLabel,
  sortInstancesByTime,
  startOfWeekMonday,
  toDateKey,
  WEEKDAYS,
} from "@/components/poultry/tasks/taskHelpers"
import { cn } from "@/lib/utils"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string
  value: number
  icon: ReactNode
  iconClass: string
}) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
          </div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClass)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const emptyStats: FarmTaskStats = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed_today: 0,
  overdue: 0,
  due_today: 0,
  medication: 0,
  awaiting_approval: 0,
}

const TaskManagementPage = () => {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)
  const userId = useSelector((s: RootState) => s.authentication.user?.id)
  const navigate = useNavigate()

  const [tab, setTab] = useState("overview")
  const [stats, setStats] = useState<FarmTaskStats>(emptyStats)
  const [instances, setInstances] = useState<FarmTaskInstance[]>([])
  const [schedules, setSchedules] = useState<FarmTaskSchedule[]>([])
  const [templates, setTemplates] = useState<FarmTaskTemplate[]>([])
  const [workers, setWorkers] = useState<FarmUserRoleSummary[]>([])
  const [notifications, setNotifications] = useState<FarmTaskNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [workerFilter, setWorkerFilter] = useState("all")
  const [dailyDate, setDailyDate] = useState(() => toDateKey(new Date()))
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))

  const [createOpen, setCreateOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<FarmTaskSchedule | null>(null)
  const [templatePreset, setTemplatePreset] = useState<FarmTaskTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<FarmTaskInstance | null>(null)

  const refresh = useCallback(async () => {
    if (!token || !farmId) return
    setLoading(true)
    try {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 14)
      const toDate = new Date()
      toDate.setDate(toDate.getDate() + 30)
      // Also cover selected week / daily date
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const daily = new Date(dailyDate + "T00:00:00")
      const candidates = [fromDate, toDate, weekStart, weekEnd, daily]
      const from = toDateKey(new Date(Math.min(...candidates.map((d) => d.getTime()))))
      const to = toDateKey(new Date(Math.max(...candidates.map((d) => d.getTime()))))

      const [statsRes, instRes, schedRes, tmplRes, usersRes, notifRes] = await Promise.all([
        getFarmTaskStats(token, farmId),
        getFarmTaskInstances(token, farmId, { from, to }),
        getFarmTaskSchedules(token, farmId),
        getFarmTaskTemplates(token, farmId),
        getFarmUsers(token, farmId),
        getFarmTaskNotifications(token, farmId),
      ])

      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (instRes.success && instRes.data) setInstances(instRes.data)
      if (schedRes.success && schedRes.data) setSchedules(schedRes.data)
      if (tmplRes.success && tmplRes.data) setTemplates(tmplRes.data)
      if (usersRes.success && usersRes.data) setWorkers(usersRes.data)
      if (notifRes.success && notifRes.data) setNotifications(notifRes.data)
    } finally {
      setLoading(false)
    }
  }, [token, farmId, weekStart, dailyDate])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filterInstances = useCallback(
    (list: FarmTaskInstance[]) => {
      return list.filter((it) => {
        if (sectionFilter !== "all" && it.section !== sectionFilter) return false
        if (workerFilter !== "all" && String(it.assigned_to_user_id) !== workerFilter) return false
        if (search) {
          const q = search.toLowerCase()
          const hay = `${it.title} ${it.description ?? ""} ${it.assignee?.name ?? ""}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
    },
    [sectionFilter, workerFilter, search]
  )

  const myTasks = useMemo(
    () =>
      sortInstancesByTime(
        filterInstances(instances.filter((i) => i.assigned_to_user_id === userId))
      ),
    [instances, userId, filterInstances]
  )

  const allTasks = useMemo(
    () => sortInstancesByTime(filterInstances(instances)),
    [instances, filterInstances]
  )

  const dailyTasks = useMemo(
    () =>
      sortInstancesByTime(
        filterInstances(
          instances.filter((i) => String(i.scheduled_date).slice(0, 10) === dailyDate)
        )
      ),
    [instances, dailyDate, filterInstances]
  )

  const completedTasks = useMemo(
    () => allTasks.filter((i) => i.status === "completed"),
    [allTasks]
  )
  const overdueTasks = useMemo(
    () => allTasks.filter((i) => i.status === "overdue"),
    [allTasks]
  )
  const recurringSchedules = useMemo(
    () => schedules.filter((s) => s.recurrence !== "none" && s.is_active),
    [schedules]
  )

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const handleCreateOrUpdate = async (payload: FarmTaskSchedulePayload) => {
    if (!token || !farmId) return
    setSaving(true)
    try {
      const res = editingSchedule
        ? await updateFarmTaskSchedule(token, farmId, editingSchedule.id, payload)
        : await createFarmTaskSchedule(token, farmId, payload)
      if (!res.success) {
        toast.error(res.error?.join(", ") || "Failed to save")
        return
      }
      toast.success(editingSchedule ? "Schedule updated" : "Schedule created")
      setCreateOpen(false)
      setEditingSchedule(null)
      setTemplatePreset(null)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleStart = async (id: number) => {
    if (!token || !farmId) return
    const res = await startFarmTaskInstance(token, farmId, id)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to start")
      return
    }
    toast.success("Task started")
    refresh()
  }

  const handleComplete = async (payload: {
    notes?: string
    worker_confirmed?: boolean
    signature_text?: string
  }) => {
    if (!token || !farmId || !completeTarget) return
    setSaving(true)
    try {
      const res = await completeFarmTaskInstance(token, farmId, completeTarget.id, payload)
      if (!res.success) {
        toast.error(res.error?.join(", ") || "Failed to complete")
        return
      }
      toast.success(
        res.data?.awaiting_approval ? "Completed — awaiting approval" : "Task completed"
      )
      setCompleteOpen(false)
      setCompleteTarget(null)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!token || !farmId) return
    const res = await approveFarmTaskInstance(token, farmId, id)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to approve")
      return
    }
    toast.success("Task approved")
    refresh()
  }

  const handleSeedRoster = async () => {
    if (!token || !farmId) return
    const res = await seedFarmTaskRosterExample(token, farmId)
    if (!res.success) {
      toast.error(res.error?.filter(Boolean).join(", ") || "Failed to seed roster")
      return
    }
    const warnings = (res.data as any)?.warnings as string[] | undefined
    if (warnings?.length) {
      warnings.forEach((w) => toast.warning(w))
    }
    toast.success(
      `Created ${(res.data as any)?.schedules?.length ?? ""} roster schedules`
    )
    refresh()
  }

  const handleSaveTemplateFromForm = async () => {
    if (!token || !farmId) return
    const title = window.prompt("Template title?")
    if (!title?.trim()) return
    const section = window.prompt("Section (layers/broilers/feeding/...)", "feeding") || "feeding"
    const res = await createFarmTaskTemplate(token, farmId, {
      title: title.trim(),
      section: section as any,
      priority: "medium",
    })
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed")
      return
    }
    toast.success("Template saved")
    refresh()
  }

  const InstanceActions = ({ it }: { it: FarmTaskInstance }) => (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {(it.status === "pending" || it.status === "overdue") && (
        <ActionGate anyOf={ACTIONS.farmTasks.manage}>
          <Button size="sm" variant="outline" className="h-8" onClick={() => handleStart(it.id)}>
            Start
          </Button>
        </ActionGate>
      )}
      {["pending", "in_progress", "overdue"].includes(it.status) && (
        <ActionGate anyOf={ACTIONS.farmTasks.complete}>
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              setCompleteTarget(it)
              setCompleteOpen(true)
            }}
          >
            {it.section === "medication" || it.require_signature ? "Complete & Sign Off" : "Complete"}
          </Button>
        </ActionGate>
      )}
      {it.awaiting_approval && (
        <ActionGate anyOf={ACTIONS.farmTasks.manage}>
          <Button size="sm" variant="secondary" className="h-8" onClick={() => handleApprove(it.id)}>
            Approve
          </Button>
        </ActionGate>
      )}
    </div>
  )

  const InstanceRow = ({ it }: { it: FarmTaskInstance }) => (
    <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{it.title}</p>
          <Badge variant="outline" className={cnStatus(it.status)}>
            {it.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={cn("font-normal", priorityBadgeClass(it.priority))}>
            {it.priority}
          </Badge>
          {it.awaiting_approval && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-normal">
              Awaiting approval
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatTaskTime(it.start_time)} · {sectionLabel(it.section)} ·{" "}
          {it.assignee?.name ?? "Unassigned"} · {formatTaskDate(it.scheduled_date)}
        </p>
      </div>
      <InstanceActions it={it} />
    </div>
  )

  const Filters = () => (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={sectionFilter} onValueChange={setSectionFilter}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {[
            "layers",
            "broilers",
            "turkeys",
            "goats",
            "pigs",
            "medication",
            "feeding",
            "cleaning",
            "general",
            "mixed",
          ].map((s) => (
            <SelectItem key={s} value={s}>
              {sectionLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={workerFilter} onValueChange={setWorkerFilter}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Worker" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All workers</SelectItem>
          {workers.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  if (!farmId || !token) {
    return (
      <div className="p-8 text-center text-slate-500">Select a farm to manage tasks.</div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Task Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Schedule, assign, and track farm work across sections and workers
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => refresh()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <ActionGate anyOf={ACTIONS.farmTasks.manage}>
              <Button variant="outline" className="gap-2" onClick={handleSeedRoster}>
                <Sparkles className="h-4 w-4" />
                Seed roster example
              </Button>
            </ActionGate>
            <ActionGate anyOf={ACTIONS.farmTasks.manage}>
              <Button
                className="gap-2"
                onClick={() => {
                  setEditingSchedule(null)
                  setTemplatePreset(null)
                  setCreateOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create task
              </Button>
            </ActionGate>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <StatCard label="Total" value={stats.total} icon={<ClipboardList className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-600" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-4 w-4" />} iconClass="bg-amber-50 text-amber-700" />
          <StatCard label="In progress" value={stats.in_progress} icon={<Loader2 className="h-4 w-4" />} iconClass="bg-sky-50 text-sky-700" />
          <StatCard label="Done today" value={stats.completed_today} icon={<CheckCircle2 className="h-4 w-4" />} iconClass="bg-emerald-50 text-emerald-700" />
          <StatCard label="Overdue" value={stats.overdue} icon={<TriangleAlert className="h-4 w-4" />} iconClass="bg-rose-50 text-rose-700" />
          <StatCard label="Due today" value={stats.due_today} icon={<Clock className="h-4 w-4" />} iconClass="bg-violet-50 text-violet-700" />
          <StatCard label="Medication" value={stats.medication} icon={<Pill className="h-4 w-4" />} iconClass="bg-rose-50 text-rose-700" />
          <StatCard label="Awaiting approval" value={stats.awaiting_approval} icon={<Bell className="h-4 w-4" />} iconClass="bg-amber-50 text-amber-700" />
        </div>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <Tabs value={tab} onValueChange={setTab}>
              <div className="overflow-x-auto mb-5">
                <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-slate-100 p-1">
                  {[
                    ["overview", "Overview"],
                    ["my", "My Tasks"],
                    ["all", "All Tasks"],
                    ["daily", "Daily Schedule"],
                    ["weekly", "Weekly Roster"],
                    ["recurring", "Recurring"],
                    ["templates", "Templates"],
                    ["completed", "Completed"],
                    ["overdue", "Overdue"],
                    ["notifications", "Notifications"],
                  ].map(([v, label]) => (
                    <TabsTrigger key={v} value={v} className="data-[state=active]:bg-white">
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="mb-4">
                <Filters />
              </div>

              <TabsContent value="overview" className="space-y-3 mt-0">
                <p className="text-sm text-slate-500 mb-2">
                  Upcoming instances this week ({allTasks.length} shown with filters).
                </p>
                {allTasks.slice(0, 12).map((it) => (
                  <InstanceRow key={it.id} it={it} />
                ))}
                {allTasks.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">
                    No tasks yet. Create a schedule or seed the roster example.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="my" className="space-y-3 mt-0">
                {myTasks.map((it) => (
                  <InstanceRow key={it.id} it={it} />
                ))}
                {myTasks.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No tasks assigned to you this week.</p>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-3 mt-0">
                {allTasks.map((it) => (
                  <InstanceRow key={it.id} it={it} />
                ))}
                {allTasks.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No matching tasks.</p>
                )}
              </TabsContent>

              <TabsContent value="daily" className="mt-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="date"
                    className="w-44"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDailyDate(toDateKey(new Date()))}
                  >
                    Today
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Assigned To</th>
                        <th className="px-3 py-2 font-medium">Task</th>
                        <th className="px-3 py-2 font-medium">Section</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyTasks.map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                          <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">
                            {formatTaskTime(it.start_time)}
                          </td>
                          <td className="px-3 py-2.5">{it.assignee?.name ?? "—"}</td>
                          <td className="px-3 py-2.5">{it.title}</td>
                          <td className="px-3 py-2.5">{sectionLabel(it.section)}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={cnStatus(it.status)}>
                              {it.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <InstanceActions it={it} />
                          </td>
                        </tr>
                      ))}
                      {dailyTasks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                            No tasks for this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="mt-0 space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date(weekStart)
                      d.setDate(d.getDate() - 7)
                      setWeekStart(d)
                    }}
                  >
                    Prev week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
                  >
                    This week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date(weekStart)
                      d.setDate(d.getDate() + 7)
                      setWeekStart(d)
                    }}
                  >
                    Next week
                  </Button>
                  <span className="text-sm text-slate-500 ml-2">
                    {formatTaskDate(toDateKey(weekDays[0]))} –{" "}
                    {formatTaskDate(toDateKey(weekDays[6]))}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[900px] grid grid-cols-7 gap-2">
                    {weekDays.map((d, i) => {
                      const key = toDateKey(d)
                      const dayItems = sortInstancesByTime(
                        filterInstances(
                          instances.filter((it) => String(it.scheduled_date).slice(0, 10) === key)
                        )
                      )
                      return (
                        <div key={key} className="rounded-lg border border-slate-200 bg-slate-50/50 min-h-[220px]">
                          <div className="px-2 py-2 border-b border-slate-200 bg-white rounded-t-lg">
                            <p className="text-xs font-semibold text-slate-700">
                              {WEEKDAYS[i]?.label} {d.getDate()}
                            </p>
                          </div>
                          <div className="p-1.5 space-y-1.5">
                            {dayItems.map((it) => (
                              <button
                                key={it.id}
                                type="button"
                                className="w-full text-left rounded-md border border-slate-200 bg-white p-2 hover:shadow-sm"
                                onClick={() => {
                                  setCompleteTarget(it)
                                  if (["pending", "in_progress", "overdue"].includes(it.status)) {
                                    setCompleteOpen(true)
                                  }
                                }}
                              >
                                <p className="text-[11px] font-medium text-slate-500">
                                  {formatTaskTime(it.start_time)}
                                </p>
                                <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                                  {it.title}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {it.assignee?.name ?? "—"} · {sectionLabel(it.section)}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn("mt-1 text-[10px]", cnStatus(it.status))}
                                >
                                  {it.status.replace("_", " ")}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recurring" className="mt-0 space-y-3">
                {recurringSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{s.title}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {s.recurrence} · {sectionLabel(s.section)} ·{" "}
                        {formatTaskTime(s.start_time)} · {s.assignment_mode}
                        {s.assignees?.length
                          ? ` · ${s.assignees.map((a) => a.user?.name ?? a.user_id).join(" → ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <ActionGate anyOf={ACTIONS.farmTasks.manage}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSchedule(s)
                            setTemplatePreset(null)
                            setCreateOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      </ActionGate>
                      <ActionGate anyOf={ACTIONS.farmTasks.manage}>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!token || !farmId) return
                            const res = await deleteFarmTaskSchedule(token, farmId, s.id)
                            if (!res.success) toast.error(res.error?.join(", ") || "Failed")
                            else {
                              toast.success("Schedule deactivated")
                              refresh()
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      </ActionGate>
                    </div>
                  </div>
                ))}
                {recurringSchedules.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No recurring schedules.</p>
                )}
              </TabsContent>

              <TabsContent value="templates" className="mt-0 space-y-3">
                <div className="flex justify-end">
                  <ActionGate anyOf={ACTIONS.farmTasks.manage}>
                    <Button size="sm" variant="outline" onClick={handleSaveTemplateFromForm}>
                      Quick add template
                    </Button>
                  </ActionGate>
                </div>
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="text-sm text-slate-500">
                        {sectionLabel(t.section)} · {t.priority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <ActionGate anyOf={ACTIONS.farmTasks.manage}>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTemplatePreset(t)
                            setEditingSchedule(null)
                            setCreateOpen(true)
                          }}
                        >
                          Use template
                        </Button>
                      </ActionGate>
                      <ActionGate anyOf={ACTIONS.farmTasks.manage}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!token || !farmId) return
                            const res = await deleteFarmTaskTemplate(token, farmId, t.id)
                            if (res.success) {
                              toast.success("Template deleted")
                              refresh()
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </ActionGate>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">
                    No templates yet. Save frequent tasks as templates for faster scheduling.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-3 mt-0">
                {completedTasks.map((it) => (
                  <InstanceRow key={it.id} it={it} />
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No completed tasks this week.</p>
                )}
              </TabsContent>

              <TabsContent value="overdue" className="space-y-3 mt-0">
                {overdueTasks.map((it) => (
                  <InstanceRow key={it.id} it={it} />
                ))}
                {overdueTasks.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No overdue tasks.</p>
                )}
              </TabsContent>

              <TabsContent value="notifications" className="space-y-3 mt-0">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/notifications")}>
                    Open notification center
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!token || !farmId) return
                      await markAllFarmTaskNotificationsRead(token, farmId)
                      refresh()
                    }}
                  >
                    Mark all read
                  </Button>
                </div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-3",
                      n.read_at
                        ? "border-slate-200 bg-white"
                        : "border-sky-200 bg-sky-50/50"
                    )}
                    onClick={async () => {
                      if (!token || !farmId || n.read_at) return
                      await markFarmTaskNotificationRead(token, farmId, n.id)
                      refresh()
                    }}
                  >
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </p>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-10">No notifications.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <CreateTaskScheduleSheet
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) {
            setEditingSchedule(null)
            setTemplatePreset(null)
          }
        }}
        workers={workers}
        templates={templates}
        initial={editingSchedule}
        templatePreset={templatePreset}
        onSubmit={handleCreateOrUpdate}
        saving={saving}
      />

      <CompleteTaskDialog
        open={completeOpen}
        instance={completeTarget}
        onOpenChange={setCompleteOpen}
        onSubmit={handleComplete}
        saving={saving}
      />
    </div>
  )
}

export default TaskManagementPage
