import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Wallet } from "lucide-react"

import type { RootState } from "@/store"
import { topUpCustomerAccount } from "@/lib/crmRequest"
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

export default function TopUpAccountModal({
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
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ previous: number; topUp: number; next: number } | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount("")
    setPaymentMethod("cash")
    setReference("")
    setNotes("")
    setResult(null)
  }, [open])

  const handleSubmit = async () => {
    if (!token || !farmId) return
    const value = Number(amount)
    if (!value || value <= 0) {
      toast.error("Enter a valid top-up amount")
      return
    }

    setSaving(true)
    const res = await topUpCustomerAccount(token, farmId, customerId, {
      amount: value,
      payment_method: paymentMethod,
      reference: reference || undefined,
      notes: notes || undefined,
    })
    setSaving(false)

    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Top-up failed")
      return
    }

    setResult({
      previous: Number(res.data.previous_balance),
      topUp: Number(res.data.top_up),
      next: Number(res.data.new_balance),
    })
    toast.success("Account topped up")
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Top Up Account
          </DialogTitle>
          <DialogDescription>
            {customerName} · Current balance {formatCurrency(currentBalance)}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Previous Balance</span>
              <span className="font-medium">{formatCurrency(result.previous)}</span>
            </div>
            <div className="flex justify-between">
              <span>Top Up</span>
              <span className="font-medium text-emerald-700">+{formatCurrency(result.topUp)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-2 text-base font-semibold">
              <span>New Balance</span>
              <span>{formatCurrency(result.next)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference / receipt</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : "Confirm top up"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
