import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dateOnly ? "Edit Expenditure Date" : isEditing ? "Edit Flock Expenditure" : "Record Expenditure"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {dateOnly && editing && (
            <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700 space-y-1">
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
              <p className="text-xs text-gray-500 pt-1">
                Auto-generated costs can only have their date adjusted. Delete the source record to remove the cost.
              </p>
            </div>
          )}

          {!dateOnly && (
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
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
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
          )}

          {!dateOnly && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  maxLength={3}
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <div className="flex items-center gap-2">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {!dateOnly && (
            <>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Farmhand wages, diesel for generator, pen repairs"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="payment_method">Payment method</Label>
                  <Select
                    value={formData.payment_method || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, payment_method: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger id="payment_method">
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
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reference_no">Reference / receipt no.</Label>
                  <Input
                    id="reference_no"
                    value={formData.reference_no}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reference_no: e.target.value }))}
                    placeholder="INV-2026-001"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save expenditure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFlockExpenditureModal;
