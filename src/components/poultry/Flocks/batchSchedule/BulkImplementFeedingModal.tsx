import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Calendar, Package, Wheat } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import { getFeedInventories, getMissedFeedingDays, implementMissedFeedingDays } from "@/lib/request"
import { LoadingState } from "@/components/general/LoadingState"
import type { FeedInventoryRequirement, FeedInventoryType, MissedFeedingDaysPreview } from "@/lib/types"

const flattenApiErrors = (error: unknown): string => {
  if (!error) return ""
  if (typeof error === "string") return error
  if (Array.isArray(error)) return error.map(String).join(", ")
  if (typeof error === "object") {
    return Object.values(error as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(String)
      .filter(Boolean)
      .join(", ")
  }
  return String(error)
}

interface BulkImplementFeedingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchScheduleId: number
  fallbackPreview?: MissedFeedingDaysPreview | null
  onSuccess?: () => void
}

const BulkImplementFeedingModal = ({
  open,
  onOpenChange,
  batchScheduleId,
  fallbackPreview,
  onSuccess,
}: BulkImplementFeedingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<MissedFeedingDaysPreview | null>(null)
  const [inventories, setInventories] = useState<FeedInventoryType[]>([])
  const [inventorySelections, setInventorySelections] = useState<Record<number, number>>({})
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  useEffect(() => {
    if (!open || !token || !farmId) return

    setInventorySelections({})
    setLoading(true)

    Promise.all([
      getMissedFeedingDays(token, farmId, batchScheduleId),
      getFeedInventories(token, farmId),
    ])
      .then(([missedResponse, inventoryResponse]) => {
        if (missedResponse.success && missedResponse.data) {
          setPreview(missedResponse.data)
        } else if (fallbackPreview) {
          setPreview(fallbackPreview)
        } else {
          toast.error(missedResponse.error?.[0] || "Failed to load missed feeding days")
        }

        if (inventoryResponse.success && inventoryResponse.data) {
          setInventories(inventoryResponse.data)
        }
      })
      .finally(() => setLoading(false))
  }, [open, token, farmId, batchScheduleId, fallbackPreview])

  const requirements = preview?.inventory_requirements ?? []
  const selectionRequired = requirements.filter((req) => req.needs_selection)
  const optionalSelection = requirements.filter((req) => !req.needs_selection && req.has_auto_inventory)
  const showInventoryPicker = selectionRequired.length > 0 || optionalSelection.length > 0

  const isUsableInventory = (inv: FeedInventoryType) => {
    const status = String(inv.status).toLowerCase()
    return (
      Number(inv.quantity) > 0 &&
      (status === "available" || status === "in_use")
    )
  }

  const selectableInventoriesByType = useMemo(() => {
    const map = new Map<number, FeedInventoryType[]>()
    const typesToPick = [...selectionRequired, ...optionalSelection]

    for (const req of typesToPick) {
      const matching = inventories.filter(
        (inv) =>
          Number(inv.poultry_feed_type_id) === req.feed_type_id &&
          isUsableInventory(inv)
      )

      const options =
        matching.length > 0
          ? matching
          : inventories.filter((inv) => isUsableInventory(inv))

      map.set(req.feed_type_id, options)
    }

    return map
  }, [inventories, selectionRequired, optionalSelection])

  const requirementsReady =
    (preview?.count ?? 0) === 0 ||
    (preview?.inventory_requirements != null && preview.inventory_requirements.length > 0)

  const allSelectionsMade = selectionRequired.every(
    (req) => inventorySelections[req.feed_type_id] != null
  )

  const canSubmit =
    requirementsReady &&
    (preview?.count ?? 0) > 0 &&
    (selectionRequired.length === 0 || allSelectionsMade)

  const handleConfirm = async () => {
    if (!token || !farmId || !canSubmit) return

    setSubmitting(true)
    try {
      const inventoryByFeedType =
        showInventoryPicker && Object.keys(inventorySelections).length > 0
          ? Object.fromEntries(
              Object.entries(inventorySelections).map(([feedTypeId, inventoryId]) => [
                Number(feedTypeId),
                inventoryId,
              ])
            )
          : undefined

      const response = await implementMissedFeedingDays(token, farmId, batchScheduleId, {
        status: "late",
        inventory_by_feed_type: inventoryByFeedType,
      })

      if (!response.success || !response.data) {
        throw new Error(
          flattenApiErrors(response.error) || "Failed to implement missed feeding days"
        )
      }

      const { created_count, daily_records_created, daily_records_updated, inventory_warnings } = response.data

      if (created_count === 0) {
        toast.info("No missed feeding days to implement")
      } else {
        const dailySummary =
          daily_records_created > 0 || daily_records_updated > 0
            ? ` (${daily_records_created} daily record${daily_records_created === 1 ? "" : "s"} created` +
              (daily_records_updated > 0
                ? `, ${daily_records_updated} updated`
                : "") +
              ")"
            : ""
        toast.success(`Implemented ${created_count} missed feeding day(s)${dailySummary}`)
      }

      if (inventory_warnings?.length) {
        inventory_warnings.forEach((warning) => toast.warn(warning))
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to implement missed feeding days"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const missedDays = preview?.missed_days ?? []
  const dateRange =
    missedDays.length > 0
      ? `${format(parseISO(missedDays[0].feeding_date), "MMM d")} – ${format(
          parseISO(missedDays[missedDays.length - 1].feeding_date),
          "MMM d, yyyy"
        )}`
      : "—"

  const renderInventoryLabel = (inv: FeedInventoryType) => {
    const feedName = inv.feed_type?.name ?? `Type #${inv.poultry_feed_type_id}`
    return `${feedName} · Batch ${inv.batch_number} · ${Number(inv.quantity).toFixed(1)} kg`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-orange-600" />
            Implement All Missed Feeding
          </DialogTitle>
          <DialogDescription>
            Backfill all past days without a feeding record using planned schedule quantities.
            Records will be saved with status <span className="font-medium">late</span> and feed
            inventory will be deducted for each day.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingState variant="centered" label="Loading missed days…" />
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-orange-50 p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">{preview?.count ?? 0}</div>
                <div className="text-xs text-orange-800">Missed days</div>
              </div>
              <div className="rounded-lg border bg-amber-50 p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {(preview?.total_feed_kg ?? 0).toFixed(2)} kg
                </div>
                <div className="text-xs text-amber-800">Total planned feed</div>
              </div>
            </div>

            {missedDays.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600 rounded-lg border px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  Date range: <span className="font-medium text-slate-800">{dateRange}</span>
                </span>
              </div>
            )}

            {showInventoryPicker && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2 text-sm text-amber-900">
                  <Package className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    {selectionRequired.length > 0
                      ? "No usable stock was found for some feed type(s). You can pick a batch, or leave it blank — a zero-cost overdraft batch will be created automatically (update cost afterward)."
                      : "Optional: choose a preferred inventory batch. If not selected, the oldest usable stock will be used automatically."}
                  </p>
                </div>

                {[...selectionRequired, ...optionalSelection].map((req: FeedInventoryRequirement) => {
                  const options = selectableInventoriesByType.get(req.feed_type_id) ?? []
                  const stockShortfall =
                    (req.available_stock_kg ?? 0) > 0 &&
                    (req.available_stock_kg ?? 0) < req.total_feed_kg

                  return (
                    <div key={req.feed_type_id} className="space-y-1.5">
                      <Label className="text-xs text-amber-900">
                        {req.feed_type_name} · {req.total_feed_kg.toFixed(2)} kg across{" "}
                        {req.missed_days_count} day(s)
                        {req.needs_selection ? " *" : ""}
                      </Label>
                      {stockShortfall && (
                        <p className="text-xs text-amber-800">
                          {(req.available_stock_kg ?? 0).toFixed(2)} kg available across all batches
                          — stock may go negative if you proceed.
                        </p>
                      )}
                      <Select
                        value={
                          inventorySelections[req.feed_type_id]
                            ? String(inventorySelections[req.feed_type_id])
                            : undefined
                        }
                        onValueChange={(value) =>
                          setInventorySelections((prev) => ({
                            ...prev,
                            [req.feed_type_id]: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 bg-white text-sm">
                          <SelectValue
                            placeholder={
                              req.needs_selection
                                ? "Select feed inventory batch"
                                : "Automatic (oldest stock)"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {options.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No inventory batches available
                            </SelectItem>
                          ) : (
                            options.map((inv) => (
                              <SelectItem key={inv.id} value={String(inv.id)}>
                                {renderInventoryLabel(inv)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            )}

            {missedDays.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4" />
                All past feeding days are already recorded.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || submitting || !canSubmit}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting && <LoadingState variant="button" loading label="Implementing…" />}
            {submitting ? "Implementing..." : `Implement ${preview?.count ?? 0} day(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkImplementFeedingModal
