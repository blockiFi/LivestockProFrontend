import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import type { FlockSale } from "@/lib/types";
import CustomerPicker, { type CustomerSelection } from "@/components/crm/CustomerPicker";

export type FlockSaleFormPayload = {
  quantity: number;
  unit_price: number;
  date: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
};

interface AddFlockSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FlockSaleFormPayload) => Promise<void>;
  editing?: FlockSale | null;
  liveBirdCount: number;
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return new Date().toISOString().split("T")[0];
  return value.includes("T") ? value.split("T")[0] : value;
};

const defaultFormData = () => ({
  quantity: "",
  unit_price: "",
  date: new Date().toISOString().split("T")[0],
  customer: {
    customer_id: null,
    customer_name: "",
    customer_phone: "",
  } as CustomerSelection,
  notes: "",
});

const AddFlockSaleModal = ({
  isOpen,
  onClose,
  onSubmit,
  editing = null,
  liveBirdCount,
}: AddFlockSaleModalProps) => {
  const [formData, setFormData] = useState(defaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(editing);

  const availableBirds = isEditing
    ? liveBirdCount + (editing?.culls_applied ?? 0)
    : liveBirdCount;

  const quantityNum = Number(formData.quantity) || 0;
  const unitPriceNum = Number(formData.unit_price) || 0;
  const totalAmount = quantityNum * unitPriceNum;

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      setFormData({
        quantity: String(editing.quantity ?? ""),
        unit_price: String(editing.unit_price ?? ""),
        date: toDateInputValue(editing.date),
        customer: {
          customer_id: editing.customer_id ?? null,
          customer_name: editing.customer_name || "",
          customer_phone: editing.customer_phone || "",
        },
        notes: editing.notes || "",
      });
    } else {
      setFormData(defaultFormData());
    }

    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, editing]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.quantity || quantityNum < 1) next.quantity = "Enter a valid quantity";
    else if (quantityNum > availableBirds) {
      next.quantity = `Cannot exceed live count (${availableBirds} birds available)`;
    }
    if (formData.unit_price === "" || unitPriceNum < 0) next.unit_price = "Enter a valid unit price";
    if (!formData.date) next.date = "Select a date";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        quantity: quantityNum,
        unit_price: unitPriceNum,
        date: formData.date,
        customer_id: formData.customer.customer_id,
        customer_name: formData.customer.customer_name || undefined,
        customer_phone: formData.customer.customer_phone || undefined,
        notes: formData.notes || undefined,
      });
      onClose();
    } catch {
      // errors handled by caller/toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Live Bird Sale" : "Record Live Bird Sale"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Current live birds: <strong>{liveBirdCount}</strong>
            {isEditing && (
              <span className="ml-1 text-blue-700">
                ({availableBirds} available while editing this sale)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={availableBirds}
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
              {quantityNum > availableBirds && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Exceeds available live birds
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit_price">Unit price (NGN)</Label>
              <Input
                id="unit_price"
                type="number"
                min={0}
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit_price: e.target.value }))}
              />
              {errors.unit_price && <p className="text-xs text-red-500 mt-1">{errors.unit_price}</p>}
            </div>
          </div>

          <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">Total amount: </span>
            <span className="font-semibold">
              {totalAmount.toLocaleString(undefined, {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Sale date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <CustomerPicker
            value={formData.customer}
            onChange={(customer) => setFormData((prev) => ({ ...prev, customer }))}
          />

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Sale" : "Record Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFlockSaleModal;
