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
import { DollarSign } from "lucide-react"
import { updateFeedInventory } from "@/lib/request"
import { GetToken, getFarm } from "@/lib/request"
import { FEED_BAG_KG } from "@/lib/feed-bags"
import { Naira, formatCurrency } from "@/lib/utils"
import { toast } from "react-toastify"

interface UpdateFeedInventoryCostModalProps {
  isOpen: boolean
  onClose: () => void
  inventory: {
    id: number
    name: string
    batchNumber: string
    unit: string
    costPerUnit: number
  } | null
  onUpdated?: () => void
}

export default function UpdateFeedInventoryCostModal({
  isOpen,
  onClose,
  inventory,
  onUpdated,
}: UpdateFeedInventoryCostModalProps) {
  const [unitCost, setUnitCost] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && inventory) {
      setUnitCost(String(inventory.costPerUnit ?? ""))
    }
  }, [isOpen, inventory])

  const parsedCost = Number(unitCost)
  const isValid = Number.isFinite(parsedCost) && parsedCost >= 0
  const bagCost = useMemo(
    () => (isValid ? parsedCost * FEED_BAG_KG : 0),
    [isValid, parsedCost]
  )

  const handleSubmit = async () => {
    if (!inventory || !isValid) {
      toast.error("Enter a valid unit cost")
      return
    }

    const token = GetToken()
    const farmId = getFarm()?.id
    if (!token || !farmId) {
      toast.error("Missing authentication")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await updateFeedInventory(token, farmId, inventory.id, {
        unit_cost: parsedCost,
      })

      if (!response.success) {
        const message = Array.isArray(response.error)
          ? response.error.join(", ")
          : response.error || "Failed to update inventory cost"
        toast.error(message)
        return
      }

      toast.success("Inventory cost updated")
      onUpdated?.()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Update inventory cost
          </DialogTitle>
          <DialogDescription>
            {inventory
              ? `Set the unit cost for ${inventory.name}${inventory.batchNumber ? ` (batch ${inventory.batchNumber})` : ""}.`
              : "Set the unit cost for this inventory batch."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="unit-cost">
              Unit cost ({Naira}/{inventory?.unit || "kg"})
            </Label>
            <Input
              id="unit-cost"
              type="number"
              min={0}
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={isSubmitting}
            />
            {isValid && (
              <p className="text-xs text-muted-foreground">
                ≈ {Naira}
                {formatCurrency(bagCost)} / {FEED_BAG_KG}kg bag
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !isValid}>
            {isSubmitting ? "Saving..." : "Save cost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
