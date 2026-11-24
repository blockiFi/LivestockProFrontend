import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  Calculator,
  CalendarDays,
  Layers,
  Package,
  Plus,
  ShoppingCart,
  StickyNote,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerAccount, FlockRecord } from "@/lib/types";
import { getFlocks, type ProductSaleFormPayload } from "@/lib/request";
import { getCustomerAccount } from "@/lib/crmRequest";
import {
  getEggStockByFlock,
  getSaleOrder,
  type FlockEggStock,
  type SaleOrderPayload,
} from "@/lib/salesOrderRequest";
import { formatCurrency } from "@/lib/utils";
import { formatSaleCrates } from "@/lib/eggMetrics";
import CustomerPicker, { type CustomerSelection } from "@/components/crm/CustomerPicker";

type SaleType = ProductSaleFormPayload["type"];
type PaymentMode = NonNullable<ProductSaleFormPayload["payment_mode"]>;
type OtherMethod = NonNullable<ProductSaleFormPayload["other_payment_method"]>;

/** Select value for a manure line with no batch. */
const FARM_LEVEL = "farm";

type LineState = {
  key: number;
  flock_id: string;
  quantity: string;
  /** Used only when "Same price for every batch" is off. */
  unit_price: string;
};

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SaleOrderPayload) => Promise<void>;
  /** When set, the modal loads this multi-batch sale and edits it as a whole. */
  editingOrderId?: number | null;
}

const flockLabel = (flock: Pick<FlockRecord, "id" | "name" | "batch_number" | "status">) => {
  const name = flock.name?.trim() || `Flock #${flock.id}`;
  const batch = flock.batch_number?.trim();
  const base = batch ? `${name} · ${batch}` : name;
  return flock.status && flock.status !== "active" ? `${base} (${flock.status})` : base;
};

