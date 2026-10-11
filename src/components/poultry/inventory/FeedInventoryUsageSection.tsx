import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormField, FormModal, FormSection, ModalFooterActions, formInputClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Wheat,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Boxes,
  Receipt,
  Scale,
} from "lucide-react"
import { toast } from "react-toastify"
import { forceFeedUsageExpenditure, getFeedUsagesByInventory, updateFeedUsageRecord } from "@/lib/request"
import type { FeedInventoryType, PoultryFeedUsageRecord } from "@/lib/types"
import { formatDate, Naira, formatCurrency } from "@/lib/utils"

interface FeedInventoryUsageSectionProps {
  inventoryId: number
  farmId: number
  token: string
  unit?: string
  /** Other farm inventories available as move destinations */
  inventories?: FeedInventoryType[]
  /** Called after a usage is moved so the parent can refresh stock totals */
  onUsageMoved?: () => void
}

const FeedInventoryUsageSection = ({
  inventoryId,
  farmId,
  token,
  unit = "kg",
  inventories = [],
  onUsageMoved,
}: FeedInventoryUsageSectionProps) => {
  const [isUsageExpanded, setIsUsageExpanded] = useState(false)
  const [records, setRecords] = useState<PoultryFeedUsageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [movingRecord, setMovingRecord] = useState<PoultryFeedUsageRecord | null>(null)
  const [destinationInventoryId, setDestinationInventoryId] = useState<string>("")
  const [moveQuantity, setMoveQuantity] = useState<string>("")
  const [isMoving, setIsMoving] = useState(false)
  const [forcingUsageId, setForcingUsageId] = useState<number | null>(null)

  useEffect(() => {
    setHasLoaded(false)
    setRecords([])
    setError(null)
  }, [inventoryId])

  useEffect(() => {
    if (!isUsageExpanded || hasLoaded || !token || !farmId || !inventoryId) return

    let cancelled = false

    const fetchUsages = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getFeedUsagesByInventory(token, farmId, inventoryId)
        if (cancelled) return

        if (response.success && response.data) {
          setRecords(response.data)
        } else {
          const message = Array.isArray(response.error)
            ? response.error.join(", ")
            : (typeof response.error === "string" ? response.error : "Failed to load feed usage history")
          setError(message)
          setRecords([])
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load feed usage history")
          setRecords([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasLoaded(true)
        }
      }
    }

    void fetchUsages()

    return () => {
      cancelled = true
    }
  }, [isUsageExpanded, hasLoaded, inventoryId, farmId, token])

  const handleRetry = () => {
    setHasLoaded(false)
    setError(null)
  }

  const totalQuantity = useMemo(
    () => records.reduce((sum, record) => sum + (record.quantity || 0), 0),
    [records]
  )

  const totalCost = useMemo(
    () => records.reduce((sum, record) => sum + (record.quantity || 0) * (record.unit_cost || 0), 0),
    [records]
  )

  const destinationOptions = useMemo(() => {
    if (!movingRecord) return []

    const feedTypeId = movingRecord.poultry_feed_type_id

    return inventories
      .filter((inv) => inv.id !== inventoryId)
      .filter((inv) => {
        const status = (inv.status || "").toLowerCase()
        return status !== "closed"
      })
      .sort((a, b) => {
        const sameTypeA = a.poultry_feed_type_id === feedTypeId ? 0 : 1
        const sameTypeB = b.poultry_feed_type_id === feedTypeId ? 0 : 1
        if (sameTypeA !== sameTypeB) return sameTypeA - sameTypeB
        return String(a.batch_number).localeCompare(String(b.batch_number))
      })
  }, [inventories, inventoryId, movingRecord])

  const hasMoveTargets = useMemo(
    () =>
      inventories.some((inv) => {
        if (inv.id === inventoryId) return false
        return (inv.status || "").toLowerCase() !== "closed"
      }),
    [inventories, inventoryId]
  )

  const openMoveDialog = (record: PoultryFeedUsageRecord) => {
    setMovingRecord(record)
    setDestinationInventoryId("")
    setMoveQuantity(record.quantity != null ? String(record.quantity) : "")
  }

  const closeMoveDialog = () => {
    if (isMoving) return
    setMovingRecord(null)
    setDestinationInventoryId("")
    setMoveQuantity("")
  }

  const maxMoveQuantity = movingRecord?.quantity ?? 0
  const parsedMoveQuantity = Number(moveQuantity)
  const isPartialMove =
    movingRecord != null &&
    Number.isFinite(parsedMoveQuantity) &&
    parsedMoveQuantity > 0 &&
    parsedMoveQuantity < maxMoveQuantity - 0.001

  const handleMoveUsage = async () => {
    if (!movingRecord || !destinationInventoryId) {
      toast.error("Select a destination inventory")
      return
    }

    if (!Number.isFinite(parsedMoveQuantity) || parsedMoveQuantity <= 0) {
      toast.error("Enter a valid quantity to move")
      return
    }

    if (parsedMoveQuantity > maxMoveQuantity + 0.001) {
      toast.error(`Cannot move more than ${maxMoveQuantity.toFixed(2)} ${unit}`)
      return
    }

    setIsMoving(true)
    try {
      const payload: {
        poultry_feed_inventory_id: number
        move_quantity?: number
      } = {
        poultry_feed_inventory_id: Number(destinationInventoryId),
      }

      if (isPartialMove) {
        payload.move_quantity = parsedMoveQuantity
      }

      const response = await updateFeedUsageRecord(token, farmId, movingRecord.id, payload)

      if (!response.success) {
        toast.error(
          Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error || "Failed to move feed usage"
        )
        return
      }

      const updatedUsage =
        response.data && typeof response.data === "object" && "usage" in response.data
          ? (response.data as { usage: PoultryFeedUsageRecord }).usage
          : (response.data as PoultryFeedUsageRecord)

      toast.success(
        isPartialMove
          ? `Moved ${parsedMoveQuantity.toFixed(2)} ${unit} to the selected inventory`
          : "Feed usage moved to the selected inventory"
      )
      setMovingRecord(null)
      setDestinationInventoryId("")
      setMoveQuantity("")
      setHasLoaded(false)
      setRecords((prev) =>
        prev.map((record) => (record.id === movingRecord.id ? { ...record, ...updatedUsage } : record))
      )
      onUsageMoved?.()
    } finally {
      setIsMoving(false)
    }
  }

  const handleForceExpenditure = async (record: PoultryFeedUsageRecord) => {
    if (record.has_expenditure) {
      toast.info("Expenditure already recorded for this usage")
      return
    }

    setForcingUsageId(record.id)
    try {
      const response = await forceFeedUsageExpenditure(token, farmId, record.id)

      if (!response.success) {
        toast.error(
          Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error || "Failed to record expenditure"
        )
        return
      }

      if (response.data?.created) {
        toast.success("Expenditure recorded for this feed usage")
      } else {
        toast.info("Expenditure already recorded for this usage")
      }

      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id ? { ...r, has_expenditure: true } : r
        )
      )
      onUsageMoved?.()
    } finally {
      setForcingUsageId(null)
    }
  }

  return (
    <Collapsible open={isUsageExpanded} onOpenChange={setIsUsageExpanded} className="pt-4 border-t border-gray-200">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-gray-800 hover:text-gray-900"
        >
          <span className="flex items-center gap-2">
            <Wheat className="h-4 w-4 text-amber-600" />
            Feed Usage History
          </span>
          {isUsageExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-3">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading usage history...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && hasLoaded && records.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          No usage recorded for this inventory.
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2">
                <Wheat className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700">Total Used</p>
                  <p className="font-semibold text-amber-900">{totalQuantity.toFixed(2)} {unit}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-700">Total Cost</p>
                  <p className="font-semibold text-green-900">{Naira}{formatCurrency(totalCost)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usage Date</TableHead>
                  <TableHead>Flock</TableHead>
                  <TableHead>Quantity ({unit})</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const lineCost = (record.quantity || 0) * (record.unit_cost || 0)
                  const isForcing = forcingUsageId === record.id
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.usage_date ? formatDate(record.usage_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.flock?.name || "—"}</p>
                          {record.flock?.batch_number && (
                            <p className="text-xs text-gray-500">Batch {record.flock.batch_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.quantity?.toFixed(2) ?? "0.00"}</TableCell>
                      <TableCell>{Naira}{formatCurrency(record.unit_cost || 0)}</TableCell>
                      <TableCell className="font-medium">{Naira}{formatCurrency(lineCost)}</TableCell>
                      <TableCell>{record.recorded_by_name ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleForceExpenditure(record)}
                            disabled={isForcing || isMoving || Boolean(record.has_expenditure)}
                            title={
                              record.has_expenditure
                                ? "Expenditure already recorded"
                                : "Create expenditure if missing"
                            }
                          >
                            {isForcing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Receipt className="h-3.5 w-3.5" />
                            )}
                            {record.has_expenditure ? "Recorded" : "Force Expenditure"}
                          </Button>
                          {hasMoveTargets && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => openMoveDialog(record)}
                              disabled={isMoving || isForcing}
                              title="Move to another inventory"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                              Move
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      </CollapsibleContent>

      <FormModal
        open={Boolean(movingRecord)}
        onOpenChange={(open) => {
          if (!open) closeMoveDialog()
        }}
        title="Move feed usage"
        description="Move all or part of this usage to another inventory batch. Stock is restored on the current batch and deducted from the destination."
        icon={ArrowRightLeft}
        tone="feed"
        size="md"
        busy={isMoving}
        footer={
          <ModalFooterActions
            onCancel={closeMoveDialog}
            submitType="button"
            onConfirm={handleMoveUsage}
            submitLabel={isPartialMove ? `Move ${parsedMoveQuantity.toFixed(2)} ${unit}` : "Move usage"}
            busyLabel="Moving..."
            busy={isMoving}
            disabled={
              !destinationInventoryId ||
              destinationInventoryId === "__none" ||
              !Number.isFinite(parsedMoveQuantity) ||
              parsedMoveQuantity <= 0 ||
              parsedMoveQuantity > maxMoveQuantity + 0.001
            }
            icon={ArrowRightLeft}
          />
        }
      >
        {movingRecord && (
          <>
            <dl className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd className="font-medium text-slate-900">
                  {movingRecord.usage_date ? formatDate(movingRecord.usage_date) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Flock</dt>
                <dd className="font-medium text-slate-900">{movingRecord.flock?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-medium text-slate-900">
                  {movingRecord.quantity?.toFixed(2) ?? "0.00"} {unit}
                </dd>
              </div>
            </dl>

            <FormSection step={1} icon={Scale} title="Amount" description="Move the full usage or just part of it.">
              <FormField
                label={`Quantity to move (${unit})`}
                htmlFor="move-quantity"
                hint={
                  isPartialMove
                    ? `${(maxMoveQuantity - parsedMoveQuantity).toFixed(2)} ${unit} will remain on this batch.`
                    : "Leave at the full amount to move the entire usage row."
                }
              >
                <Input
                  id="move-quantity"
                  type="number"
                  min={0.01}
                  max={maxMoveQuantity}
                  step="0.01"
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(e.target.value)}
                  placeholder={`Max ${maxMoveQuantity.toFixed(2)}`}
                  className={formInputClass()}
                />
              </FormField>
            </FormSection>

            <FormSection step={2} icon={Boxes} title="Destination" description="The inventory batch that should carry this usage.">
              <FormField label="Destination inventory">
                <Select value={destinationInventoryId} onValueChange={setDestinationInventoryId}>
                  <SelectTrigger className={formInputClass()}>
                    <SelectValue placeholder="Select inventory batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationOptions.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No other open inventories available
                      </SelectItem>
                    ) : (
                      destinationOptions.map((inv) => {
                        const sameType = inv.poultry_feed_type_id === movingRecord.poultry_feed_type_id
                        return (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            <div>
                              <div className="font-medium">
                                Batch {inv.batch_number}
                                {inv.feed_type?.name ? ` · ${inv.feed_type.name}` : ""}
                                {!sameType ? " (different feed type)" : ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {inv.manufacturer} · {Number(inv.quantity).toFixed(2)} {unit} left ·{" "}
                                {Naira}{formatCurrency(Number(inv.unit_cost))}/{unit}
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
              </FormField>
            </FormSection>
          </>
        )}
      </FormModal>
    </Collapsible>
  )
}

export default FeedInventoryUsageSection
