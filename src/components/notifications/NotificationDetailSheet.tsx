import { useNavigate } from "react-router-dom"
import { ExternalLink, Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  categoryLabel,
  isPlatformBroadcast,
  notificationIcon,
  priorityClass,
  relativeTime,
} from "@/lib/notificationHelpers"
import { cn, formatDateTime } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"

type Props = {
  notification: AppNotification | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: (notification: AppNotification) => void
}

export default function NotificationDetailSheet({
  notification,
  open,
  onOpenChange,
  onDismiss,
}: Props) {
  const navigate = useNavigate()
  if (!notification) return null

  const Icon = notificationIcon(notification)
  const broadcast = isPlatformBroadcast(notification)
  const unread = !notification.is_read && !notification.read_at
  const createdLabel = notification.created_at
    ? `${relativeTime(notification.created_at)} · ${formatDateTime(notification.created_at)}`
    : null

  const handleOpenRelated = () => {
    if (!notification.action_url) return
    onOpenChange(false)
    navigate(notification.action_url)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="space-y-3 border-b pb-4 text-left">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                broadcast
                  ? "bg-violet-100 text-violet-700"
                  : unread
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              {broadcast ? <Megaphone className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {categoryLabel(notification.category, notification.type)}
                </Badge>
                {(notification.priority === "high" || notification.priority === "critical") && (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", priorityClass(notification.priority))}
                  >
                    {notification.priority}
                  </Badge>
                )}
                {unread ? (
                  <Badge className="bg-emerald-500 text-[10px] text-white hover:bg-emerald-500">
                    Unread
                  </Badge>
                ) : null}
              </div>
              <SheetTitle className="text-left text-lg leading-snug">
                {notification.title}
              </SheetTitle>
              {createdLabel ? (
                <SheetDescription className="text-left text-xs">
                  {createdLabel}
                </SheetDescription>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {notification.body ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {notification.body}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No additional details for this notification.</p>
          )}

          {notification.farm?.name ? (
            <p className="text-xs text-slate-500">
              Farm: <span className="font-medium text-slate-700">{notification.farm.name}</span>
            </p>
          ) : null}

          {notification.instance?.title ? (
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Related task</p>
              <p className="font-medium text-slate-800">{notification.instance.title}</p>
              {notification.instance.scheduled_date ? (
                <p className="text-xs text-slate-500">
                  Scheduled {notification.instance.scheduled_date}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <SheetFooter className="mt-auto flex-col gap-2 border-t pt-4 sm:flex-col">
          {notification.action_url ? (
            <Button type="button" className="w-full" onClick={handleOpenRelated}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {notification.action_label || "Open related page"}
            </Button>
          ) : null}
          {onDismiss ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                onDismiss(notification)
                onOpenChange(false)
              }}
            >
              Dismiss
            </Button>
          ) : null}
          <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
