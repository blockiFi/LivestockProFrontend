import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormModal, modalTone } from "@/components/ui/form-modal"
import { cn } from "@/lib/utils"

const COPY: Record<string, { title: string; body: string }> = {
  plan_user_limit_reached: {
    title: "Upgrade to add more team members",
    body: "The Basic plan includes one user. Standard unlocks an unlimited team for ₦10,000 per month.",
  },
  plan_batch_limit_reached: {
    title: "Upgrade for unlimited batches",
    body: "The Basic plan allows one active batch at a time. End the current batch, or upgrade to Standard for unlimited batches.",
  },
  ai_not_included: {
    title: "AI is on the Premium plan",
    body: "Feed formulation, flock insights, and document import require Premium at ₦15,000 per month.",
  },
  subscription_read_only: {
    title: "This farm is read-only",
    body: "Choose a plan to start adding records again. Your existing data is still here.",
  },
}

type UpgradeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  code?: string | null
  message?: string | null
}

export function UpgradeModal({ open, onOpenChange, code, message }: UpgradeModalProps) {
  const copy = (code && COPY[code]) || {
    title: "Upgrade this farm",
    body: message || "This action is not included in the current plan.",
  }
  const showMessage = !!message && !!COPY[code ?? ""]

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.body}
      icon={Sparkles}
      tone="settings"
      size="sm"
      bodyClassName={showMessage ? undefined : "hidden"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Not now
          </Button>
          <Button asChild className={cn("rounded-xl text-white", modalTone("settings").button)}>
            <Link to="/dashboard/settings/billing">View plans</Link>
          </Button>
        </>
      }
    >
      {showMessage && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>
      )}
    </FormModal>
  )
}

export function isUpgradeCode(code?: string | null): boolean {
  return !!code && code in COPY
}
