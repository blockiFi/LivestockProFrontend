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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, PackageX } from "lucide-react"
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
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <PackageX className="h-4 w-4 text-amber-700" />
            </div>
            Close Inventory
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {inventory
              ? `Close "${inventory.name}" (batch ${inventory.batchNumber || "—"}) and record the remaining stock as damaged.`
              : "Close this inventory batch."}
          </DialogDescription>
        </DialogHeader>

        {inventory && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">
                {inventory.availableQuantity.toFixed(2)} {inventory.unit} will be recorded as damaged
              </p>
              <p className="text-amber-700 mt-1">
                Estimated value: ₦{damagedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocate-flock">
                Allocate cost to flock batch{hasCost ? " *" : " (optional)"}
              </Label>
              <Select
                value={flockId || undefined}
                onValueChange={setFlockId}
                disabled={loadingFlocks || isSubmitting}
              >
                <SelectTrigger id="allocate-flock">
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
              {hasCost && (
                <p className="text-xs text-gray-500">
                  The damaged stock value will be recorded as feed expenditure on the selected flock.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="close-notes">Reason / notes (optional)</Label>
              <Textarea
                id="close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mould damage, expired stock, spillage..."
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleClose}
            disabled={isSubmitting || !inventory}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? "Closing..." : "Close & Record Damaged"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
