import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerAccount, SalesRecord } from "@/lib/types";
import { getEggStock, type EggStockSummary, type ProductSaleFormPayload } from "@/lib/request";
import { getCustomerAccount } from "@/lib/crmRequest";
import { formatCurrency } from "@/lib/utils";
import {
  EGGS_PER_CRATE,
  cratePriceToUnitPrice,
  cratesToEggs,
  eggsToCrates,
  formatEggsWithCrates,
  unitPricePerCrate,
} from "@/lib/eggMetrics";
import CustomerPicker, { type CustomerSelection } from "@/components/crm/CustomerPicker";

export type { ProductSaleFormPayload };

type PaymentMode = NonNullable<ProductSaleFormPayload["payment_mode"]>;

interface AddProductSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductSaleFormPayload) => Promise<void>;
  editing?: SalesRecord | null;
  defaultFlockId?: number | null;
  lockFlock?: boolean;
}

/** Local calendar date (YYYY-MM-DD) — avoid UTC shift from toISOString(). */
const localDateInputValue = (value?: string | null) => {
  if (value) {
    return value.includes("T") ? value.split("T")[0] : value.slice(0, 10);
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const defaultFormData = (flockId?: number | null) => ({
  type: "egg" as ProductSaleFormPayload["type"],
  flock_id: flockId ? String(flockId) : "",
  quantity: "",
  unit_price: "",
  date: localDateInputValue(),
  customer: {
    customer_id: null,
    customer_name: "",
    customer_phone: "",
  } as CustomerSelection,
  payment_method: "",
  payment_status: "paid" as ProductSaleFormPayload["payment_status"],
  payment_mode: "cash" as PaymentMode,
  account_amount: "",
  other_amount: "",
  other_payment_method: "cash" as NonNullable<ProductSaleFormPayload["other_payment_method"]>,
  notes: "",
});

const AddProductSaleModal = ({
  isOpen,
  onClose,
  onSubmit,
  editing = null,
  defaultFlockId = null,
  lockFlock = false,
}: AddProductSaleModalProps) => {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const [formData, setFormData] = useState(defaultFormData(defaultFlockId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eggStock, setEggStock] = useState<EggStockSummary | null>(null);
  const [eggStockLoading, setEggStockLoading] = useState(false);
  const [account, setAccount] = useState<CustomerAccount | null>(null);

  const isEgg = formData.type === "egg";
  const quantityInput = Number(formData.quantity) || 0;
  const priceInput = Number(formData.unit_price) || 0;

  /** Eggs quantity sent to API (crates → eggs for egg sales). */
  const quantityEggs = useMemo(
    () => (isEgg ? cratesToEggs(quantityInput) : quantityInput),
    [isEgg, quantityInput]
  );

  /** Per-egg unit price sent to API (crate price → per egg for egg sales). */
  const unitPricePerEgg = useMemo(
    () => (isEgg ? cratePriceToUnitPrice(priceInput) : priceInput),
    [isEgg, priceInput]
  );

  const totalAmount = quantityEggs * unitPricePerEgg;
  const accountBalance = Number(account?.balance ?? 0);
  const accountAmount = Number(formData.account_amount) || 0;
  const otherAmount = Number(formData.other_amount) || 0;
  const usesAccount =
    formData.payment_mode === "customer_account" || formData.payment_mode === "account_and_other";
  const requiredFromAccount =
    formData.payment_mode === "customer_account" ? totalAmount : accountAmount;
  const deficit = Math.max(0, requiredFromAccount - accountBalance);
  const balanceAfter =
    formData.payment_mode === "customer_account"
      ? accountBalance - totalAmount
      : formData.payment_mode === "account_and_other"
        ? accountBalance - accountAmount
        : null;
  const accountBlocked =
    formData.payment_mode === "customer_account" && totalAmount > 0 && deficit > 0;
  const requiresFlock = formData.type === "egg" || formData.type === "meat";

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      const type = (editing.type as ProductSaleFormPayload["type"]) || "egg";
      const qty =
        type === "egg"
          ? String(eggsToCrates(Number(editing.quantity ?? 0)))
          : String(editing.quantity ?? "");
      const price =
        type === "egg"
          ? String(unitPricePerCrate(Number(editing.unit_price ?? 0)))
          : String(editing.unit_price ?? "");

      setFormData({
        ...defaultFormData(defaultFlockId),
        type,
        flock_id: editing.flock_id ? String(editing.flock_id) : "",
        quantity: qty,
        unit_price: price,
        date: localDateInputValue(editing.date),
        customer: {
          customer_id: editing.customer_id ?? null,
          customer_name: editing.customer_name || editing.customer?.name || "",
          customer_phone: editing.customer_phone || "",
        },
        payment_method: editing.payment_method || "",
        payment_status: (editing.payment_status as ProductSaleFormPayload["payment_status"]) || "paid",
        payment_mode: "cash",
        notes: editing.notes || "",
      });
    } else {
      setFormData(defaultFormData(defaultFlockId));
    }

    setErrors({});
    setIsSubmitting(false);
    setEggStock(null);
    setAccount(null);
  }, [isOpen, editing, defaultFlockId]);

  useEffect(() => {
    const customerId = formData.customer.customer_id;
    if (!isOpen || !token || !farmId || !customerId || !usesAccount) {
      if (!usesAccount) setAccount(null);
      return;
    }
    let cancelled = false;
    void getCustomerAccount(token, farmId, customerId).then((res) => {
      if (cancelled) return;
      setAccount(res.success && res.data ? res.data.account : null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, token, farmId, formData.customer.customer_id, usesAccount]);

  useEffect(() => {
    if (!isOpen || formData.type !== "egg" || !token || !farmId || !formData.flock_id || !formData.date) {
      setEggStock(null);
      return;
    }

    let cancelled = false;
    setEggStockLoading(true);
    void getEggStock(token, farmId, {
      flock_id: Number(formData.flock_id),
      date: formData.date,
      exclude_record_id: editing?.id,
    }).then((res) => {
      if (cancelled) return;
      setEggStock(res.success && res.data ? res.data : null);
      setEggStockLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.type, formData.flock_id, formData.date, token, farmId, editing?.id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.type) next.type = "Product type is required";
    if (requiresFlock && !formData.flock_id) next.flock_id = "Flock is required for egg and meat sales";
    if (!formData.quantity || quantityInput <= 0) {
      next.quantity = isEgg ? "Crates must be greater than 0" : "Quantity must be greater than 0";
    }
    if (formData.unit_price === "" || priceInput < 0) {
      next.unit_price = isEgg ? "Price per crate is required" : "Unit price is required";
    }
    if (!formData.date) next.date = "Sale date is required";
    if (isEgg && eggStock && quantityEggs > eggStock.available) {
      next.quantity = `Only ${formatEggsWithCrates(eggStock.available)} available as of ${eggStock.as_of}`;
    }
    if (usesAccount && !formData.customer.customer_id) {
      next.customer = "Select a linked customer to pay from account";
    }
    if (formData.payment_mode === "customer_account" && deficit > 0) {
      next.payment_mode = `Insufficient balance. Available ${formatCurrency(accountBalance)}, required ${formatCurrency(totalAmount)}.`;
    }
    if (formData.payment_mode === "account_and_other") {
      if (accountAmount <= 0) next.account_amount = "Account amount is required";
      if (accountAmount > accountBalance) next.account_amount = "Exceeds available balance";
      if (otherAmount > 0 && !formData.other_payment_method) {
        next.other_payment_method = "Select method for remaining amount";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || accountBlocked) return;
    setIsSubmitting(true);
    try {
      const payload: ProductSaleFormPayload = {
        type: formData.type,
        flock_id: formData.flock_id ? Number(formData.flock_id) : null,
        quantity: quantityEggs,
        unit_price: unitPricePerEgg,
        date: formData.date,
        customer_id: formData.customer.customer_id,
        customer_name: formData.customer.customer_name || null,
        customer_phone: formData.customer.customer_phone || null,
        payment_mode: formData.payment_mode,
        notes: formData.notes || null,
      };

      if (formData.payment_mode === "pending") {
        payload.payment_status = "pending";
      } else if (formData.payment_mode === "customer_account") {
        payload.payment_method = "customer_account";
        payload.payment_status = "paid";
      } else if (formData.payment_mode === "account_and_other") {
        payload.account_amount = accountAmount;
        payload.other_amount = otherAmount;
        payload.other_payment_method = formData.other_payment_method;
      } else {
        payload.payment_method = formData.payment_mode;
        payload.payment_status = "paid";
      }

      await onSubmit(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (
            target?.closest(
              '[data-slot="popover-content"], [data-slot="sheet-content"], [data-slot="sheet-overlay"], [data-slot="select-content"], [data-radix-popper-content-wrapper]'
            )
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (
            target?.closest(
              '[data-slot="popover-content"], [data-slot="sheet-content"], [data-slot="sheet-overlay"], [data-slot="select-content"], [data-radix-popper-content-wrapper]'
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product sale" : "Record product sale"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Product type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as ProductSaleFormPayload["type"],
                  quantity: "",
                  unit_price: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egg">Eggs</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="manure">Manure</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-rose-600">{errors.type}</p>}
          </div>

          {requiresFlock && (
            <div className="space-y-1.5">
              <Label htmlFor="flock_id">Flock ID {lockFlock ? "(fixed)" : ""}</Label>
              <Input
                id="flock_id"
                type="number"
                min={1}
                value={formData.flock_id}
                disabled={lockFlock}
                onChange={(e) => setFormData((prev) => ({ ...prev, flock_id: e.target.value }))}
              />
              {errors.flock_id && <p className="text-xs text-rose-600">{errors.flock_id}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="date">Sale date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            />
            {errors.date && <p className="text-xs text-rose-600">{errors.date}</p>}
            {isEgg && (
              <p className="text-xs text-slate-500">
                Available stock is calculated from eggs collected on or before this date.
              </p>
            )}
          </div>

          {isEgg && formData.flock_id ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {eggStockLoading ? (
                <span>Checking available egg stock…</span>
              ) : eggStock ? (
                <>
                  <span className="font-semibold">{formatEggsWithCrates(eggStock.available)}</span>{" "}
                  available as of {eggStock.as_of}
                  <span className="mt-0.5 block text-xs text-emerald-800/80">
                    Sold {formatEggsWithCrates(eggStock.sold)} · Broken {formatEggsWithCrates(eggStock.broken)} ·
                    Collected {formatEggsWithCrates(eggStock.produced)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-emerald-800/60">
                    1 crate = {EGGS_PER_CRATE} eggs
                  </span>
                </>
              ) : (
                <span className="text-amber-800">Could not load egg stock for this flock/date.</span>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{isEgg ? "Quantity (crates)" : "Quantity"}</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step={isEgg ? "1" : "0.01"}
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder={isEgg ? "e.g. 10" : undefined}
              />
              {isEgg && quantityInput > 0 ? (
                <p className="text-xs text-slate-500">
                  = {formatEggsWithCrates(quantityEggs)} sent to stock
                </p>
              ) : null}
              {errors.quantity && <p className="text-xs text-rose-600">{errors.quantity}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_price">{isEgg ? "Price per crate" : "Unit price"}</Label>
              <Input
                id="unit_price"
                type="number"
                min={0}
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit_price: e.target.value }))}
                placeholder={isEgg ? "Price for 30 eggs" : undefined}
              />
              {isEgg && priceInput > 0 ? (
                <p className="text-xs text-slate-500">
                  ≈ {unitPricePerEgg.toLocaleString(undefined, { minimumFractionDigits: 2 })} per egg
                </p>
              ) : null}
              {errors.unit_price && <p className="text-xs text-rose-600">{errors.unit_price}</p>}
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Total:{" "}
            <span className="font-semibold">
              {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            {isEgg && quantityInput > 0 ? (
              <span className="mt-0.5 block text-xs text-slate-500">
                {quantityInput.toLocaleString()} crate{quantityInput === 1 ? "" : "s"} ×{" "}
                {priceInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            ) : null}
          </div>

          <CustomerPicker
            value={formData.customer}
            onChange={(customer) => setFormData((prev) => ({ ...prev, customer }))}
          />
          {errors.customer ? <p className="text-xs text-rose-600">{errors.customer}</p> : null}

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={formData.payment_mode}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_mode: value as PaymentMode,
                  account_amount:
                    value === "account_and_other" && totalAmount > 0
                      ? String(Math.min(accountBalance, totalAmount))
                      : prev.account_amount,
                  other_amount:
                    value === "account_and_other" && totalAmount > 0
                      ? String(Math.max(0, totalAmount - Math.min(accountBalance, totalAmount)))
                      : prev.other_amount,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="customer_account">Customer Account</SelectItem>
                <SelectItem value="account_and_other">Account + Other Payment</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_mode ? <p className="text-xs text-rose-600">{errors.payment_mode}</p> : null}
          </div>

          {usesAccount ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span>Customer Account Balance</span>
                <span className="font-semibold">{formatCurrency(accountBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sale Total</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              {balanceAfter != null ? (
                <div className="flex justify-between">
                  <span>Balance After Payment</span>
                  <span className="font-semibold">{formatCurrency(Math.max(0, balanceAfter))}</span>
                </div>
              ) : null}
              {deficit > 0 && formData.payment_mode === "customer_account" ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900">
                  <p className="font-semibold">Insufficient Balance</p>
                  <p>Available: {formatCurrency(accountBalance)}</p>
                  <p>Required: {formatCurrency(totalAmount)}</p>
                  <p>Deficit: {formatCurrency(deficit)}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {formData.payment_mode === "account_and_other" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Account amount</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.account_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, account_amount: e.target.value }))}
                />
                {errors.account_amount ? <p className="text-xs text-rose-600">{errors.account_amount}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Other amount</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.other_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, other_amount: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Other payment method</Label>
                <Select
                  value={formData.other_payment_method}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      other_payment_method: value as NonNullable<ProductSaleFormPayload["other_payment_method"]>,
                    }))
                  }
                >
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
                {errors.other_payment_method ? (
                  <p className="text-xs text-rose-600">{errors.other_payment_method}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || accountBlocked}
          >
            {isSubmitting ? "Saving..." : editing ? "Update sale" : "Record sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductSaleModal;
