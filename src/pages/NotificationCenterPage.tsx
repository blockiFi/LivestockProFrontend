import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NotificationItem from "@/components/notifications/NotificationItem"
import { isPlatformBroadcast } from "@/lib/notificationHelpers"
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationRequest"
import type { RootState } from "@/store"
import type { AppNotification } from "@/lib/types"

const TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "announcements", label: "Announcements" },
  { value: "tasks", label: "Tasks" },
  { value: "farm_operations", label: "Farm Operations" },
  { value: "medication", label: "Medication" },
  { value: "system", label: "System" },
] as const

export default function NotificationCenterPage() {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [tab, setTab] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const query = useMemo(() => {
    const params: Parameters<typeof getNotifications>[1] = {
      farm_id: farmId,
      limit: 80,
    }
    if (tab === "unread") params.unread_only = true
    else if (tab === "announcements") params.type = "platform_broadcast"
    else if (tab === "system" || tab === "farm_operations") params.category = undefined
    else if (tab !== "all") params.category = tab
    if (search.trim()) params.search = search.trim()
    return params
  }, [farmId, tab, search])

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const res = await getNotifications(token, query)
    setLoading(false)
    if (!res.success) {
      toast.error(res.error?.join(", ") || "Failed to load notifications")
      return
    }
    let rows = res.data ?? []
    if (tab === "announcements") {
      rows = rows.filter((row) => isPlatformBroadcast(row))
    } else if (tab === "system") {
      rows = rows.filter((row) => row.category === "system" || row.category === "account")
    }
    if (tab === "farm_operations") {
      rows = rows.filter((row) => row.category === "farm_operations" || row.category === "inventory")
    }
    setItems(rows)
  }, [token, query, tab])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleOpen = async (notification: AppNotification) => {
    if (!token) return
    if (!notification.is_read && !notification.read_at) {
      await markNotificationRead(token, notification.id)
      setItems((current) =>
        current.map((row) =>
          row.id === notification.id ? { ...row, read_at: new Date().toISOString(), is_read: true } : row
        )
      )
    }
  }

  const handleDismiss = async (notification: AppNotification) => {
    if (!token) return
    await dismissNotification(token, notification.id)
    setItems((current) => current.filter((row) => row.id !== notification.id))
  }

  const handleMarkAll = async () => {
    if (!token) return
    const category =
      tab === "all" ||
      tab === "unread" ||
      tab === "system" ||
      tab === "announcements" ||
      tab === "farm_operations"
        ? undefined
        : tab
    await markAllNotificationsRead(token, farmId, category)
    toast.success("Notifications marked read")
    await refresh()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notification Center</h1>
          <p className="text-sm text-muted-foreground">
            Tasks, reminders, farm alerts, platform announcements, and account messages in one place.
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAll}>
          Mark all as read
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notifications"
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={handleOpen}
            onDismiss={handleDismiss}
          />
        ))}
        {!loading && items.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">No notifications in this view.</p>
        )}
      </div>
    </div>
  )
}
