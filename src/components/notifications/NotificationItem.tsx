import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  categoryLabel,
  isPlatformBroadcast,
  notificationIcon,
  priorityClass,
  relativeTime,
} from "@/lib/notificationHelpers"
import type { AppNotification } from "@/lib/types"

type Props = {
  notification: AppNotification
  compact?: boolean
  onOpen?: (notification: AppNotification) => void
  onDismiss?: (notification: AppNotification) => void
}

export default function NotificationItem({
  notification,
  compact,
  onOpen,
  onDismiss,
}: Props) {
  const navigate = useNavigate()
  const Icon = notificationIcon(notification)
  const unread = !notification.is_read && !notification.read_at
  const broadcast = isPlatformBroadcast(notification)

  const handleOpen = () => {
    onOpen?.(notification)
    if (notification.action_url) {
      navigate(notification.action_url)
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-colors",
        broadcast
          ? unread
            ? "border-violet-200 bg-violet-50/80 hover:bg-violet-50"
            : "border-violet-100 bg-white hover:bg-violet-50/40"
          : unread
          ? "border-sky-200 bg-sky-50/70 hover:bg-sky-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            unread ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
            broadcast && (unread ? "bg-violet-100 text-violet-700" : "bg-violet-50 text-violet-600")
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {categoryLabel(notification.category, notification.type)}
              </Badge>
              {(notification.priority === "high" || notification.priority === "critical") && (
                <Badge variant="outline" className={cn("text-[10px]", priorityClass(notification.priority))}>
                  {notification.priority}
                </Badge>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">
              {relativeTime(notification.created_at)}
            </span>
          </div>
          <p className={cn("mt-1 text-sm", unread ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
            {notification.title}
          </p>
          {notification.body && (!compact || broadcast) && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{notification.body}</p>
          )}
          {onDismiss && (
            <div className="mt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  onDismiss(notification)
                }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
        {unread && (
          <span
            className={cn(
              "mt-2 h-2 w-2 shrink-0 rounded-full",
              broadcast ? "bg-violet-500" : "bg-sky-500"
            )}
          />
        )}
      </div>
    </button>
  )
}
