import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { CreditCard, Loader2, Wallet } from "lucide-react"

import type { RootState } from "@/store"
import type { CustomerHistoryItem } from "@/lib/types"
import { recordCustomerPayment } from "@/lib/crmRequest"
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
import { PaymentStatusBadge } from "@/components/crm/CustomerPaymentAnalysis"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number
  item: CustomerHistoryItem | null
  onSuccess?: () => void
}

function resolveBalance(item: CustomerHistoryItem): number {
  if (item.balance_due != null) return Number(item.balance_due)
  const paid = Number(item.amount_paid ?? item.meta?.amount_paid ?? 0)
  return Math.max(0, Number(item.amount) - paid)
}

function resolvePaid(item: CustomerHistoryItem): number {
  if (item.amount_paid != null) return Number(item.amount_paid)
  return Number(item.meta?.amount_paid ?? 0)
}

export default function RecordPaymentModal({
  open,
  onOpenChange,
  customerId,
  item,
  onSuccess,
}: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const balance = item ? resolveBalance(item) : 0
  const paid = item ? resolvePaid(item) : 0
  const total = item ? Number(item.amount) : 0
  const canRecord = item && (item.type === "product" || item.type === "invoice") && balance > 0

  useEffect(() => {
    if (!open || !item) return
    setAmount(balance > 0 ? String(balance) : "")
    setPaymentMethod(String(item.meta?.payment_method ?? ""))
    setNotes("")
  }, [open, item, balance])

  const handleSubmit = async () => {
    if (!token || !farmId || !item || !canRecord) return
    const paymentAmount = Number(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Enter a valid payment amount")
      return
    }
    if (paymentAmount > balance + 0.01) {
      toast.error(`Amount cannot exceed balance due (${formatCurrency(balance)})`)
      return
    }

    setSaving(true)
    const res = await recordCustomerPayment(token, farmId, customerId, {
      type: item.type as "product" | "invoice",
      id: item.id,
      amount: paymentAmount,
      payment_method: paymentMethod || undefined,
      notes: notes || undefined,
    })
    setSaving(false)

    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to record payment")
      return
    }

    toast.success(
      res.data.payment.balance_due <= 0
        ? "Payment recorded — fully paid"
        : `Payment recorded — ${formatCurrency(res.data.payment.balance_due)} remaining`
    )
    onOpenChange(false)
    onSuccess?.()
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-600" />
            Record payment
          </DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <PaymentStatusBadge status={item.payment_status} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
              <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Paid</p>
              <p className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Balance</p>
              <p className="font-semibold text-amber-700 tabular-nums">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {!canRecord ? (
          <p className="text-sm text-slate-500">This transaction is already fully paid.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment amount</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0.01}
                step={0.01}
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAmount(String(balance))}
                >
                  Pay full balance
                </Button>
                {balance > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAmount(String(Math.round((balance / 2) * 100) / 100))}
                  >
                    Pay half
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={paymentMethod || "none"} onValueChange={(v) => setPaymentMethod(v === "none" ? "" : v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="pos">POS / Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Note (optional)</Label>
              <Textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. First installment"
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          {canRecord && (
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {saving ? "Recording..." : "Record payment"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
