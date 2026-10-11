import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Banknote, CheckCircle2, Hash, Wallet } from "lucide-react"

import type { RootState } from "@/store"
import { topUpCustomerAccount } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Top Up Account"
      description={`${customerName} · Current balance ${formatCurrency(currentBalance)}`}
      icon={Wallet}
      tone="sales"
      size="sm"
      busy={saving}
      footer={
        result ? (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
        ) : (
          <ModalFooterActions
            onCancel={() => onOpenChange(false)}
            submitType="button"
            onConfirm={() => void handleSubmit()}
            submitLabel="Confirm top up"
            busyLabel="Saving..."
            busy={saving}
          />
        )
      }
    >
      {result ? (
        <FormSection icon={CheckCircle2} title="Top-up complete" description="The customer's account has been credited.">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between px-1">
              <span className="text-slate-600">Previous Balance</span>
              <span className="font-medium">{formatCurrency(result.previous)}</span>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-slate-600">Top Up</span>
              <span className="font-medium text-emerald-700">+{formatCurrency(result.topUp)}</span>
            </div>
            <FormSummary className="text-base" label="New Balance" value={formatCurrency(result.next)} />
          </div>
        </FormSection>
      ) : (
        <FormSection icon={Banknote} title="Deposit" description="Amount received and how it was paid.">
          <div className="space-y-4">
            <FormField label="Amount" required htmlFor="topup-amount">
              <Input
                id="topup-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Payment method">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className={formInputClass()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Reference / receipt" htmlFor="topup-reference">
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="topup-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={formInputClass(false, "pl-9")}
                />
              </div>
            </FormField>
            <FormField label="Note" htmlFor="topup-notes">
              <Textarea
                id="topup-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={formTextareaClass()}
              />
            </FormField>
          </div>
        </FormSection>
      )}
    </FormModal>
  )
}
