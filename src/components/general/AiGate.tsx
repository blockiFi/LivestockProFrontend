import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"

import { useSubscription } from "@/hooks/useSubscription"

type AiGateProps = {
  children: ReactNode
  /** Rendered instead of the upgrade notice when the plan has no AI. */
  fallback?: ReactNode
}

/**
 * Hides AI-powered UI on farms whose plan does not include AI. The backend
 * enforces the same rule, so this only avoids showing buttons that would fail.
 */
export function AiGate({ children, fallback }: AiGateProps) {
  const { aiEnabled } = useSubscription()

  if (aiEnabled) {
    return <>{children}</>
  }

  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  return <AiUpgradeNotice />
}

export function AiUpgradeNotice({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground"
      }
    >
      <Sparkles className="h-4 w-4" />
      <span>AI features are available on the Premium plan.</span>
      <Link to="/dashboard/settings/billing" className="font-medium text-primary hover:underline">
        View plans
      </Link>
    </div>
  )
}
