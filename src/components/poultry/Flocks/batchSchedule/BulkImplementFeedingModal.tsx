import { useEffect, useMemo, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
} from "@/components/ui/form-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, BarChart3, Calendar, Package, Wheat } from "lucide-react"
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Implement All Missed Feeding"
      description={
        <>
          Backfill all past days without a feeding record using planned schedule quantities. Records
          will be saved with status <span className="font-semibold">late</span> and feed inventory
          will be deducted for each day.
        </>
      }
      icon={Wheat}
      tone="schedule"
      size="md"
      busy={submitting}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          onConfirm={handleConfirm}
          submitLabel={`Implement ${preview?.count ?? 0} day(s)`}
          busyLabel="Implementing..."
          busy={submitting}
          disabled={loading || !canSubmit}
          icon={Wheat}
        />
      }
    >
      {loading ? (
        <LoadingState variant="centered" label="Loading missed days…" />
      ) : (
        <>
          <FormSection step={1} icon={BarChart3} title="Backfill summary" description="Days that will be recorded as late feedings.">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-center">
                  <div className="text-2xl font-bold text-teal-700">{preview?.count ?? 0}</div>
                  <div className="text-xs text-teal-800">Missed days</div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">
                    {(preview?.total_feed_kg ?? 0).toFixed(2)} kg
                  </div>
                  <div className="text-xs text-amber-800">Total planned feed</div>
                </div>
              </div>

              {missedDays.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    Date range: <span className="font-medium text-slate-800">{dateRange}</span>
                  </span>
                </div>
              )}

              {missedDays.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <AlertTriangle className="h-4 w-4" />
                  All past feeding days are already recorded.
                </div>
              )}
            </div>
          </FormSection>

          {showInventoryPicker && (
            <FormSection
              step={2}
              icon={Package}
              title="Feed inventory"
              description={
                selectionRequired.length > 0
                  ? "No usable stock was found for some feed type(s). You can pick a batch, or leave it blank — a zero-cost overdraft batch will be created automatically (update cost afterward)."
                  : "Optional: choose a preferred inventory batch. If not selected, the oldest usable stock will be used automatically."
              }
            >
              <div className="space-y-4">
                {[...selectionRequired, ...optionalSelection].map((req: FeedInventoryRequirement) => {
                  const options = selectableInventoriesByType.get(req.feed_type_id) ?? []
                  const stockShortfall =
                    (req.available_stock_kg ?? 0) > 0 &&
                    (req.available_stock_kg ?? 0) < req.total_feed_kg

                  return (
                    <FormField
                      key={req.feed_type_id}
                      label={`${req.feed_type_name} · ${req.total_feed_kg.toFixed(2)} kg across ${req.missed_days_count} day(s)`}
                      required={req.needs_selection}
                      hint={
                        stockShortfall
                          ? `${(req.available_stock_kg ?? 0).toFixed(2)} kg available across all batches — stock may go negative if you proceed.`
                          : undefined
                      }
                    >
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
                        <SelectTrigger className={formInputClass()}>
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
                    </FormField>
                  )
                })}
              </div>
            </FormSection>
          )}
        </>
      )}
    </FormModal>
  )
}

export default BulkImplementFeedingModal
