import { useEffect, useState } from "react"
import { ConfirmModal } from "@/components/ui/form-modal"
import { AlertTriangle, Calendar, Loader2, Undo2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import { getRevertibleFeedingDays, revertMissedFeedingDays } from "@/lib/request"
import type { RevertibleFeedingDaysPreview } from "@/lib/types"

interface BulkRevertFeedingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchScheduleId: number
  fallbackPreview?: RevertibleFeedingDaysPreview | null
  onSuccess?: () => void
}

const BulkRevertFeedingModal = ({
  open,
  onOpenChange,
  batchScheduleId,
  fallbackPreview,
  onSuccess,
}: BulkRevertFeedingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<RevertibleFeedingDaysPreview | null>(null)
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  useEffect(() => {
    if (!open || !token || !farmId) return

    setLoading(true)
    getRevertibleFeedingDays(token, farmId, batchScheduleId)
      .then((response) => {
        if (response.success && response.data) {
          setPreview(response.data)
        } else if (fallbackPreview) {
          setPreview(fallbackPreview)
        } else {
          toast.error(response.error?.[0] || "Failed to load revertible feeding days")
        }
      })
      .finally(() => setLoading(false))
  }, [open, token, farmId, batchScheduleId, fallbackPreview])

  const handleConfirm = async () => {
    if (!token || !farmId) return

    setSubmitting(true)
    try {
      const response = await revertMissedFeedingDays(token, farmId, batchScheduleId)

      if (!response.success || !response.data) {
        throw new Error(response.error?.[0] || "Failed to revert feeding backfills")
      }

      const { reverted_count, inventory_restored_kg } = response.data

      if (reverted_count === 0) {
        toast.info("No late backfills to revert")
      } else {
        toast.success(
          `Reverted ${reverted_count} late backfill(s)` +
            (inventory_restored_kg > 0 ? ` · ${inventory_restored_kg.toFixed(2)} kg restored to inventory` : "")
        )
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revert feeding backfills"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const revertibleDays = preview?.revertible_days ?? []
  const dateRange =
    revertibleDays.length > 0
      ? `${format(parseISO(revertibleDays[0].feeding_date), "MMM d")} – ${format(
          parseISO(revertibleDays[revertibleDays.length - 1].feeding_date),
          "MMM d, yyyy"
        )}`
      : "—"

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title="Revert Bulk Backfill"
      description="Remove late backfill feeding records and restore feed inventory where usage was deducted. Manually recorded feedings are not affected."
      icon={Undo2}
      tone="danger"
      busy={submitting}
      confirmDisabled={loading || (preview?.count ?? 0) === 0}
      confirmLabel={`Revert ${preview?.count ?? 0} record(s)`}
      busyLabel="Reverting..."
      confirmIcon={Undo2}
      onConfirm={handleConfirm}
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading revertible records...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-slate-800">{preview?.count ?? 0}</div>
              <div className="text-xs text-slate-500">Late backfills</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-rose-700">
                {(preview?.total_feed_kg ?? 0).toFixed(2)} kg
              </div>
              <div className="text-xs text-rose-800">Feed to restore</div>
            </div>
          </div>

          {revertibleDays.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                Date range: <span className="font-medium text-slate-800">{dateRange}</span>
              </span>
            </div>
          )}

          {revertibleDays.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <AlertTriangle className="h-4 w-4" />
              No late backfill records to revert.
            </div>
          )}
        </div>
      )}
    </ConfirmModal>
  )
}

export default BulkRevertFeedingModal
