import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { FarmTaskInstance } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { formatTaskTime, sectionLabel } from "./taskHelpers"

type Props = {
  open: boolean
  instance: FarmTaskInstance | null
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: {
    notes?: string
    worker_confirmed?: boolean
    signature_text?: string
  }) => Promise<void>
  saving?: boolean
}

export default function CompleteTaskDialog({
  open,
  instance,
  onOpenChange,
  onSubmit,
  saving,
}: Props) {
  const [notes, setNotes] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [signature, setSignature] = useState("")

  const handleOpen = (next: boolean) => {
    if (next) {
      setNotes("")
      setConfirmed(false)
      setSignature("")
    }
    onOpenChange(next)
  }

  if (!instance) return null

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete &amp; sign off</DialogTitle>
          <DialogDescription>
            {instance.title} · {formatTaskTime(instance.start_time)} ·{" "}
            {sectionLabel(instance.section)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {instance.section === "medication" && (
            <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm space-y-1">
              {instance.animal_group && (
                <p>
                  <span className="text-slate-500">Group:</span> {instance.animal_group}
                </p>
              )}
              {instance.medication_name && (
                <p>
                  <span className="text-slate-500">Medication:</span>{" "}
                  {instance.medication_name}
                </p>
              )}
              {instance.dosage_instructions && (
                <p>
                  <span className="text-slate-500">Dosage:</span>{" "}
                  {instance.dosage_instructions}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          {instance.require_completion_confirmation && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(Boolean(c))} />
              I confirm this task was completed as instructed
            </label>
          )}

          {instance.require_signature && (
            <div className="space-y-2">
              <Label>Sign-off name</Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
              />
            </div>
          )}

          {instance.require_supervisor_approval && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              This task will await supervisor approval after you complete it.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={
              saving ||
              (instance.require_completion_confirmation && !confirmed) ||
              (instance.require_signature && !signature.trim())
            }
            onClick={() =>
              onSubmit({
                notes: notes || undefined,
                worker_confirmed: confirmed || undefined,
                signature_text: signature.trim() || undefined,
              })
            }
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
