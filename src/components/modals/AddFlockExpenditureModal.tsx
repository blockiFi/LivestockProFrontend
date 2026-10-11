import { useEffect, useState } from "react";
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CreditCard, Hash, Receipt, Wallet } from "lucide-react";
import type { FlockExpenditure } from "@/lib/types";
import { MANUAL_EXPENDITURE_CATEGORIES, PAYMENT_METHODS, getCategoryLabel } from "@/lib/expenditureCategories";

export type FlockExpenditureFormPayload = {
  category?: string;
  amount?: number;
  currency?: string | null;
  description?: string | null;
  payment_method?: string | null;
  reference_no?: string | null;
  date: string;
};

interface AddFlockExpenditureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FlockExpenditureFormPayload) => Promise<void>;
  editing?: FlockExpenditure | null;
  dateOnly?: boolean;
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return new Date().toISOString().split("T")[0];
  return value.includes("T") ? value.split("T")[0] : value;
};

const defaultFormData = () => ({
  category: "other",
  amount: "",
  currency: "NGN",
  description: "",
  payment_method: "",
  reference_no: "",
  date: new Date().toISOString().split("T")[0],
});

const PRODUCTION_CATEGORIES = ["feed", "medication", "vaccination", "chicks"];
const OPERATIONS_CATEGORIES = ["labour", "transport", "utilities", "equipment", "housing", "maintenance", "other"];

const AddFlockExpenditureModal = ({ isOpen, onClose, onSubmit, editing = null, dateOnly = false }: AddFlockExpenditureModalProps) => {
  const [formData, setFormData] = useState(defaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(editing);

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      setFormData({
        category: editing.category || "other",
        amount: String(editing.amount ?? ""),
        currency: editing.currency || "NGN",
        description: editing.description || "",
        payment_method: editing.payment_method || "",
        reference_no: editing.reference_no || "",
        date: toDateInputValue(editing.date),
      });
    } else {
      setFormData(defaultFormData());
    }

    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, editing]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!dateOnly) {
      if (!formData.category) next.category = "Please select a category";
      if (!formData.amount || Number(formData.amount) <= 0) next.amount = "Enter a valid amount";
    }
    if (!formData.date) next.date = "Select a date";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (dateOnly && editing) {
        await onSubmit({ date: formData.date });
      } else {
        await onSubmit({
          category: formData.category,
          amount: Number(formData.amount),
          currency: formData.currency,
          description: formData.description || undefined,
          payment_method: formData.payment_method || undefined,
          reference_no: formData.reference_no || undefined,
          date: formData.date,
        });
      }
      onClose();
    } catch {
      // errors handled by caller/toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryOptions = (categories: string[]) =>
    categories
      .filter((cat) => MANUAL_EXPENDITURE_CATEGORIES.includes(cat))
      .map((cat) => (
        <SelectItem key={cat} value={cat}>
          {getCategoryLabel(cat)}
        </SelectItem>
      ));

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      title={dateOnly ? "Edit Expenditure Date" : isEditing ? "Edit Flock Expenditure" : "Record Expenditure"}
      description={
        dateOnly
          ? "Adjust when this auto-generated cost was incurred."
          : "Track a cost spent on this flock."
      }
      icon={Receipt}
      tone="sales"
      size={dateOnly ? "sm" : "md"}
      busy={isSubmitting}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitType="button"
          onConfirm={() => void handleSubmit()}
          submitLabel={isEditing ? "Update" : "Save expenditure"}
          busyLabel="Saving..."
          busy={isSubmitting}
        />
      }
    >
      {dateOnly && editing && (
        <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Category:</span> {getCategoryLabel(editing.category)}
          </p>
          <p>
            <span className="font-medium">Amount:</span>{" "}
            {(editing.amount || 0).toLocaleString(undefined, {
              style: "currency",
              currency: editing.currency || "NGN",
              minimumFractionDigits: 2,
            })}
          </p>
          {editing.description && (
            <p>
              <span className="font-medium">Description:</span> {editing.description}
            </p>
          )}
          <p className="pt-1 text-xs text-slate-500">
            Auto-generated costs can only have their date adjusted. Delete the source record to remove the cost.
          </p>
        </div>
      )}

      <FormSection
        step={dateOnly ? undefined : 1}
        icon={Wallet}
        title={dateOnly ? "Date" : "Expense"}
        description={dateOnly ? "When the cost was incurred." : "Category, amount and date of the cost."}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!dateOnly && (
            <FormField label="Category" required htmlFor="category" error={errors.category} className="sm:col-span-2">
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category" className={formInputClass(!!errors.category)}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Production costs</SelectLabel>
                    {renderCategoryOptions(PRODUCTION_CATEGORIES)}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Operations & overhead</SelectLabel>
                    {renderCategoryOptions(OPERATIONS_CATEGORIES)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {!dateOnly && (
            <>
              <FormField label="Amount" required htmlFor="amount" error={errors.amount}>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className={formInputClass(!!errors.amount)}
                />
              </FormField>
              <FormField label="Currency" htmlFor="currency">
                <Input
                  id="currency"
                  maxLength={3}
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  className={formInputClass()}
                />
              </FormField>
            </>
          )}

          <FormField label="Date" required htmlFor="date" error={errors.date} className="sm:col-span-2">
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

      {!dateOnly && (
        <FormSection step={2} icon={CreditCard} title="Payment & notes" description="Optional details to help reconcile this cost.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Description" htmlFor="description" className="sm:col-span-2">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Farmhand wages, diesel for generator, pen repairs"
                rows={2}
                className={formTextareaClass()}
              />
            </FormField>

            <FormField label="Payment method" htmlFor="payment_method">
              <Select
                value={formData.payment_method || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, payment_method: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger id="payment_method" className={formInputClass()}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Reference / receipt no." htmlFor="reference_no">
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="reference_no"
                  value={formData.reference_no}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reference_no: e.target.value }))}
                  placeholder="INV-2026-001"
                  className={formInputClass(false, "pl-9")}
                />
              </div>
            </FormField>
          </div>
        </FormSection>
      )}
    </FormModal>
  );
};

export default AddFlockExpenditureModal;