/** Local calendar date (YYYY-MM-DD) without the UTC shift from toISOString(). */
const localDateInputValue = (value?: string | null) => {
  if (value) return value.includes("T") ? value.split("T")[0] : value.slice(0, 10);
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** Crates are stored to 2 decimals; round down so "all" never exceeds stock. */
const floorCrates = (crates: number) => Math.floor(crates * 100 + 1e-6) / 100;

const DIRECT_METHODS = ["cash", "bank_transfer", "pos", "other"] as const;

let lineKey = 0;
const newLine = (flockId = "", quantity = ""): LineState => ({
  key: ++lineKey,
  flock_id: flockId,
  quantity,
  unit_price: "",
});

const defaultForm = () => ({
  type: "egg" as SaleType,
  date: localDateInputValue(),
  customer: { customer_id: null, customer_name: "", customer_phone: "" } as CustomerSelection,
  payment_mode: "cash" as PaymentMode,
  payment_method: "cash",
  amount_paid: "",
  account_amount: "",
  other_amount: "",
  other_payment_method: "cash" as OtherMethod,
  notes: "",
  samePrice: true,
  sharedPrice: "",
});

const RecordSaleModal = ({ isOpen, onClose, onSubmit, editingOrderId = null }: RecordSaleModalProps) => {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  const [form, setForm] = useState(defaultForm);
  const [lines, setLines] = useState<LineState[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [flocks, setFlocks] = useState<FlockRecord[]>([]);
  const [flocksLoading, setFlocksLoading] = useState(false);
  const [stock, setStock] = useState<FlockEggStock[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [splitCrates, setSplitCrates] = useState("");
  const idempotencyKey = useRef<string>("");

  const isEgg = form.type === "egg";
  const requiresFlock = form.type === "egg" || form.type === "meat";
  const isEditing = editingOrderId != null;

  // ---- data loading -------------------------------------------------------

  useEffect(() => {
    if (!isOpen || !token || !farmId) return;
    let cancelled = false;
    setFlocksLoading(true);
    void getFlocks(token, farmId, false).then((res) => {
      if (cancelled) return;
      setFlocks(res.success && res.data ? res.data : []);
      setFlocksLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, token, farmId]);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setIsSubmitting(false);
    setSplitCrates("");
    setAccount(null);
    idempotencyKey.current = `sale-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!isEditing || !token || !farmId) {
      setForm(defaultForm());
      setLines([newLine()]);
      return;
    }

    let cancelled = false;
    setLoadingOrder(true);
    void getSaleOrder(token, farmId, editingOrderId as number).then((res) => {
      if (cancelled) return;
      setLoadingOrder(false);
      if (!res.success || !res.data) {
        setErrors({ form: (res.error || ["Could not load this sale"]).join(", ") });
        return;
      }
      const order = res.data;
      const prices = order.lines.map((l) => Number(l.unit_price));
      const samePrice = prices.every((p) => p === prices[0]);
      const method = order.payment_method || "";
      const accountPaid = Number(order.account_debited || 0);
      const direct = DIRECT_METHODS.includes(method as (typeof DIRECT_METHODS)[number]) ? method : "cash";

      let payment_mode: PaymentMode = "cash";
      let other_payment_method: OtherMethod = "cash";
      if (order.payment_status === "pending") payment_mode = "pending";
      else if (method === "customer_account") payment_mode = "customer_account";
      else if (method.startsWith("customer_account+")) {
        payment_mode = "account_and_other";
        const other = method.slice("customer_account+".length);
        if (DIRECT_METHODS.includes(other as OtherMethod)) other_payment_method = other as OtherMethod;
      } else if (order.payment_status === "partial") payment_mode = "partial";
      else if (DIRECT_METHODS.includes(method as (typeof DIRECT_METHODS)[number])) payment_mode = method as PaymentMode;

      setForm({
        ...defaultForm(),
        type: (order.type as SaleType) || "egg",
        date: localDateInputValue(order.date),
        customer: {
          customer_id: order.customer_id,
          customer_name: order.customer_name || order.customer?.name || "",
          customer_phone: order.customer_phone || "",
        },
        payment_mode,
        payment_method: direct,
        amount_paid: payment_mode === "partial" ? String(order.amount_paid) : "",
        account_amount: payment_mode === "account_and_other" && accountPaid > 0 ? String(accountPaid) : "",
        other_amount:
          payment_mode === "account_and_other"
            ? String(Math.max(0, Number(order.amount_paid) - accountPaid) || "")
            : "",
        other_payment_method,
        notes: order.notes || "",
        samePrice,
        sharedPrice: samePrice && prices.length ? String(prices[0]) : "",
      });
      setLines(
        order.lines.map((l) => ({
          key: ++lineKey,
          flock_id: l.flock_id ? String(l.flock_id) : FARM_LEVEL,
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isEditing, editingOrderId, token, farmId]);

  useEffect(() => {
    if (!isOpen || !isEgg || !token || !farmId || !form.date) {
      setStock([]);
      return;
    }
    let cancelled = false;
    setStockLoading(true);
    void getEggStockByFlock(token, farmId, {
      date: form.date,
      exclude_order_id: editingOrderId ?? undefined,
    }).then((res) => {
      if (cancelled) return;
      setStock(res.success && res.data ? res.data : []);
      setStockLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isEgg, form.date, token, farmId, editingOrderId]);

  const usesAccount = form.payment_mode === "customer_account" || form.payment_mode === "account_and_other";

  useEffect(() => {
    const customerId = form.customer.customer_id;
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
  }, [isOpen, token, farmId, form.customer.customer_id, usesAccount]);

  // ---- derived values -----------------------------------------------------

  const sortedFlocks = useMemo(
    () =>
      [...flocks].sort((a, b) => {
        const aActive = a.status === "active" ? 0 : 1;
        const bActive = b.status === "active" ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return (a.name || "").localeCompare(b.name || "");
      }),
    [flocks]
  );

  const stockByFlock = useMemo(() => {
    const map = new Map<string, FlockEggStock>();
    stock.forEach((row) => map.set(String(row.flock_id), row));
    return map;
  }, [stock]);

  /** Batches with eggs to sell, oldest batch first. */
  const batchesWithStock = useMemo(
    () => stock.filter((row) => floorCrates(row.available_crates) > 0).sort((a, b) => a.flock_id - b.flock_id),
    [stock]
  );

  const linePrice = (line: LineState) => Number(form.samePrice ? form.sharedPrice : line.unit_price) || 0;
  const lineTotal = (line: LineState) => Math.round((Number(line.quantity) || 0) * linePrice(line) * 100) / 100;
  const totalAmount = Math.round(lines.reduce((sum, l) => sum + lineTotal(l), 0) * 100) / 100;
  const totalQuantity = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  /** Crates already put on other lines for the same batch. */
  const cratesOnOtherLines = (line: LineState) =>
    lines
      .filter((l) => l.key !== line.key && l.flock_id === line.flock_id)
      .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  const accountBalance = Number(account?.balance ?? 0);
  const accountAmount = Number(form.account_amount) || 0;
  const otherAmount = Number(form.other_amount) || 0;
  const amountPaidInput = Number(form.amount_paid) || 0;
  const balanceDue = form.payment_mode === "partial" && totalAmount > 0 ? Math.max(0, totalAmount - amountPaidInput) : 0;
  const requiredFromAccount = form.payment_mode === "customer_account" ? totalAmount : accountAmount;
  const deficit = Math.max(0, requiredFromAccount - accountBalance);
  const balanceAfter =
    form.payment_mode === "customer_account"
      ? accountBalance - totalAmount
      : form.payment_mode === "account_and_other"
        ? accountBalance - accountAmount
        : null;
  const accountBlocked = form.payment_mode === "customer_account" && totalAmount > 0 && deficit > 0;

  // ---- line actions -------------------------------------------------------

  const updateLine = (key: number, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = (key: number) =>
    setLines((prev) => (prev.length === 1 ? [newLine()] : prev.filter((l) => l.key !== key)));

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const fillAllForLine = (line: LineState) => {
    const row = stockByFlock.get(line.flock_id);
    if (!row) return;
    const remaining = Math.max(0, floorCrates(row.available_crates - cratesOnOtherLines(line)));
    updateLine(line.key, { quantity: String(remaining) });
  };

  /** One line per batch that has eggs, each filled to everything in stock. */
  const sellAllStock = () => {
    if (batchesWithStock.length === 0) return;
    setLines(
      batchesWithStock.map((row) => {
        const existing = lines.find((l) => l.flock_id === String(row.flock_id));
        return {
          ...newLine(String(row.flock_id), String(floorCrates(row.available_crates))),
          unit_price: existing?.unit_price ?? "",
        };
      })
    );
    setErrors((prev) => ({ ...prev, lines: "" }));
  };

  /**
   * Spread a total number of crates across batches, oldest batch first.
   * Uses the batches already picked on the lines, or every batch with stock if none are picked.
   */
  const spreadCrates = () => {
    let remaining = floorCrates(Number(splitCrates) || 0);
    if (remaining <= 0) return;
    const picked = Array.from(new Set(lines.map((l) => l.flock_id).filter((id) => id && stockByFlock.has(id))));
    const pool = (picked.length ? picked.map((id) => stockByFlock.get(id)!) : batchesWithStock)
      .filter((row) => floorCrates(row.available_crates) > 0)
      .sort((a, b) => a.flock_id - b.flock_id);

    const capacity = pool.reduce((sum, row) => sum + floorCrates(row.available_crates), 0);
    if (remaining > capacity + 1e-6) {
      setErrors((prev) => ({
        ...prev,
        split: `Only ${formatSaleCrates(capacity)} in stock across ${picked.length ? "the picked batches" : "all batches"}.`,
      }));
      return;
    }

    const next: LineState[] = [];
    for (const row of pool) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, floorCrates(row.available_crates));
      const existing = lines.find((l) => l.flock_id === String(row.flock_id));
      next.push({ ...newLine(String(row.flock_id), String(floorCrates(take))), unit_price: existing?.unit_price ?? "" });
      remaining = floorCrates(remaining - take);
    }
    setLines(next);
    setErrors((prev) => ({ ...prev, split: "", lines: "" }));
  };

  // ---- submit -------------------------------------------------------------

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.date) next.date = "Sale date is required";

    lines.forEach((line, i) => {
      if (requiresFlock && (!line.flock_id || line.flock_id === FARM_LEVEL)) next[`line_${i}_flock`] = "Pick a batch";
      if (!line.quantity || Number(line.quantity) <= 0) next[`line_${i}_qty`] = "Enter a quantity";
      if (!form.samePrice && (line.unit_price === "" || Number(line.unit_price) < 0)) next[`line_${i}_price`] = "Enter a price";
    });
    if (form.samePrice && (form.sharedPrice === "" || Number(form.sharedPrice) < 0)) {
      next.sharedPrice = isEgg ? "Price per crate is required" : "Unit price is required";
    }

    if (isEgg && stock.length) {
      const byFlock = new Map<string, number>();
      lines.forEach((l) => byFlock.set(l.flock_id, (byFlock.get(l.flock_id) || 0) + (Number(l.quantity) || 0)));
      const short: string[] = [];
      byFlock.forEach((crates, flockId) => {
        const row = stockByFlock.get(flockId);
        if (row && crates > row.available_crates + 1e-6) {
          short.push(`${row.name} has ${formatSaleCrates(floorCrates(row.available_crates))}`);
        }
      });
      if (short.length) next.lines = `Not enough eggs: ${short.join(", ")}.`;
    }

    if (usesAccount && !form.customer.customer_id) next.customer = "Select a linked customer to pay from account";
    if (form.payment_mode === "customer_account" && deficit > 0) {
      next.payment_mode = `Insufficient balance. Available ${formatCurrency(accountBalance)}, required ${formatCurrency(totalAmount)}.`;
    }
    if (form.payment_mode === "account_and_other") {
      if (accountAmount <= 0) next.account_amount = "Account amount is required";
      if (accountAmount > accountBalance) next.account_amount = "Exceeds available balance";
    }
    if (form.payment_mode === "partial") {
      if (!form.amount_paid || amountPaidInput <= 0) next.amount_paid = "Enter the amount paid";
      else if (amountPaidInput >= totalAmount && totalAmount > 0) {
        next.amount_paid = "Partial payment must be less than the total. Use a full payment method instead.";
      }
    }
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSubmit = async () => {
    if (!validate() || accountBlocked) return;
    setIsSubmitting(true);
    try {
      const payload: SaleOrderPayload = {
        type: form.type,
        date: form.date,
        lines: lines.map((l) => ({
          flock_id: l.flock_id && l.flock_id !== FARM_LEVEL ? Number(l.flock_id) : null,
          quantity: Number(l.quantity),
          unit_price: linePrice(l),
        })),
        customer_id: form.customer.customer_id,
        customer_name: form.customer.customer_name || null,
        customer_phone: form.customer.customer_phone || null,
        payment_mode: form.payment_mode,
        notes: form.notes || null,
        idempotency_key: idempotencyKey.current,
      };
      if (form.payment_mode === "partial") {
        payload.amount_paid = amountPaidInput;
        payload.payment_method = form.payment_method || "cash";
      } else if (form.payment_mode === "account_and_other") {
        payload.account_amount = accountAmount;
        payload.other_amount = otherAmount;
        payload.other_payment_method = form.other_payment_method;
      }
      await onSubmit(payload);
      onClose();
    } catch {
      // The page shows the API error; keep the form open so it can be fixed.
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitWord = isEgg ? "crates" : "qty";

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={isEditing ? "Edit sale" : "Record sale"}
      description="Sell eggs, meat or manure from one batch, several batches, or everything in stock."
      icon={ShoppingCart}
      tone="sales"
      size="xl"
      busy={isSubmitting}
      dismissible={false}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel={isEditing ? "Update sale" : "Record sale"}
          busyLabel="Saving..."
          busy={isSubmitting}
          disabled={accountBlocked || loadingOrder}
        />
      }
    >
      {errors.form ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</div>
      ) : null}

      <FormSection step={1} icon={Package} title="Product" description="What was sold and when.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Product type" required>
            <Select
              value={form.type}
              onValueChange={(value) => {
                setForm((prev) => ({ ...prev, type: value as SaleType }));
                setLines([newLine()]);
              }}
            >
              <SelectTrigger className={formInputClass()}>
                <SelectValue />
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
            htmlFor="sale-date"
            error={errors.date}
            hint={isEgg ? "Stock counts eggs collected on or before this date." : undefined}
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="sale-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className={formInputClass(!!errors.date, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        step={2}
        icon={Layers}
        title="Batches"
        description={
          isEgg
            ? "Sell from one batch or several. Use Sell all stock to empty every batch at once."
            : "Add a line for each batch the sale came from."
        }
      >
        <div className="space-y-3">
          {isEgg ? (
            <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-sm text-emerald-900">
                {stockLoading ? (
                  "Checking egg stock…"
                ) : batchesWithStock.length ? (
                  <>
                    <span className="font-semibold">
                      {formatSaleCrates(floorCrates(batchesWithStock.reduce((s, r) => s + r.available_crates, 0)))}
                    </span>{" "}
                    in stock across {batchesWithStock.length} batch{batchesWithStock.length === 1 ? "" : "es"}
                  </>
                ) : (
                  "No eggs in stock as of this date."
                )}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex items-end gap-1.5">
                  <div className="w-32">
                    <label htmlFor="split-crates" className="mb-1 block text-[11px] font-medium text-emerald-900">
                      I sold (crates)
                    </label>
                    <Input
                      id="split-crates"
                      type="number"
                      min={0}
                      step="1"
                      value={splitCrates}
                      onChange={(e) => setSplitCrates(e.target.value)}
                      placeholder="e.g. 40"
                      className={formInputClass(!!errors.split, "h-9 bg-white")}
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-9 bg-white" onClick={spreadCrates}>
                    Spread
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  disabled={batchesWithStock.length === 0}
                  onClick={sellAllStock}
                >
                  Sell all stock
                </Button>
              </div>
            </div>
          ) : null}
          {errors.split ? <p className="text-[11px] text-rose-600">{errors.split}</p> : null}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Switch
                id="same-price"
                checked={form.samePrice}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, samePrice: checked }))
                }
              />
              <label htmlFor="same-price">Same price for every batch</label>
            </div>
            {form.samePrice ? (
              <div className="w-40">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label={isEgg ? "Price per crate" : "Unit price"}
                  value={form.sharedPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, sharedPrice: e.target.value }))}
                  placeholder={isEgg ? "Price per crate" : "Unit price"}
                  className={formInputClass(!!errors.sharedPrice, "h-9 bg-white")}
                />
              </div>
            ) : null}
          </div>
          {errors.sharedPrice ? <p className="text-[11px] text-rose-600">{errors.sharedPrice}</p> : null}

          <div className="space-y-2">
            {lines.map((line, i) => {
              const row = stockByFlock.get(line.flock_id);
              const lineAvailable = row ? Math.max(0, floorCrates(row.available_crates - cratesOnOtherLines(line))) : null;
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-12 items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <Select
                      value={line.flock_id || undefined}
                      onValueChange={(value) => updateLine(line.key, { flock_id: value })}
                      disabled={flocksLoading}
                    >
                      <SelectTrigger
                        aria-label={`Batch for line ${i + 1}`}
                        className={formInputClass(!!errors[`line_${i}_flock`], "h-9")}
                      >
                        <SelectValue placeholder={flocksLoading ? "Loading batches…" : "Select a batch"} />
                      </SelectTrigger>
                      <SelectContent>
                        {form.type === "manure" ? <SelectItem value={FARM_LEVEL}>Farm-level (no batch)</SelectItem> : null}
                        {sortedFlocks.map((flock) => {
                          const s = stockByFlock.get(String(flock.id));
                          return (
                            <SelectItem key={flock.id} value={String(flock.id)}>
                              {flockLabel(flock)}
                              {isEgg && s ? ` · ${formatSaleCrates(floorCrates(s.available_crates))}` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors[`line_${i}_flock`] ? (
                      <p className="mt-1 text-[11px] text-rose-600">{errors[`line_${i}_flock`]}</p>
                    ) : isEgg && lineAvailable != null ? (
                      <p className="mt-1 text-[11px] text-emerald-700">{formatSaleCrates(lineAvailable)} available</p>
                    ) : null}
                  </div>

                  <div className={form.samePrice ? "col-span-6 sm:col-span-3" : "col-span-4 sm:col-span-2"}>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={0}
                        step={isEgg ? "1" : "0.01"}
                        aria-label={`Quantity for line ${i + 1}`}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        placeholder={unitWord}
                        className={formInputClass(!!errors[`line_${i}_qty`], "h-9")}
                      />
                      {isEgg && lineAvailable != null && lineAvailable > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-2 text-xs"
                          title="Sell everything this batch has"
                          onClick={() => fillAllForLine(line)}
                        >
                          All
                        </Button>
                      ) : null}
                    </div>
                    {errors[`line_${i}_qty`] ? (
                      <p className="mt-1 text-[11px] text-rose-600">{errors[`line_${i}_qty`]}</p>
                    ) : null}
                  </div>

                  {!form.samePrice ? (
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        aria-label={`Price for line ${i + 1}`}
                        value={line.unit_price}
                        onChange={(e) => updateLine(line.key, { unit_price: e.target.value })}
                        placeholder={isEgg ? "₦/crate" : "price"}
                        className={formInputClass(!!errors[`line_${i}_price`], "h-9")}
                      />
                    </div>
                  ) : null}

                  <div
                    className={`${form.samePrice ? "col-span-5 sm:col-span-3" : "col-span-3 sm:col-span-2"} flex h-9 items-center justify-end text-sm font-medium text-slate-800`}
                  >
                    {formatCurrency(lineTotal(line))}
                  </div>

                  <div className="col-span-1 flex h-9 items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-600"
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.lines ? <p className="text-[11px] text-rose-600">{errors.lines}</p> : null}

          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-4 w-4" />
            Add batch
          </Button>
        </div>
      </FormSection>

      <FormSection step={3} icon={Calculator} title="Total" description="Sum of every batch line.">
        <div className="space-y-1">
          <FormSummary label="Total" value={formatCurrency(totalAmount)} />
          <p className="px-1 text-[11px] text-slate-500">
            {lines.length} batch line{lines.length === 1 ? "" : "s"} ·{" "}
            {isEgg ? formatSaleCrates(totalQuantity) : `${totalQuantity.toLocaleString()} units`}
          </p>
        </div>
      </FormSection>

      <FormSection step={4} icon={UserRound} title="Customer" description="Link a saved customer or enter a walk-in buyer.">
        <CustomerPicker value={form.customer} onChange={(customer) => setForm((prev) => ({ ...prev, customer }))} />
        {errors.customer ? <p className="mt-1.5 text-[11px] text-rose-600">{errors.customer}</p> : null}
      </FormSection>

      <FormSection step={5} icon={Wallet} title="Payment" description="Paid once for the whole sale and split across the batches.">
        <div className="space-y-4">
          <FormField label="Payment method" error={errors.payment_mode}>
            <Select
              value={form.payment_mode}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  payment_mode: value as PaymentMode,
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

          {form.payment_mode === "partial" ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Amount paid" required htmlFor="order-amount-paid" error={errors.amount_paid}>
                  <Input
                    id="order-amount-paid"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.amount_paid}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount_paid: e.target.value }))}
                    placeholder="0.00"
                    className={formInputClass(!!errors.amount_paid, "bg-white")}
                  />
                </FormField>
                <FormField label="Paid via" required>
                  <Select
                    value={form.payment_method || "cash"}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger className={formInputClass(false, "bg-white")}>
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
              {deficit > 0 && form.payment_mode === "customer_account" ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-900">
                  <p className="font-semibold">Insufficient Balance</p>
                  <p>Available: {formatCurrency(accountBalance)}</p>
                  <p>Required: {formatCurrency(totalAmount)}</p>
                  <p>Deficit: {formatCurrency(deficit)}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {form.payment_mode === "account_and_other" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Account amount" error={errors.account_amount}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.account_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_amount: e.target.value }))}
                  className={formInputClass(!!errors.account_amount)}
                />
              </FormField>
              <FormField label="Other amount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.other_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, other_amount: e.target.value }))}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Other payment method" className="sm:col-span-2">
                <Select
                  value={form.other_payment_method}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, other_payment_method: value as OtherMethod }))}
                >
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
          ) : null}
        </div>
      </FormSection>

      <FormSection step={6} icon={StickyNote} title="Notes" description="Anything else worth remembering about this sale.">
        <FormField label="Notes" htmlFor="order-notes">
          <Textarea
            id="order-notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  );
};

export default RecordSaleModal;
