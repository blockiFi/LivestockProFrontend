import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Bell } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import NotificationItem from "@/components/notifications/NotificationItem"
import { isPlatformBroadcast } from "@/lib/notificationHelpers"
import {
  getNotificationPreferences,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationRequest"
import type { RootState } from "@/store"
import type { AppNotification, UserNotificationSettings } from "@/lib/types"

function playChime() {
  try {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = "sine"
    oscillator.frequency.value = 880
    gain.gain.value = 0.04
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.12)
  } catch {
    // Browser autoplay or AudioContext restrictions — ignore.
  }
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null)
  const previousUnread = useRef<number | null>(null)
  const seenBroadcastIds = useRef<Set<number>>(new Set())

  const refresh = useCallback(async () => {
    if (!token) return
    const [summary, list] = await Promise.all([
      getNotificationSummary(token, farmId),
      getNotifications(token, { farm_id: farmId, limit: 8 }),
    ])
    if (summary.success && summary.data) {
      const nextUnread = summary.data.unread ?? 0
      if (
        previousUnread.current !== null &&
        nextUnread > previousUnread.current &&
        settings?.sound_enabled
      ) {
        playChime()
      }
      if (
        previousUnread.current !== null &&
        nextUnread > previousUnread.current &&
        settings?.browser_push_enabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const latest = summary.data.latest?.[0]
        if (latest) {
          new Notification(latest.title, { body: latest.body ?? undefined })
        }
      }
      previousUnread.current = nextUnread
      setUnread(nextUnread)
    }
    if (list.success && list.data) {
      setItems(list.data)

      const newBroadcasts = list.data.filter(
        (notification) =>
          isPlatformBroadcast(notification) &&
          !notification.is_read &&
          !notification.read_at &&
          !seenBroadcastIds.current.has(notification.id)
      )

      for (const broadcast of newBroadcasts) {
        seenBroadcastIds.current.add(broadcast.id)
        toast.info(broadcast.title, {
          autoClose: 8000,
          onClick: () => navigate("/dashboard/notifications"),
        })
      }
    }
  }, [token, farmId, settings?.sound_enabled, settings?.browser_push_enabled, navigate])

  useEffect(() => {
    if (!token) return
    getNotificationPreferences(token, farmId).then((res) => {
      if (res.success && res.data?.settings) setSettings(res.data.settings)
    })
  }, [token, farmId])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 45000)
    return () => window.clearInterval(interval)
  }, [refresh])

  const handleOpen = async (notification: AppNotification) => {
    if (!token) return
    if (!notification.is_read && !notification.read_at) {
      await markNotificationRead(token, notification.id)
    }
    setOpen(false)
    await refresh()
  }

  const handleMarkAll = async () => {
    if (!token) return
    await markAllNotificationsRead(token, farmId)
    await refresh()
  }

  const badge = unread > 99 ? "99+" : String(unread)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleMarkAll}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              compact
              onOpen={handleOpen}
            />
          ))}
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p>
          )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setOpen(false)
              navigate("/dashboard/notifications")
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
