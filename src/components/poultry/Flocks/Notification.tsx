"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  X,
  Shield,
  Pill,
  AlertTriangle,
  Clock,
  ChevronRight,
  Wheat,
  CalendarDays,
  Package,
  RefreshCw,
  CheckCheck,
  Minimize2,
} from "lucide-react"
import { cn, Naira, formatCurrency } from "@/lib/utils"
import { getFlockNotifications, type FlockNotifications } from "@/lib/request"
import { toast } from "react-toastify"

type ActivityKind = "vaccination" | "medication" | "feeding" | "alert"
type ActivityPriority = "high" | "medium" | "low"
type FilterTab = "all" | "today" | "upcoming" | "stock"

interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  detail: string
  priority: ActivityPriority
  daysUntil: number
  scheduledDate: string
  flockName?: string
  estimatedCost?: number
  href?: string
}

interface NotificationSystemProps {
  flockId: number
  flockName: string
  onOpenSchedule?: () => void
}

const DISMISS_KEY = (flockId: number) => `flock-activities-dismissed:${flockId}`

function readDismissed(flockId: number): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY(flockId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function writeDismissed(flockId: number, ids: Set<string>) {
  try {
    sessionStorage.setItem(DISMISS_KEY(flockId), JSON.stringify([...ids]))
  } catch {
    /* ignore */
  }
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function urgencyLabel(daysUntil: number) {
  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil)
    return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`
  }
  if (daysUntil === 0) return "Due today"
  if (daysUntil === 1) return "Tomorrow"
  return `In ${daysUntil} days`
}

function kindMeta(kind: ActivityKind) {
  switch (kind) {
    case "vaccination":
      return {
        label: "Vaccination",
        icon: Shield,
        chip: "bg-sky-50 text-sky-800 border-sky-200",
        iconWrap: "bg-sky-100 text-sky-700",
        accent: "border-l-sky-500",
      }
    case "medication":
      return {
        label: "Medication",
        icon: Pill,
        chip: "bg-violet-50 text-violet-800 border-violet-200",
        iconWrap: "bg-violet-100 text-violet-700",
        accent: "border-l-violet-500",
      }
    case "feeding":
      return {
        label: "Feeding",
        icon: Wheat,
        chip: "bg-amber-50 text-amber-900 border-amber-200",
        iconWrap: "bg-amber-100 text-amber-800",
        accent: "border-l-amber-500",
      }
    default:
      return {
        label: "Stock",
        icon: AlertTriangle,
        chip: "bg-rose-50 text-rose-800 border-rose-200",
        iconWrap: "bg-rose-100 text-rose-700",
        accent: "border-l-rose-500",
      }
  }
}

function mapNotifications(
  data: FlockNotifications,
  flockName: string
): ActivityItem[] {
  const upcoming = (data.upcoming_batch_items || []).map<ActivityItem>((item) => {
    const kind: ActivityKind = item.type === "vaccination" ? "vaccination" : "medication"
    const daysUntil = item.days_until ?? 0
    const priority: ActivityPriority =
      daysUntil < 0 ? "high" : daysUntil === 0 ? "high" : daysUntil <= 2 ? "medium" : "low"
    const statusNote =
      item.status === "overdue" || daysUntil < 0
        ? "Overdue"
        : daysUntil === 0
          ? "Due today"
          : `Due ${formatShortDate(item.scheduled_date)}`
    return {
      id: `batch-${item.id}-${item.scheduled_date}`,
      kind,
      title: item.title || (kind === "vaccination" ? "Vaccination due" : "Medication due"),
      detail: `${statusNote} · ${flockName || item.flock_name || "Flock"}`,
      priority,
      daysUntil,
      scheduledDate: item.scheduled_date,
      flockName: flockName || item.flock_name,
      estimatedCost: item.cost ?? undefined,
    }
  })

  const lowMed = (data.low_stock?.medications || []).map<ActivityItem>((m) => ({
    id: `med-low-${m.id}`,
    kind: "alert",
    title: m.name || "Medication stock low",
    detail: `${Number(m.quantity).toLocaleString()} remaining in inventory`,
    priority: "high",
    daysUntil: 0,
    scheduledDate: new Date().toISOString().slice(0, 10),
    href: `/dashboard/poultry/inventory/medications`,
  }))

  const lowVac = (data.low_stock?.vaccines || []).map<ActivityItem>((v) => ({
    id: `vac-low-${v.id}`,
    kind: "alert",
    title: v.name || "Vaccine stock low",
    detail: `${Number(v.quantity).toLocaleString()} remaining in inventory`,
    priority: "high",
    daysUntil: 0,
    scheduledDate: new Date().toISOString().slice(0, 10),
    href: `/dashboard/poultry/inventory/vaccination`,
  }))

  const lowFeed = (data.low_stock?.feeds || []).map<ActivityItem>((f) => ({
    id: `feed-low-${f.id}`,
    kind: "alert",
    title: f.name || "Feed stock low",
    detail: `${Number(f.quantity).toLocaleString()} kg remaining`,
    priority: "high",
    daysUntil: 0,
    scheduledDate: new Date().toISOString().slice(0, 10),
    href: `/dashboard/poultry/inventory/feeds`,
  }))

  return [...upcoming, ...lowMed, ...lowVac, ...lowFeed].sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.priority] - rank[b.priority]
  })
}

export function NotificationSystem({
  flockId,
  flockName,
  onOpenSchedule,
}: NotificationSystemProps) {
  const navigate = useNavigate()
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)

  const [items, setItems] = useState<ActivityItem[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed(flockId))
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [autoOpened, setAutoOpened] = useState(false)

  const load = useCallback(async () => {
    if (!token || !farmId || !flockId) return
    setLoading(true)
    try {
      const res = await getFlockNotifications(token, farmId, flockId)
      if (!res.success || !res.data) {
        if (res.error) console.error("Failed to load flock notifications:", res.error)
        return
      }
      const mapped = mapNotifications(res.data, flockName)
      setItems(mapped)
      if (!autoOpened && mapped.some((i) => i.daysUntil <= 0 || i.kind === "alert")) {
        setOpen(true)
        setAutoOpened(true)
      }
    } catch (err) {
      console.error("Error loading flock notifications:", err)
      toast.error("Failed to load upcoming activities")
    } finally {
      setLoading(false)
    }
  }, [token, farmId, flockId, flockName, autoOpened])

  useEffect(() => {
    setDismissed(readDismissed(flockId))
    setAutoOpened(false)
    setOpen(false)
  }, [flockId])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => items.filter((item) => !dismissed.has(item.id)),
    [items, dismissed]
  )

  const filtered = useMemo(() => {
    switch (filter) {
      case "today":
        // Includes overdue schedule items that still need action.
        return visible.filter((i) => i.kind !== "alert" && i.daysUntil <= 0)
      case "upcoming":
        return visible.filter((i) => i.kind !== "alert" && i.daysUntil > 0)
      case "stock":
        return visible.filter((i) => i.kind === "alert")
      default:
        return visible
    }
  }, [visible, filter])

  const counts = useMemo(() => {
    const dueOrOverdue = visible.filter((i) => i.kind !== "alert" && i.daysUntil <= 0)
    return {
      all: visible.length,
      today: dueOrOverdue.length,
      overdue: dueOrOverdue.filter((i) => i.daysUntil < 0).length,
      upcoming: visible.filter((i) => i.kind !== "alert" && i.daysUntil > 0).length,
      stock: visible.filter((i) => i.kind === "alert").length,
    }
  }, [visible])

  const dueTodayCount = counts.today + counts.stock

  const dismissOne = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      writeDismissed(flockId, next)
      return next
    })
  }

  const dismissAll = () => {
    const next = new Set(dismissed)
    visible.forEach((i) => next.add(i.id))
    writeDismissed(flockId, next)
    setDismissed(next)
    setOpen(false)
  }

  const handleAction = (item: ActivityItem) => {
    if (item.href) {
      navigate(item.href)
      setOpen(false)
      return
    }
    onOpenSchedule?.()
    setOpen(false)
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "today", label: "Due", count: counts.today },
    { id: "upcoming", label: "Soon", count: counts.upcoming },
    { id: "stock", label: "Stock", count: counts.stock },
  ]

  return (
    <div className="fixed top-[4.75rem] right-4 z-40 flex flex-col items-end gap-3 sm:top-20 sm:right-6">
      {/* Launcher */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative h-10 gap-2 rounded-full border-slate-200 bg-white/95 px-3.5 shadow-md backdrop-blur transition",
          "hover:border-teal-300 hover:bg-teal-50/80",
          open && "border-teal-400 bg-teal-50 ring-2 ring-teal-100",
          dueTodayCount > 0 && !open && "border-rose-200"
        )}
        aria-expanded={open}
        aria-label="Upcoming activities"
      >
        <Bell className={cn("h-4 w-4", dueTodayCount > 0 ? "text-rose-600" : "text-slate-700")} />
        <span className="hidden text-sm font-medium text-slate-800 sm:inline">Activities</span>
        {visible.length > 0 && (
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white",
              dueTodayCount > 0 ? "bg-rose-600" : "bg-teal-700"
            )}
          >
            {visible.length}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            "w-[min(100vw-2rem,26rem)] overflow-hidden rounded-2xl border border-slate-200/80",
            "bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)]",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
          role="dialog"
          aria-label="Upcoming activities"
        >
          {/* Header */}
          <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(135deg,#0f766e_0%,#115e59_48%,#134e4a_100%)] px-4 py-4 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 12% 20%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 88% 0%, rgba(255,255,255,0.18), transparent 36%)",
              }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-teal-100">
                    Flock focus
                  </p>
                </div>
                <h3 className="truncate text-lg font-semibold tracking-tight">{flockName}</h3>
                <p className="mt-0.5 text-sm text-teal-50/90">
                  {dueTodayCount > 0
                    ? `${dueTodayCount} item${dueTodayCount === 1 ? "" : "s"} need attention today`
                    : visible.length > 0
                      ? `${visible.length} upcoming item${visible.length === 1 ? "" : "s"}`
                      : "You're all caught up"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/90 hover:bg-white/15 hover:text-white"
                  onClick={() => void load()}
                  disabled={loading}
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/90 hover:bg-white/15 hover:text-white"
                  onClick={() => setOpen(false)}
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary chips */}
            <div className="relative mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/20">
                <Clock className="h-3 w-3" />
                {counts.today} due
                {counts.overdue > 0 ? ` (${counts.overdue} overdue)` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/20">
                <CalendarDays className="h-3 w-3" />
                {counts.upcoming} upcoming
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/20">
                <Package className="h-3 w-3" />
                {counts.stock} stock
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 border-b border-slate-100 bg-slate-50/80 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                  filter === tab.id
                    ? "bg-white text-teal-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    filter === tab.id ? "bg-teal-50 text-teal-800" : "bg-slate-200/70 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[min(28rem,55vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <RefreshCw className="h-5 w-5 animate-spin text-teal-700" />
                <p className="text-sm text-slate-500">Loading activities…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <CheckCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-800">Nothing in this view</p>
                <p className="text-xs text-slate-500">
                  {visible.length === 0
                    ? "No schedule or stock alerts for this flock right now."
                    : "Try another filter, or refresh for the latest updates."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const meta = kindMeta(item.kind)
                  const Icon = meta.icon
                  const isOverdue = item.daysUntil < 0
                  const isDue = item.daysUntil <= 0
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "border-l-4 bg-white",
                        isOverdue ? "border-l-rose-600" : meta.accent
                      )}
                    >
                      <div className="flex gap-3 px-3.5 py-3.5 transition hover:bg-slate-50/80">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            isOverdue ? "bg-rose-100 text-rose-700" : meta.iconWrap
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn("h-5 rounded-md px-1.5 text-[10px] font-semibold", meta.chip)}
                                >
                                  {meta.label}
                                </Badge>
                                {isOverdue && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 rounded-md border-rose-200 bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-700"
                                  >
                                    Overdue
                                  </Badge>
                                )}
                                {item.kind !== "alert" && (
                                  <span
                                    className={cn(
                                      "text-[11px] font-semibold",
                                      isDue ? "text-rose-600" : item.daysUntil <= 2 ? "text-amber-700" : "text-slate-500"
                                    )}
                                  >
                                    {urgencyLabel(item.daysUntil)}
                                  </span>
                                )}
                              </div>
                              <h4 className="truncate text-sm font-semibold text-slate-900">{item.title}</h4>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {item.detail}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => dismissOne(item.id)}
                              className="rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                              aria-label="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              {item.kind !== "alert" && (
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatShortDate(item.scheduledDate)}
                                </span>
                              )}
                              {item.estimatedCost != null && item.estimatedCost > 0 && (
                                <span className="font-medium text-slate-600">
                                  {Naira}
                                  {formatCurrency(item.estimatedCost)}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 gap-1 rounded-lg bg-teal-800 px-2.5 text-[11px] font-semibold hover:bg-teal-900"
                              onClick={() => handleAction(item)}
                            >
                              {item.kind === "alert" ? "Restock" : "Open schedule"}
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-600 hover:text-slate-900"
              onClick={dismissAll}
              disabled={visible.length === 0}
            >
              Dismiss all
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-semibold hover:bg-slate-800"
              onClick={() => {
                onOpenSchedule?.()
                setOpen(false)
              }}
            >
              Schedule management
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
