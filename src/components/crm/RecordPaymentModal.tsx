import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { CreditCard, Loader2, Wallet } from "lucide-react"

import type { RootState } from "@/store"
import type { CustomerHistoryItem } from "@/lib/types"
import { getCustomerAccount, recordCustomerPayment } from "@/lib/crmRequest"
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
  const [paymentMode, setPaymentMode] = useState("cash")
  const [accountAmount, setAccountAmount] = useState("")
  const [otherAmount, setOtherAmount] = useState("")
  const [otherMethod, setOtherMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [accountBalance, setAccountBalance] = useState(0)

  const balance = item ? resolveBalance(item) : 0
  const paid = item ? resolvePaid(item) : 0
  const total = item ? Number(item.amount) : 0
  const canRecord = item && (item.type === "product" || item.type === "invoice") && balance > 0
  const isProduct = item?.type === "product"

  useEffect(() => {
    if (!open || !item) return
    setAmount(balance > 0 ? String(balance) : "")
    setPaymentMode("cash")
    setAccountAmount("")
    setOtherAmount("")
    setOtherMethod("cash")
    setNotes("")
  }, [open, item, balance])

  useEffect(() => {
    if (!open || !token || !farmId || !isProduct) return
    void getCustomerAccount(token, farmId, customerId).then((res) => {
      if (res.success && res.data) {
        setAccountBalance(Number(res.data.account.balance))
      }
    })
  }, [open, token, farmId, customerId, isProduct])

  const handleSubmit = async () => {
    if (!token || !farmId || !item || !canRecord) return

    const payload: Parameters<typeof recordCustomerPayment>[3] = {
      type: item.type as "product" | "invoice",
      id: item.id,
      notes: notes || undefined,
    }

    if (isProduct && paymentMode === "customer_account") {
      const debit = Number(amount)
      if (!debit || debit <= 0) {
        toast.error("Enter a valid account payment amount")
        return
      }
      if (debit > accountBalance + 0.01) {
        toast.error(`Insufficient account balance (${formatCurrency(accountBalance)})`)
        return
      }
      payload.payment_mode = "customer_account"
      payload.amount = debit
    } else if (isProduct && paymentMode === "account_and_other") {
      const acct = Number(accountAmount)
      const other = Number(otherAmount)
      if (acct <= 0) {
        toast.error("Enter account amount")
        return
      }
      payload.payment_mode = "account_and_other"
      payload.account_amount = acct
      payload.other_amount = other
      payload.other_payment_method = otherMethod as "cash" | "bank_transfer" | "pos" | "other"
      payload.amount = acct + other
    } else {
      const paymentAmount = Number(amount)
      if (!paymentAmount || paymentAmount <= 0) {
        toast.error("Enter a valid payment amount")
        return
      }
      if (paymentAmount > balance + 0.01) {
        toast.error(`Amount cannot exceed balance due (${formatCurrency(balance)})`)
        return
      }
      payload.amount = paymentAmount
      payload.payment_method = paymentMode
    }

    setSaving(true)
    const res = await recordCustomerPayment(token, farmId, customerId, payload)
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
          <DialogDescription>
            {item.description} · Due {formatCurrency(balance)} (paid {formatCurrency(paid)} of{" "}
            {formatCurrency(total)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span>Status</span>
            <PaymentStatusBadge status={String(item.payment_status ?? item.meta?.status ?? "pending")} />
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                {isProduct ? (
                  <>
                    <SelectItem value="customer_account">
                      Customer Account ({formatCurrency(accountBalance)})
                    </SelectItem>
                    <SelectItem value="account_and_other">Account + Other</SelectItem>
                  </>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {paymentMode === "account_and_other" && isProduct ? (
            <>
              <div className="space-y-1.5">
                <Label>Account amount</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={accountAmount}
                  onChange={(e) => setAccountAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Other amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherAmount}
                  onChange={(e) => setOtherAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Other method</Label>
                <Select value={otherMethod} onValueChange={setOtherMethod}>
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
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving || !canRecord}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
