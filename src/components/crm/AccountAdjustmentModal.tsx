import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Scale } from "lucide-react"

import type { RootState } from "@/store"
import { adjustCustomerAccount } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-600" />
            Account Adjustment
          </DialogTitle>
          <DialogDescription>
            {customerName} · Balance {formatCurrency(currentBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "credit" | "debit")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit (increase)</SelectItem>
                <SelectItem value="debit">Debit (decrease)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Saving..." : "Confirm adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
