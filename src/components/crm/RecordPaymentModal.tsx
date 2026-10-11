import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Banknote, CreditCard, Receipt, Wallet } from "lucide-react"

import type { RootState } from "@/store"
import type { CustomerHistoryItem } from "@/lib/types"
import { getCustomerAccount, recordCustomerPayment } from "@/lib/crmRequest"
import { formatCurrency } from "@/lib/utils"
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      description={`${item.description} · Due ${formatCurrency(balance)} (paid ${formatCurrency(paid)} of ${formatCurrency(total)})`}
      icon={Wallet}
      tone="sales"
      size="sm"
      busy={saving}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel="Record payment"
          busy={saving}
          disabled={!canRecord}
          icon={CreditCard}
        />
      }
    >
      <FormSection
        icon={Receipt}
        title="Balance"
        description="Outstanding amount on this record."
        action={<PaymentStatusBadge status={String(item.payment_status ?? item.meta?.status ?? "pending")} />}
      >
        <FormSummary label="Balance due" value={formatCurrency(balance)} />
      </FormSection>

      <FormSection icon={Banknote} title="Payment" description="How much was received and how.">
        <div className="space-y-4">
          <FormField label="Payment method">
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className={formInputClass()}>
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
          </FormField>

          {paymentMode === "account_and_other" && isProduct ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Account amount" required htmlFor="payment-account-amount">
                <Input
                  id="payment-account-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={accountAmount}
                  onChange={(e) => setAccountAmount(e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Other amount" htmlFor="payment-other-amount">
                <Input
                  id="payment-other-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherAmount}
                  onChange={(e) => setOtherAmount(e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Other method" className="sm:col-span-2">
                <Select value={otherMethod} onValueChange={setOtherMethod}>
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
            </div>
          ) : (
            <FormField label="Amount" required htmlFor="payment-amount">
              <Input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={formInputClass()}
              />
            </FormField>
          )}

          <FormField label="Notes" htmlFor="payment-notes">
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={formTextareaClass()}
            />
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  )
}
