import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import {
  Bird,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Receipt,
  StickyNote,
  Wallet,
} from "lucide-react"

import type { RootState } from "@/store"
import type { CustomerHistoryItem, Farm, FarmSettings, Invoice } from "@/lib/types"
import { getInvoice, mapApiInvoiceToUi } from "@/lib/crmRequest"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { InvoicePreview } from "@/components/general/invoice-preview"

type Props = {
  item: CustomerHistoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  farm?: Farm | null
  farmSettings?: FarmSettings | null
  onRecordPayment?: (item: CustomerHistoryItem) => void
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

function canRecordPayment(item: CustomerHistoryItem): boolean {
  return (item.type === "product" || item.type === "invoice") && resolveBalance(item) > 0
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      {Icon ? (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function paymentStatusClass(status?: string) {
  const s = (status ?? "").toLowerCase()
  if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (s === "partial") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function invoiceStatusClass(status?: string) {
  const s = (status ?? "").toLowerCase()
  if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (s === "overdue") return "bg-red-50 text-red-700 border-red-200"
  return "bg-amber-50 text-amber-700 border-amber-200"
}

function saleTypeLabel(type: CustomerHistoryItem["type"]) {
  if (type === "product") return "Product sale"
  if (type === "flock") return "Flock sale"
  return "Invoice"
}

function saleTypeIcon(type: CustomerHistoryItem["type"]) {
  if (type === "product") return Package
  if (type === "flock") return Bird
  return Receipt
}

export default function CustomerSaleDetailSheet({
  item,
  open,
  onOpenChange,
  farm = null,
  farmSettings = null,
  onRecordPayment,
}: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  useEffect(() => {
    if (!open) {
      setInvoicePreview(null)
      setShowInvoicePreview(false)
    }
  }, [open])

  const loadInvoicePreview = async () => {
    if (!item || item.type !== "invoice" || !token || !farmId) return
    setLoadingInvoice(true)
    const res = await getInvoice(token, farmId, item.id)
    setLoadingInvoice(false)
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to load invoice")
      return
    }
    setInvoicePreview(mapApiInvoiceToUi(res.data, farmSettings))
    setShowInvoicePreview(true)
  }

  if (!item) return null

  const meta = item.meta ?? {}
  const TypeIcon = saleTypeIcon(item.type)
  const balanceDue = resolveBalance(item)
  const amountPaid = resolvePaid(item)
  const showPaymentAction = canRecordPayment(item)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  item.type === "product" && "bg-emerald-100 text-emerald-700",
                  item.type === "flock" && "bg-blue-100 text-blue-700",
                  item.type === "invoice" && "bg-violet-100 text-violet-700"
                )}
              >
                <TypeIcon className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg">{saleTypeLabel(item.type)}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.date ? formatDate(item.date) : "No date"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total amount</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(item.amount)}
            </p>
            {(item.type === "product" || item.type === "invoice") && (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="text-sm font-semibold text-emerald-700 tabular-nums">
                    {formatCurrency(amountPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Balance due</p>
                  <p className="text-sm font-semibold text-amber-700 tabular-nums">
                    {formatCurrency(balanceDue)}
                  </p>
                </div>
              </div>
            )}
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </div>

          {showPaymentAction && onRecordPayment && (
            <div className="mt-4">
              <Button
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onRecordPayment(item)}
              >
                <Wallet className="h-4 w-4" />
                Record payment / Top up
              </Button>
            </div>
          )}

          <div className="mt-4 divide-y divide-slate-100">
            <DetailRow icon={Calendar} label="Date" value={item.date ? formatDate(item.date) : "—"} />
            <DetailRow icon={Hash} label="Reference ID" value={`#${item.id}`} />

            {item.type === "product" && (
              <>
                <DetailRow
                  icon={Package}
                  label="Product type"
                  value={
                    <Badge variant="outline" className="capitalize font-normal">
                      {String(meta.sale_type ?? "product")}
                    </Badge>
                  }
                />
                {meta.quantity != null && (
                  <DetailRow icon={Hash} label="Quantity" value={Number(meta.quantity).toLocaleString()} />
                )}
                {meta.unit_price != null && (
                  <DetailRow
                    icon={CreditCard}
                    label="Unit price"
                    value={formatCurrency(Number(meta.unit_price))}
                  />
                )}
                {meta.flock_name ? (
                  <DetailRow icon={Bird} label="Flock" value={String(meta.flock_name)} />
                ) : null}
                {meta.batch_number ? (
                  <DetailRow icon={FileText} label="Batch" value={String(meta.batch_number)} />
                ) : null}
                {meta.payment_method ? (
                  <DetailRow icon={CreditCard} label="Payment method" value={String(meta.payment_method)} />
                ) : null}
                {meta.payment_status ? (
                  <DetailRow
                    icon={CreditCard}
                    label="Payment status"
                    value={
                      <Badge variant="outline" className={paymentStatusClass(String(meta.payment_status))}>
                        {String(meta.payment_status)}
                      </Badge>
                    }
                  />
                ) : null}
              </>
            )}

            {item.type === "flock" && (
              <>
                {meta.quantity != null && (
                  <DetailRow icon={Bird} label="Birds sold" value={Number(meta.quantity).toLocaleString()} />
                )}
                {meta.unit_price != null && (
                  <DetailRow
                    icon={CreditCard}
                    label="Price per bird"
                    value={formatCurrency(Number(meta.unit_price))}
                  />
                )}
                {meta.flock_name ? (
                  <DetailRow icon={Bird} label="Flock" value={String(meta.flock_name)} />
                ) : null}
                {meta.batch_number ? (
                  <DetailRow icon={FileText} label="Batch" value={String(meta.batch_number)} />
                ) : null}
                {meta.customer_phone ? (
                  <DetailRow icon={MapPin} label="Contact phone" value={String(meta.customer_phone)} />
                ) : null}
              </>
            )}

            {item.type === "invoice" && (
              <>
                {meta.invoice_number ? (
                  <DetailRow icon={Receipt} label="Invoice number" value={String(meta.invoice_number)} />
                ) : null}
                {meta.status ? (
                  <DetailRow
                    icon={CreditCard}
                    label="Status"
                    value={
                      <Badge variant="outline" className={invoiceStatusClass(String(meta.status))}>
                        {String(meta.status)}
                      </Badge>
                    }
                  />
                ) : null}
                {meta.due_date ? (
                  <DetailRow icon={Calendar} label="Due date" value={formatDate(String(meta.due_date))} />
                ) : null}
                {meta.subtotal != null && (
                  <DetailRow icon={CreditCard} label="Subtotal" value={formatCurrency(Number(meta.subtotal))} />
                )}
                {meta.tax_amount != null && Number(meta.tax_amount) > 0 && (
                  <DetailRow icon={CreditCard} label="Tax" value={formatCurrency(Number(meta.tax_amount))} />
                )}
              </>
            )}

            {meta.notes ? (
              <DetailRow
                icon={StickyNote}
                label="Notes"
                value={<p className="font-normal text-slate-600 whitespace-pre-wrap">{String(meta.notes)}</p>}
              />
            ) : null}
          </div>

          {item.type === "invoice" && (
            <div className="mt-6">
              <Button
                className="w-full gap-2"
                onClick={() => void loadInvoicePreview()}
                disabled={loadingInvoice}
              >
                {loadingInvoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                View full invoice
              </Button>
            </div>
          )}

          {item.type !== "invoice" && !meta.notes && (
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" />
              No additional notes for this sale.
            </p>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice preview</DialogTitle>
          </DialogHeader>
          {invoicePreview && (
            <InvoicePreview invoice={invoicePreview} farm={farm} farmSettings={farmSettings} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
