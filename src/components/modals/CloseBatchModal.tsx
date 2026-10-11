import { useEffect, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Archive, CalendarDays, ClipboardCheck } from "lucide-react"
import { updateFlockStatus } from "@/lib/request"
import { toast } from "react-toastify"

interface CloseBatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  farmId: number
  flockId: number
  flockName: string
  liveBirdCount: number
  onSuccess?: () => void
}

const CloseBatchModal = ({
  open,
  onOpenChange,
  token,
  farmId,
  flockId,
  flockName,
  liveBirdCount,
  onSuccess,
}: CloseBatchModalProps) => {
  const [status, setStatus] = useState<"completed" | "sold" | "culled">("completed")
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStatus("completed")
    setEndDate(new Date().toISOString().split("T")[0])
    setIsSubmitting(false)
  }, [open])

  const handleSubmit = async () => {
    if (!endDate) {
      toast.error("Select an end date")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateFlockStatus(token, farmId, flockId, {
        status,
        actual_end_date: endDate,
      })

      if (!result.success) {
        const msg = Array.isArray(result.error) ? result.error.join(", ") : String(result.error)
        throw new Error(msg || "Failed to close batch")
      }

      toast.success("Batch closed successfully")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close batch"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Close Batch"
      description={
        <>
          End the active batch for <strong>{flockName}</strong>. This updates the flock status and records the actual end date.
        </>
      }
      icon={Archive}
      tone="danger"
      size="sm"
      busy={isSubmitting}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitLabel="Close Batch"
          busy={isSubmitting}
          submitType="button"
          onConfirm={handleSubmit}
        />
      }
    >
      {liveBirdCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            This flock still has <strong>{liveBirdCount.toLocaleString()}</strong> live birds. Closing the batch will not change headcount automatically.
          </span>
        </div>
      )}

      <FormSection icon={ClipboardCheck} title="Closing details" description="Why and when this batch ended.">
        <div className="space-y-4">
          <FormField label="Close reason" htmlFor="close-status" required>
            <Select value={status} onValueChange={(value) => setStatus(value as "completed" | "sold" | "culled")}>
              <SelectTrigger id="close-status" className={formInputClass()}>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="culled">Culled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Actual end date" htmlFor="close-end-date" required>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="close-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}

export default CloseBatchModal
