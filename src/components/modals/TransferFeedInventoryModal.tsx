"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { GetToken, getFarm, transferFeedInventory } from "@/lib/request"
import type { FeedInventoryType } from "@/lib/types"
import { formatCurrency, Naira } from "@/lib/utils"
import { toast } from "react-toastify"

type TargetInventory = {
  id: number
  name: string
  batchNumber: string
  availableQuantity: number
  feedTypeId: number
  unit: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  target: TargetInventory | null
  inventories: FeedInventoryType[]
  onTransferred?: () => void
}

export default function TransferFeedInventoryModal({
  isOpen,
  onClose,
  target,
  inventories,
  onTransferred,
}: Props) {
  const token = GetToken() ?? ""
  const farmId = getFarm()?.id ?? 0
  const [sourceId, setSourceId] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [saving, setSaving] = useState(false)

  const sources = useMemo(() => {
    if (!target) return []
    return inventories.filter(
      (inv) =>
        inv.id !== target.id &&
        Number(inv.poultry_feed_type_id) === target.feedTypeId &&
        Number(inv.quantity) > 0 &&
        inv.status !== "closed"
    )
  }, [inventories, target])

  const selectedSource = sources.find((s) => String(s.id) === sourceId)
  const deficit = target ? Math.max(0, -target.availableQuantity) : 0
  const sourceQty = selectedSource ? Number(selectedSource.quantity) : 0

  useEffect(() => {
    if (!isOpen || !target) return
    const first = sources[0]
    setSourceId(first ? String(first.id) : "")
    const defaultQty = first
      ? Math.min(deficit > 0 ? deficit : Number(first.quantity), Number(first.quantity))
      : 0
    setQuantity(defaultQty > 0 ? String(defaultQty) : "")
  }, [isOpen, target, sources, deficit])

  useEffect(() => {
    if (!selectedSource) return
    const max = Number(selectedSource.quantity)
    const next = deficit > 0 ? Math.min(deficit, max) : max
    setQuantity(next > 0 ? String(next) : "")
  }, [sourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!token || !farmId || !target || !selectedSource) return
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      toast.error("Enter a valid transfer quantity")
      return
    }
    if (qty > sourceQty + 0.001) {
      toast.error("Quantity exceeds available stock on the source batch")
      return
    }

    setSaving(true)
    const res = await transferFeedInventory(token, farmId, target.id, {
      from_inventory_id: selectedSource.id,
      quantity: qty,
    })
    setSaving(false)

    if (!res.success) {
      const message = Array.isArray(res.error) ? res.error.join(", ") : "Transfer failed"
      toast.error(message)
      return
    }

    toast.success(`Transferred ${qty} ${target.unit} to cover stock`)
    onClose()
    onTransferred?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-600" />
            Transfer stock
          </DialogTitle>
          <DialogDescription>
            Move feed from another {target?.name ?? "same-type"} batch into{" "}
            <strong>{target?.batchNumber || `batch #${target?.id}`}</strong>
            {deficit > 0 ? ` to cover a ${deficit} ${target?.unit} deficit` : ""}.
          </DialogDescription>
        </DialogHeader>

        {!target ? null : sources.length === 0 ? (
          <p className="text-sm text-slate-600">
            No other positive stock batches of this feed type are available to transfer from.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Target balance</span>
                <span className="font-medium tabular-nums">
                  {target.availableQuantity} {target.unit}
                </span>
              </div>
              {deficit > 0 ? (
                <div className="mt-1 flex justify-between gap-2 text-amber-700">
                  <span>Deficit</span>
                  <span className="font-semibold tabular-nums">
                    {deficit} {target.unit}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>From inventory</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source batch" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.batch_number || `Batch #${inv.id}`} — {Number(inv.quantity)} kg (
                      {Naira}
                      {formatCurrency(Number(inv.unit_cost))}/kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity ({target.unit})</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                max={sourceQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {selectedSource ? (
                <p className="text-xs text-slate-500">
                  Available on source: {sourceQty} {target.unit}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {sources.length > 0 && (
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving || !sourceId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Transferring..." : "Transfer"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
