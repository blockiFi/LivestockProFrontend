"use client"

import { useEffect, useMemo, useState } from "react"
import { FormField, FormModal, FormSection, ModalFooterActions, formInputClass } from "@/components/ui/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeftRight, Boxes, Scale } from "lucide-react"
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Transfer stock"
      description={
        <>
          Move feed from another {target?.name ?? "same-type"} batch into{" "}
          <strong>{target?.batchNumber || `batch #${target?.id}`}</strong>
          {deficit > 0 ? ` to cover a ${deficit} ${target?.unit} deficit` : ""}.
        </>
      }
      icon={ArrowLeftRight}
      tone="feed"
      size="md"
      busy={saving}
      footer={
        sources.length > 0 ? (
          <ModalFooterActions
            onCancel={onClose}
            submitType="button"
            onConfirm={() => void handleSubmit()}
            submitLabel="Transfer"
            busyLabel="Transferring..."
            busy={saving}
            disabled={!sourceId}
            icon={ArrowLeftRight}
          />
        ) : (
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Cancel
          </Button>
        )
      }
    >
      {!target ? null : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600">
          No other positive stock batches of this feed type are available to transfer from.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Target balance</p>
              <p className="font-semibold tabular-nums text-slate-900">
                {target.availableQuantity} {target.unit}
              </p>
            </div>
            {deficit > 0 ? (
              <div>
                <p className="text-xs text-amber-600">Deficit</p>
                <p className="font-semibold tabular-nums text-amber-700">
                  {deficit} {target.unit}
                </p>
              </div>
            ) : null}
          </div>

          <FormSection step={1} icon={Boxes} title="Source batch" description="Pick the batch to take stock from.">
            <FormField label="From inventory">
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className={formInputClass()}>
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
            </FormField>
          </FormSection>

          <FormSection step={2} icon={Scale} title="Amount" description="How much to move into the target batch.">
            <FormField
              label={`Quantity (${target.unit})`}
              htmlFor="transfer-feed-qty"
              hint={selectedSource ? `Available on source: ${sourceQty} ${target.unit}` : undefined}
            >
              <Input
                id="transfer-feed-qty"
                type="number"
                min={0.01}
                step={0.01}
                max={sourceQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={formInputClass()}
              />
            </FormField>
          </FormSection>
        </>
      )}
    </FormModal>
  )
}
