import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { ArrowUpDown, Scale } from "lucide-react"

import type { RootState } from "@/store"
import { adjustCustomerAccount } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number
  customerName: string
  currentBalance: number
  onSuccess?: () => void
}

export default function AccountAdjustmentModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentBalance,
  onSuccess,
}: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [amount, setAmount] = useState("")
  const [direction, setDirection] = useState<"credit" | "debit">("credit")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setAmount("")
    setDirection("credit")
    setReason("")
  }, [open])

  const handleSubmit = async () => {
    if (!token || !farmId) return
    const value = Number(amount)
    if (!value || value <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!reason.trim()) {
      toast.error("A reason is required for adjustments")
      return
    }
    if (!window.confirm(`Confirm ${direction} adjustment of ${formatCurrency(value)}?`)) {
      return
    }

    setSaving(true)
    const res = await adjustCustomerAccount(token, farmId, customerId, {
      amount: value,
      direction,
      reason: reason.trim(),
    })
    setSaving(false)

    if (!res.success) {
      toast.error(res.error?.join(", ") || "Adjustment failed")
      return
    }

    toast.success("Account adjusted")
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Account Adjustment"
      description={`${customerName} · Balance ${formatCurrency(currentBalance)}`}
      icon={Scale}
      tone="sales"
      size="sm"
      busy={saving}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel="Confirm adjustment"
          busyLabel="Saving..."
          busy={saving}
        />
      }
    >
      <FormSection icon={ArrowUpDown} title="Adjustment" description="Correct the customer's balance with an audited reason.">
        <div className="space-y-4">
          <FormField label="Direction">
            <Select value={direction} onValueChange={(v) => setDirection(v as "credit" | "debit")}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit (increase)</SelectItem>
                <SelectItem value="debit">Debit (decrease)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Amount" required htmlFor="adjust-amount">
            <Input
              id="adjust-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Reason" required htmlFor="adjust-reason">
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={formTextareaClass()}
            />
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}
