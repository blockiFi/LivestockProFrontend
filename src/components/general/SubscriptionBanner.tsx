import { Link } from "react-router-dom"
import { AlertTriangle, Clock } from "lucide-react"

import { useSubscription } from "@/hooks/useSubscription"
import { usePermissions } from "@/hooks/usePermissions"
import { formatDate } from "@/lib/utils"

/**
 * Persistent notice across every farm page when the subscription needs
 * attention. Silent while the plan is healthy.
 */
export function SubscriptionBanner() {
  const { subscription, isReadOnly } = useSubscription()
  const { can } = usePermissions()

  if (!subscription) return null

  const canManage = can("manage billing")

  if (isReadOnly) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="font-medium text-destructive">This farm is read-only.</span>
        <span className="text-muted-foreground">
          Your records are safe, but adding or editing data is paused until a plan is active.
        </span>
        {canManage && (
          <Link to="/dashboard/settings/billing" className="font-medium text-primary hover:underline">
            Choose a plan
          </Link>
        )}
      </div>
    )
  }

  if (subscription.status === "grace" || subscription.status === "past_due") {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
        <Clock className="h-4 w-4 text-amber-700" />
        <span className="font-medium text-amber-900">We could not process your last payment.</span>
        <span className="text-amber-800">This farm becomes read-only shortly unless payment succeeds.</span>
        {canManage && (
          <Link to="/dashboard/settings/billing" className="font-medium text-amber-900 underline">
            Update billing
          </Link>
        )}
      </div>
    )
  }

  if (subscription.status === "trialing" && subscription.trial_ends_at) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Free trial ends {formatDate(subscription.trial_ends_at)}.</span>
        {canManage && (
          <Link to="/dashboard/settings/billing" className="font-medium text-primary hover:underline">
            Pick a plan
          </Link>
        )}
      </div>
    )
  }

  return null
}
