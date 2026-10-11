import { useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { FarmTaskInstance } from "@/lib/types"
import { ClipboardCheck, PenLine, Pill } from "lucide-react"
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
    <FormModal
      open={open}
      onOpenChange={handleOpen}
      title="Complete & sign off"
      description={
        <>
          {instance.title} · {formatTaskTime(instance.start_time)} · {sectionLabel(instance.section)}
        </>
      }
      icon={ClipboardCheck}
      tone="schedule"
      size="md"
      busy={!!saving}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          submitLabel="Complete"
          busy={!!saving}
          disabled={
            !!(instance.require_completion_confirmation && !confirmed) ||
            !!(instance.require_signature && !signature.trim())
          }
          onConfirm={() =>
            onSubmit({
              notes: notes || undefined,
              worker_confirmed: confirmed || undefined,
              signature_text: signature.trim() || undefined,
            })
          }
        />
      }
    >
      {instance.section === "medication" && (
        <FormSection icon={Pill} title="Medication details" description="What should be administered for this task.">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {instance.animal_group && (
              <div>
                <dt className="text-xs text-slate-500">Group</dt>
                <dd className="font-medium text-slate-900">{instance.animal_group}</dd>
              </div>
            )}
            {instance.medication_name && (
              <div>
                <dt className="text-xs text-slate-500">Medication</dt>
                <dd className="font-medium text-slate-900">{instance.medication_name}</dd>
              </div>
            )}
            {instance.dosage_instructions && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Dosage</dt>
                <dd className="font-medium text-slate-900">{instance.dosage_instructions}</dd>
              </div>
            )}
          </dl>
        </FormSection>
      )}

      <FormSection icon={PenLine} title="Sign-off" description="Add notes and confirm the task was completed.">
        <div className="space-y-4">
          <FormField label="Notes" htmlFor="complete-task-notes">
            <Textarea
              id="complete-task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={formTextareaClass()}
            />
          </FormField>

          {instance.require_completion_confirmation && (
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700">
              <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(Boolean(c))} />
              I confirm this task was completed as instructed
            </label>
          )}

          {instance.require_signature && (
            <FormField label="Sign-off name" htmlFor="complete-task-signature" required>
              <Input
                id="complete-task-signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className={formInputClass()}
              />
            </FormField>
          )}
        </div>
      </FormSection>

      {instance.require_supervisor_approval && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This task will await supervisor approval after you complete it.
        </p>
      )}
    </FormModal>
  )
}
