import { useEffect, useState } from "react";
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
import type { SalesRecord } from "@/lib/types";
import { getEggStock, type EggStockSummary, type ProductSaleFormPayload } from "@/lib/request";
import { EGGS_PER_CRATE, formatEggsWithCrates } from "@/lib/eggMetrics";
import CustomerPicker, { type CustomerSelection } from "@/components/crm/CustomerPicker";

export type { ProductSaleFormPayload };

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

  const quantityNum = Number(formData.quantity) || 0;
  const unitPriceNum = Number(formData.unit_price) || 0;
  const totalAmount = quantityNum * unitPriceNum;
  const requiresFlock = formData.type === "egg" || formData.type === "meat";

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      setFormData({
        type: (editing.type as ProductSaleFormPayload["type"]) || "egg",
        flock_id: editing.flock_id ? String(editing.flock_id) : "",
        quantity: String(editing.quantity ?? ""),
        unit_price: String(editing.unit_price ?? ""),
        date: localDateInputValue(editing.date),
        customer: {
          customer_id: editing.customer_id ?? null,
          customer_name: editing.customer_name || editing.customer?.name || "",
          customer_phone: editing.customer_phone || "",
        },
        payment_method: editing.payment_method || "",
        payment_status: (editing.payment_status as ProductSaleFormPayload["payment_status"]) || "paid",
        notes: editing.notes || "",
      });
    } else {
      setFormData(defaultFormData(defaultFlockId));
    }

    setErrors({});
    setIsSubmitting(false);
    setEggStock(null);
  }, [isOpen, editing, defaultFlockId]);

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
    if (!formData.quantity || quantityNum <= 0) next.quantity = "Quantity must be greater than 0";
    if (formData.unit_price === "" || unitPriceNum < 0) next.unit_price = "Unit price is required";
    if (!formData.date) next.date = "Sale date is required";
    if (formData.type === "egg" && eggStock && quantityNum > eggStock.available) {
      next.quantity = `Only ${formatEggsWithCrates(eggStock.available)} available as of ${eggStock.as_of}`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        type: formData.type,
        flock_id: formData.flock_id ? Number(formData.flock_id) : null,
        quantity: quantityNum,
        unit_price: unitPriceNum,
        date: formData.date,
        customer_id: formData.customer.customer_id,
        customer_name: formData.customer.customer_name || null,
        customer_phone: formData.customer.customer_phone || null,
        payment_method: formData.payment_method || null,
        payment_status: formData.payment_status,
        notes: formData.notes || null,
      });
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
                setFormData((prev) => ({ ...prev, type: value as ProductSaleFormPayload["type"] }))
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
            {formData.type === "egg" && (
              <p className="text-xs text-slate-500">
                Available stock is calculated from eggs collected on or before this date.
              </p>
            )}
          </div>

          {formData.type === "egg" && formData.flock_id ? (
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
              <Label htmlFor="quantity">Quantity (eggs)</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              />
              {errors.quantity && <p className="text-xs text-rose-600">{errors.quantity}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_price">Unit price</Label>
              <Input
                id="unit_price"
                type="number"
                min={0}
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit_price: e.target.value }))}
              />
              {errors.unit_price && <p className="text-xs text-rose-600">{errors.unit_price}</p>}
            </div>
          </div>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Total:{" "}
            <span className="font-semibold">
              {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <CustomerPicker
            value={formData.customer}
            onChange={(customer) => setFormData((prev) => ({ ...prev, customer }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_status: value as ProductSaleFormPayload["payment_status"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Payment method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData((prev) => ({ ...prev, payment_method: e.target.value }))}
                placeholder="Cash, transfer..."
              />
            </div>
          </div>

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
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editing ? "Update sale" : "Record sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductSaleModal;
