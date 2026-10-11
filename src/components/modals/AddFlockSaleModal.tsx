import { useEffect, useState } from "react";
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
import { AlertTriangle, Bird, CalendarDays, StickyNote, Tag, UserRound } from "lucide-react";
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
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      title={isEditing ? "Edit Live Bird Sale" : "Record Live Bird Sale"}
      description="Sell live birds from this flock and record who bought them."
      icon={Bird}
      tone="sales"
      size="md"
      busy={isSubmitting}
      dismissible={false}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel={isEditing ? "Update Sale" : "Record Sale"}
          busyLabel="Saving..."
          busy={isSubmitting}
        />
      }
    >
      <FormSection step={1} icon={Tag} title="Sale details" description="Number of birds, price and sale date.">
        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Current live birds: <strong>{liveBirdCount}</strong>
          {isEditing && (
            <span className="ml-1 text-sky-700">
              ({availableBirds} available while editing this sale)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Quantity" required htmlFor="quantity" error={errors.quantity}>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={availableBirds}
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              className={formInputClass(!!errors.quantity)}
            />
            {quantityNum > availableBirds && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Exceeds available live birds
              </p>
            )}
          </FormField>
          <FormField label="Unit price (NGN)" required htmlFor="unit_price" error={errors.unit_price}>
            <Input
              id="unit_price"
              type="number"
              min={0}
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit_price: e.target.value }))}
              className={formInputClass(!!errors.unit_price)}
            />
          </FormField>

          <FormSummary
            className="sm:col-span-2"
            label="Total amount"
            value={totalAmount.toLocaleString(undefined, {
              style: "currency",
              currency: "NGN",
              minimumFractionDigits: 2,
            })}
          />

          <FormField label="Sale date" required htmlFor="date" error={errors.date} className="sm:col-span-2">
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
        </div>
      </FormSection>

      <FormSection step={2} icon={UserRound} title="Customer" description="Link a saved customer or enter a walk-in buyer.">
        <CustomerPicker
          value={formData.customer}
          onChange={(customer) => setFormData((prev) => ({ ...prev, customer }))}
        />
      </FormSection>

      <FormSection step={3} icon={StickyNote} title="Notes" description="Anything else worth remembering about this sale.">
        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className={formTextareaClass()}
          />
        </FormField>
      </FormSection>
    </FormModal>
  );
};

export default AddFlockSaleModal;
