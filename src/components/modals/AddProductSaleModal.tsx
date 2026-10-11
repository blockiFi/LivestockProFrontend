import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Calculator, CalendarDays, Package, ShoppingCart, StickyNote, UserRound, Wallet } from "lucide-react";
import {
  FormField,
  FormModal,
  FormSection,
  FormSummary,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerAccount, FlockRecord, SalesRecord } from "@/lib/types";
import { getEggStock, getFlocks, type EggStockSummary, type ProductSaleFormPayload } from "@/lib/request";
import { getCustomerAccount } from "@/lib/crmRequest";
import { formatCurrency } from "@/lib/utils";
import {
  EGGS_PER_CRATE,
  cratesToEggs,
  formatEggsWithCrates,
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

const flockLabel = (flock: Pick<FlockRecord, "id" | "name" | "batch_number" | "status">) => {
  const name = flock.name?.trim() || `Flock #${flock.id}`;
  const batch = flock.batch_number?.trim();
  const base = batch ? `${name} · ${batch}` : name;
  return flock.status && flock.status !== "active" ? `${base} (${flock.status})` : base;
};

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
  payment_method: "cash",
  payment_status: "paid" as ProductSaleFormPayload["payment_status"],
  payment_mode: "cash" as PaymentMode,
  amount_paid: "",
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
  const [flocks, setFlocks] = useState<FlockRecord[]>([]);
  const [flocksLoading, setFlocksLoading] = useState(false);
  const [flocksError, setFlocksError] = useState<string | null>(null);

  const isEgg = formData.type === "egg";
  const quantityInput = Number(formData.quantity) || 0;
  const priceInput = Number(formData.unit_price) || 0;

  /** Eggs equivalent for stock checks (API stores crates for egg sales). */
  const quantityEggs = useMemo(
    () => (isEgg ? cratesToEggs(quantityInput) : quantityInput),
    [isEgg, quantityInput]
  );

  /** Total = crates × price/crate for eggs; quantity × unit price otherwise. */
  const totalAmount = quantityInput * priceInput;
  const accountBalance = Number(account?.balance ?? 0);
  const accountAmount = Number(formData.account_amount) || 0;
  const otherAmount = Number(formData.other_amount) || 0;
  const amountPaidInput = Number(formData.amount_paid) || 0;
  const balanceDue =
    formData.payment_mode === "partial" && totalAmount > 0
      ? Math.max(0, totalAmount - amountPaidInput)
      : 0;
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

  const sortedFlocks = useMemo(() => {
    return [...flocks].sort((a, b) => {
      const aActive = a.status === "active" ? 0 : 1;
      const bActive = b.status === "active" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [flocks]);

  const selectedFlockLabel = useMemo(() => {
    if (!formData.flock_id) return null;
    const found = flocks.find((f) => String(f.id) === formData.flock_id);
    if (found) return flockLabel(found);
    if (editing?.flock) {
      return flockLabel({
        id: editing.flock.id,
        name: editing.flock.name,
        batch_number: editing.flock.batch_number || "",
        status: "active",
      });
    }
    return `Flock #${formData.flock_id}`;
  }, [formData.flock_id, flocks, editing?.flock]);

  useEffect(() => {
    if (!isOpen || !token || !farmId) return;

    let cancelled = false;
    setFlocksLoading(true);
    setFlocksError(null);
    void getFlocks(token, farmId, false).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setFlocks(res.data);
      } else {
        setFlocks([]);
        setFlocksError(res.error?.[0] || "Could not load flocks");
      }
      setFlocksLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, token, farmId]);

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      const type = (editing.type as ProductSaleFormPayload["type"]) || "egg";

      setFormData({
        ...defaultFormData(defaultFlockId),
        type,
        flock_id: editing.flock_id ? String(editing.flock_id) : "",
        quantity: String(editing.quantity ?? ""),
        unit_price: String(editing.unit_price ?? ""),
        date: localDateInputValue(editing.date),
        customer: {
          customer_id: editing.customer_id ?? null,
          customer_name: editing.customer_name || editing.customer?.name || "",
          customer_phone: editing.customer_phone || "",
        },
        payment_method: editing.payment_method || "cash",
        payment_status: (editing.payment_status as ProductSaleFormPayload["payment_status"]) || "paid",
        payment_mode:
          editing.payment_status === "partial"
            ? "partial"
            : editing.payment_status === "pending"
              ? "pending"
              : ((editing.payment_method as PaymentMode) || "cash"),
        amount_paid:
          editing.payment_status === "partial"
            ? String(editing.amount_paid ?? "")
            : "",
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
    if (formData.payment_mode === "partial") {
      if (!formData.amount_paid || amountPaidInput <= 0) {
        next.amount_paid = "Enter the amount paid";
      } else if (amountPaidInput >= totalAmount && totalAmount > 0) {
        next.amount_paid = "Partial payment must be less than the total — use a full payment method instead";
      }
      if (!formData.payment_method) {
        next.payment_method = "Select how the partial amount was paid";
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
        quantity: quantityInput,
        unit_price: priceInput,
        date: formData.date,
        customer_id: formData.customer.customer_id,
        customer_name: formData.customer.customer_name || null,
        customer_phone: formData.customer.customer_phone || null,
        payment_mode: formData.payment_mode,
        notes: formData.notes || null,
      };

      if (formData.payment_mode === "pending") {
        payload.payment_status = "pending";
      } else if (formData.payment_mode === "partial") {
        payload.payment_status = "partial";
        payload.amount_paid = amountPaidInput;
        payload.payment_method = formData.payment_method || "cash";
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={editing ? "Edit product sale" : "Record product sale"}
      description="Log an egg, meat or manure sale with the customer and payment details."
      icon={ShoppingCart}
      tone="sales"
      size="lg"
      busy={isSubmitting}
      dismissible={false}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel={editing ? "Update sale" : "Record sale"}
          busyLabel="Saving..."
          busy={isSubmitting}
          disabled={accountBlocked}
        />
      }
    >
      <FormSection step={1} icon={Package} title="Product" description="What was sold, from which flock and when.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Product type" required error={errors.type}>
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
              <SelectTrigger className={formInputClass(!!errors.type)}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="egg">Eggs</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="manure">Manure</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Sale date"
            required
            htmlFor="date"
            error={errors.date}
            hint={isEgg ? "Available stock is calculated from eggs collected on or before this date." : undefined}
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className={formInputClass(!!errors.date, "pl-9")}
              />
            </div>
          </FormField>

          {requiresFlock && (
            <FormField
              label={`Flock ${lockFlock ? "(fixed)" : ""}`}
              required
              htmlFor="flock_id"
              error={errors.flock_id}
              className="sm:col-span-2"
            >
              {lockFlock ? (
                <Input
                  id="flock_id"
                  value={selectedFlockLabel || (formData.flock_id ? `Flock #${formData.flock_id}` : "")}
                  disabled
                  readOnly
                  className={formInputClass(!!errors.flock_id)}
                />
              ) : (
                <Select
                  value={formData.flock_id || undefined}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, flock_id: value }))}
                  disabled={flocksLoading}
                >
                  <SelectTrigger id="flock_id" className={formInputClass(!!errors.flock_id)}>
                    <SelectValue
                      placeholder={
                        flocksLoading
                          ? "Loading flocks…"
                          : flocksError
                            ? "Could not load flocks"
                            : "Select a flock"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedFlocks.length === 0 && !flocksLoading ? (
                      <SelectItem value="__none" disabled>
                        No flocks found
                      </SelectItem>
                    ) : (
                      sortedFlocks.map((flock) => (
                        <SelectItem key={flock.id} value={String(flock.id)}>
                          {flockLabel(flock)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {flocksError && !lockFlock && (
                <p className="text-[11px] text-amber-700">{flocksError}</p>
              )}
            </FormField>
          )}
        </div>

        {isEgg && formData.flock_id ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
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
      </FormSection>

      <FormSection step={2} icon={Calculator} title="Quantity & price" description="How much was sold and at what price.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={isEgg ? "Quantity (crates)" : "Quantity"}
            required
            htmlFor="quantity"
            error={errors.quantity}
            hint={isEgg && quantityInput > 0 ? `= ${formatEggsWithCrates(quantityEggs)}` : undefined}
          >
            <Input
              id="quantity"
              type="number"
              min={0}
              step={isEgg ? "1" : "0.01"}
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              placeholder={isEgg ? "e.g. 10" : undefined}
              className={formInputClass(!!errors.quantity)}
            />
          </FormField>
          <FormField
            label={isEgg ? "Price per crate" : "Unit price"}
            required
            htmlFor="unit_price"
            error={errors.unit_price}
          >
            <Input
              id="unit_price"
              type="number"
              min={0}
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit_price: e.target.value }))}
              placeholder={isEgg ? "Price for 30 eggs" : undefined}
              className={formInputClass(!!errors.unit_price)}
            />
          </FormField>

          <div className="space-y-1 sm:col-span-2">
            <FormSummary
              label="Total"
              value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            />
            {isEgg && quantityInput > 0 ? (
              <p className="px-1 text-[11px] text-slate-500">
                {quantityInput.toLocaleString()} crate{quantityInput === 1 ? "" : "s"} ×{" "}
                {priceInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection step={3} icon={UserRound} title="Customer" description="Link a saved customer or enter a walk-in buyer.">
        <CustomerPicker
          value={formData.customer}
          onChange={(customer) => setFormData((prev) => ({ ...prev, customer }))}
        />
        {errors.customer ? <p className="mt-1.5 text-[11px] text-rose-600">{errors.customer}</p> : null}
      </FormSection>

      <FormSection step={4} icon={Wallet} title="Payment" description="How the customer paid for this sale.">
        <div className="space-y-4">
          <FormField label="Payment method" error={errors.payment_mode}>
            <Select
              value={formData.payment_mode}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_mode: value as PaymentMode,
                  payment_method:
                    value === "partial"
                      ? prev.payment_method || "cash"
                      : prev.payment_method,
                  amount_paid: value === "partial" ? prev.amount_paid : "",
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
              <SelectTrigger className={formInputClass(!!errors.payment_mode)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="partial">Partial payment</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="customer_account">Customer Account</SelectItem>
                <SelectItem value="account_and_other">Account + Other Payment</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {formData.payment_mode === "partial" ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Amount paid" required htmlFor="amount_paid" error={errors.amount_paid}>
                  <Input
                    id="amount_paid"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount_paid: e.target.value }))}
                    placeholder="0.00"
                    className={formInputClass(!!errors.amount_paid, "bg-white")}
                  />
                </FormField>
                <FormField label="Paid via" required error={errors.payment_method}>
                  <Select
                    value={formData.payment_method || "cash"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, payment_method: value }))
                    }
                  >
                    <SelectTrigger className={formInputClass(!!errors.payment_method, "bg-white")}>
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
              <FormSummary label="Balance due" value={formatCurrency(balanceDue)} className="bg-white" />
            </div>
          ) : null}

          {usesAccount ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
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
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-900">
                  <p className="font-semibold">Insufficient Balance</p>
                  <p>Available: {formatCurrency(accountBalance)}</p>
                  <p>Required: {formatCurrency(totalAmount)}</p>
                  <p>Deficit: {formatCurrency(deficit)}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {formData.payment_mode === "account_and_other" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Account amount" error={errors.account_amount}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.account_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, account_amount: e.target.value }))}
                  className={formInputClass(!!errors.account_amount)}
                />
              </FormField>
              <FormField label="Other amount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.other_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, other_amount: e.target.value }))}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Other payment method" error={errors.other_payment_method} className="sm:col-span-2">
                <Select
                  value={formData.other_payment_method}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      other_payment_method: value as NonNullable<ProductSaleFormPayload["other_payment_method"]>,
                    }))
                  }
                >
                  <SelectTrigger className={formInputClass(!!errors.other_payment_method)}>
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
          ) : null}
        </div>
      </FormSection>

      <FormSection step={5} icon={StickyNote} title="Notes" description="Anything else worth remembering about this sale.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  );
};

export default AddProductSaleModal;
