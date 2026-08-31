"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { Equipment, EquipmentCategory } from "@/lib/types";
import { createEquipment, updateEquipment } from "@/lib/equipmentRequest";

const STATUSES = [
  "available",
  "in_use",
  "assigned",
  "under_maintenance",
  "damaged",
  "inactive",
];

const CONDITIONS = ["excellent", "good", "fair", "poor", "damaged", "unserviceable"];

const USAGE_METRICS = [
  { value: "hours", label: "Operating hours" },
  { value: "km", label: "Kilometres" },
  { value: "cycles", label: "Cycles" },
  { value: "count", label: "Usage count" },
  { value: "fuel", label: "Fuel usage" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: EquipmentCategory[];
  editing?: Equipment | null;
  onSaved: () => void;
};

const emptyForm = (): Partial<Equipment> => ({
  name: "",
  category_id: undefined,
  equipment_type: "",
  brand: "",
  model: "",
  serial_number: "",
  description: "",
  quantity: 1,
  unit: "",
  purchase_date: "",
  purchase_price: undefined,
  supplier: "",
  invoice_reference: "",
  purchase_order_number: "",
  payment_status: "paid",
  warranty_period_months: undefined,
  warranty_expires_at: "",
  farm_section: "",
  location: "",
  department: "",
  status: "available",
  condition: "good",
  placed_in_service_date: "",
  expected_useful_life_months: undefined,
  usage_metric: "hours",
  maintenance_interval_days: undefined,
  next_maintenance_date: "",
  next_inspection_date: "",
});

export default function AddEquipmentSheet({
  open,
  onOpenChange,
  categories,
  editing,
  onSaved,
}: Props) {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const [form, setForm] = useState<Partial<Equipment>>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ ...editing });
    } else {
      setForm(emptyForm());
    }
  }, [editing, open]);

  const set = (key: keyof Equipment, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !farmId) return;
    if (!form.name?.trim()) {
      toast.error("Equipment name is required");
      return;
    }

    setSaving(true);
    try {
      const res = editing
        ? await updateEquipment(token, farmId, editing.id, form)
        : await createEquipment(token, farmId, form);

      if (res.success) {
        toast.success(editing ? "Equipment updated" : "Equipment added");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error((res.error || []).join(", "));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        <SheetHeader className="p-0 pr-8 mb-6">
          <SheetTitle>{editing ? "Edit Equipment" : "Add Equipment"}</SheetTitle>
          <SheetDescription>
            Register farm equipment with purchase, operational, and warranty details.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Equipment name *</Label>
                <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category_id ? String(form.category_id) : ""}
                  onValueChange={(v) => set("category_id", v ? Number(v) : undefined)}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipment type</Label>
                <Input value={form.equipment_type || ""} onChange={(e) => set("equipment_type", e.target.value)} />
              </div>
              <div>
                <Label>Brand</Label>
                <Input value={form.brand || ""} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={form.model || ""} onChange={(e) => set("model", e.target.value)} />
              </div>
              <div>
                <Label>Serial number</Label>
                <Input value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} value={form.quantity ?? 1} onChange={(e) => set("quantity", Number(e.target.value))} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder="e.g. units, sets" />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Purchase Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Purchase date</Label>
                <Input type="date" value={form.purchase_date || ""} onChange={(e) => set("purchase_date", e.target.value)} />
              </div>
              <div>
                <Label>Purchase price</Label>
                <Input type="number" min={0} step="0.01" value={form.purchase_price ?? ""} onChange={(e) => set("purchase_price", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label>Supplier</Label>
                <Input value={form.supplier || ""} onChange={(e) => set("supplier", e.target.value)} />
              </div>
              <div>
                <Label>Invoice / reference</Label>
                <Input value={form.invoice_reference || ""} onChange={(e) => set("invoice_reference", e.target.value)} />
              </div>
              <div>
                <Label>Purchase order</Label>
                <Input value={form.purchase_order_number || ""} onChange={(e) => set("purchase_order_number", e.target.value)} />
              </div>
              <div>
                <Label>Payment status</Label>
                <Select value={form.payment_status || "paid"} onValueChange={(v) => set("payment_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Warranty (months)</Label>
                <Input type="number" min={0} value={form.warranty_period_months ?? ""} onChange={(e) => set("warranty_period_months", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label>Warranty expiry</Label>
                <Input type="date" value={form.warranty_expires_at || ""} onChange={(e) => set("warranty_expires_at", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Farm & Operational</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Farm section</Label>
                <Input value={form.farm_section || ""} onChange={(e) => set("farm_section", e.target.value)} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location || ""} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={form.department || ""} onChange={(e) => set("department", e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status || "available"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={form.condition || "good"} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usage metric</Label>
                <Select value={form.usage_metric || "hours"} onValueChange={(v) => set("usage_metric", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USAGE_METRICS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Placed in service</Label>
                <Input type="date" value={form.placed_in_service_date || ""} onChange={(e) => set("placed_in_service_date", e.target.value)} />
              </div>
              <div>
                <Label>Maintenance interval (days)</Label>
                <Input type="number" min={0} value={form.maintenance_interval_days ?? ""} onChange={(e) => set("maintenance_interval_days", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label>Next maintenance</Label>
                <Input type="date" value={form.next_maintenance_date || ""} onChange={(e) => set("next_maintenance_date", e.target.value)} />
              </div>
              <div>
                <Label>Next inspection</Label>
                <Input type="date" value={form.next_inspection_date || ""} onChange={(e) => set("next_inspection_date", e.target.value)} />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add equipment"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
