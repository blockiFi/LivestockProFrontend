"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Bird, PackageX, StickyNote } from "lucide-react"
import { closeFeedInventory, getFlocks } from "@/lib/request"
import { GetToken, getFarm } from "@/lib/request"
import type { FlockRecord } from "@/lib/types"

interface CloseFeedInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  inventory: {
    id: number
    name: string
    batchNumber: string
    availableQuantity: number
    unit: string
    costPerUnit: number
  } | null
  onClosed?: () => void
}

export default function CloseFeedInventoryModal({
  isOpen,
  onClose,
  inventory,
  onClosed,
}: CloseFeedInventoryModalProps) {
  const [notes, setNotes] = useState("")
  const [flockId, setFlockId] = useState<string>("")
  const [flocks, setFlocks] = useState<FlockRecord[]>([])
  const [loadingFlocks, setLoadingFlocks] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNotes("")
      setFlockId("")
      setError(null)
    }
  }, [isOpen, inventory?.id])

  useEffect(() => {
    if (!isOpen) return

    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm?.id) return

    let cancelled = false
    setLoadingFlocks(true)

    getFlocks(token, farm.id, false)
      .then((response) => {
        if (cancelled) return
        if (response.success && Array.isArray(response.data)) {
          setFlocks(response.data)
        } else {
          setFlocks([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFlocks(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const damagedValue = inventory ? inventory.availableQuantity * inventory.costPerUnit : 0
  const hasCost = damagedValue > 0

  const flockOptions = useMemo(
    () =>
      [...flocks].sort((a, b) => {
        const aActive = a.status === "active" ? 0 : 1
        const bActive = b.status === "active" ? 0 : 1
        if (aActive !== bActive) return aActive - bActive
        return a.name.localeCompare(b.name)
      }),
    [flocks]
  )

  const handleClose = async () => {
    if (!inventory) return

    if (hasCost && !flockId) {
      setError("Select a flock batch to allocate the damaged stock cost.")
      return
    }

    const token = GetToken()
    const farm = getFarm()
    if (!token || !farm?.id) {
      setError("Missing authentication or farm context")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await closeFeedInventory(token, farm.id, inventory.id, {
        notes: notes.trim() || undefined,
        flock_id: flockId && flockId !== "none" ? Number(flockId) : undefined,
      })
      if (response.success) {
        onClosed?.()
        onClose()
      } else {
        const message = Array.isArray(response.error)
          ? response.error.join(", ")
          : (typeof response.error === "string" ? response.error : "Failed to close inventory")
        setError(message)
      }
    } catch {
      setError("Failed to close inventory")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Close inventory"
      description={
        inventory
          ? `Close "${inventory.name}" (batch ${inventory.batchNumber || "—"}) and record the remaining stock as damaged.`
          : "Close this inventory batch."
      }
      icon={PackageX}
      tone="danger"
      size="md"
      busy={isSubmitting}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={handleClose}
          submitLabel="Close & record damaged"
          busyLabel="Closing..."
          busy={isSubmitting}
          disabled={!inventory}
          icon={PackageX}
        />
      }
    >
      {inventory && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <p className="font-medium text-rose-900">
                {inventory.availableQuantity.toFixed(2)} {inventory.unit} will be recorded as damaged
              </p>
              <p className="mt-1 text-rose-700">
                Estimated value: ₦{damagedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <FormSection icon={Bird} title="Cost allocation" description="Charge the damaged stock to a flock batch.">
            <FormField
              label={`Allocate cost to flock batch${hasCost ? "" : " (optional)"}`}
              htmlFor="allocate-flock"
              required={hasCost}
              hint={hasCost ? "The damaged stock value will be recorded as feed expenditure on the selected flock." : undefined}
            >
              <Select
                value={flockId || undefined}
                onValueChange={setFlockId}
                disabled={loadingFlocks || isSubmitting}
              >
                <SelectTrigger id="allocate-flock" className={formInputClass(!!error && hasCost && !flockId)}>
                  <SelectValue placeholder={loadingFlocks ? "Loading flocks..." : "Select flock batch"} />
                </SelectTrigger>
                <SelectContent>
                  {!hasCost && (
                    <SelectItem value="none">Do not allocate</SelectItem>
                  )}
                  {flockOptions.map((flock) => (
                    <SelectItem key={flock.id} value={String(flock.id)}>
                      {flock.name} ({flock.batch_number})
                      {flock.status !== "active" ? " — ended" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          <FormSection icon={StickyNote} title="Reason" description="Why is this batch being closed?">
            <FormField label="Reason / notes (optional)" htmlFor="close-notes">
              <Textarea
                id="close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mould damage, expired stock, spillage..."
                rows={3}
                className={formTextareaClass()}
              />
            </FormField>
          </FormSection>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </>
      )}
    </FormModal>
  )
}
