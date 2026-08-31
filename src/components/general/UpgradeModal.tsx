import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {message && COPY[code ?? ""] && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link to="/dashboard/settings/billing">View plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function isUpgradeCode(code?: string | null): boolean {
  return !!code && code in COPY
}
