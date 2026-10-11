"use client"

import { useEffect, useMemo, useState } from "react"
import { FormField, FormModal, FormSection, FormSummary, ModalFooterActions, formInputClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Banknote, DollarSign } from "lucide-react"
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Update inventory cost"
      description={
        inventory
          ? `Set the unit cost for ${inventory.name}${inventory.batchNumber ? ` (batch ${inventory.batchNumber})` : ""}.`
          : "Set the unit cost for this inventory batch."
      }
      icon={DollarSign}
      tone="feed"
      size="sm"
      busy={isSubmitting}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={handleSubmit}
          submitLabel="Save cost"
          busyLabel="Saving..."
          busy={isSubmitting}
          disabled={!isValid}
        />
      }
    >
      <FormSection icon={Banknote} title="Unit cost" description="Applied to the remaining stock in this batch.">
        <FormField label={`Unit cost (${Naira}/${inventory?.unit || "kg"})`} htmlFor="unit-cost">
          <Input
            id="unit-cost"
            type="number"
            min={0}
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            disabled={isSubmitting}
            className={formInputClass()}
          />
        </FormField>
        {isValid && (
          <FormSummary
            className="mt-3"
            label={`Per ${FEED_BAG_KG}kg bag`}
            value={`≈ ${Naira}${formatCurrency(bagCost)}`}
          />
        )}
      </FormSection>
    </FormModal>
  )
}
