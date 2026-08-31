import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Loader2 } from "lucide-react"
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
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close Batch</DialogTitle>
          <DialogDescription>
            End the active batch for <strong>{flockName}</strong>. This updates the flock status and records the actual end date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {liveBirdCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                This flock still has <strong>{liveBirdCount.toLocaleString()}</strong> live birds. Closing the batch will not change headcount automatically.
              </span>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="close-status">Close reason</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "completed" | "sold" | "culled")}>
              <SelectTrigger id="close-status">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="culled">Culled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="close-end-date">Actual end date</Label>
            <Input
              id="close-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CloseBatchModal
