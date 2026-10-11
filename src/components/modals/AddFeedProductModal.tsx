"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { FormField, FormModal, FormSection, ModalFooterActions, formInputClass } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Hash, Package, Tag } from "lucide-react";
import type { PoultryFeedProduct, FeedType } from "@/lib/types";
import { getFeedTypes } from "@/lib/request";

type FormState = {
  name: string;
  sku: string;
  description: string;
  unit: string;
  price: string;
  status: "active" | "inactive";
  poultry_feed_type_id: string;
};

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function AddFeedProductModal({
  isOpen,
  onClose,
  onSubmit,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<PoultryFeedProduct>) => Promise<void>;
  editing?: PoultryFeedProduct | null;
}) {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  const [form, setForm] = useState<FormState>({
    name: "",
    sku: "",
    description: "",
    unit: "kg",
    price: "",
    status: "active",
    poultry_feed_type_id: "",
  });
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch feed types when modal opens
  useEffect(() => {
    if (!isOpen || !token || !farmId) return;
    const fetchFeedTypes = async () => {
      try {
        const res = await getFeedTypes(token, farmId, 0, false);
        if (res.success && Array.isArray(res.data)) {
          setFeedTypes(res.data);
        }
      } catch (err) {
        console.error("Error fetching feed types:", err);
      }
    };
    fetchFeedTypes();
  }, [isOpen, token, farmId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!editing) {
      setForm({
        name: "",
        sku: "",
        description: "",
        unit: "kg",
        price: "",
        status: "active",
        poultry_feed_type_id: "",
      });
      setError(null);
      return;
    }
    setForm({
      name: editing.name ?? "",
      sku: editing.sku ?? "",
      description: editing.description ?? "",
      unit: (editing as any).unit ?? "kg",
      price: toStr((editing as any).price ?? ""),
      status: ((editing as any).status as any) === "inactive" ? "inactive" : "active",
      poultry_feed_type_id: editing.poultry_feed_type_id ? String(editing.poultry_feed_type_id) : "none",
    });
    setError(null);
  }, [isOpen, editing]);

  const parsePrice = (s: string) => {
    if (!s.trim()) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    const price = parsePrice(form.price);
    if (form.price && price === null) {
      setError("Price must be a valid number");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        unit: form.unit.trim() || "kg",
        price: price,
        status: form.status,
        poultry_feed_type_id: form.poultry_feed_type_id ? Number(form.poultry_feed_type_id) : null,
      } as any);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save feed product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editing ? "Edit feed product" : "Add feed product"}
      description="Manage feed products that can be used in compositions."
      icon={Package}
      tone="feed"
      size="md"
      busy={isSaving}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitLabel={editing ? "Save changes" : "Create product"}
          busyLabel="Saving..."
          busy={isSaving}
        />
      }
    >
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <FormSection icon={Tag} title="Product details" description="Name, SKU and the feed type it belongs to.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Name" required htmlFor="feed-product-name">
            <Input
              id="feed-product-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="SKU" htmlFor="feed-product-sku">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="feed-product-sku"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>

          <FormField label="Description" htmlFor="feed-product-desc" className="md:col-span-2">
            <Input
              id="feed-product-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional notes..."
              className={formInputClass()}
            />
          </FormField>

          <FormField label="Feed type" className="md:col-span-2">
            <Select
              value={form.poultry_feed_type_id || undefined}
              onValueChange={(value) => setForm((p) => ({ ...p, poultry_feed_type_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select feed type (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Optional)</SelectItem>
                {feedTypes.map((ft) => (
                  <SelectItem key={ft.id} value={String(ft.id)}>
                    {ft.name} {ft.description ? `- ${ft.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={Banknote} title="Pricing & status" description="Unit of measure, price and availability.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Unit" htmlFor="feed-product-unit">
            <Input
              id="feed-product-unit"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              placeholder="kg"
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Price" htmlFor="feed-product-price">
            <Input
              id="feed-product-price"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="e.g. 250.00"
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onValueChange={(value) => setForm((p) => ({ ...p, status: value as FormState["status"] }))}
            >
              <SelectTrigger className={formInputClass()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  );
}

