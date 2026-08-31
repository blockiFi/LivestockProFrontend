"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Feed Product" : "Add Feed Product"}</DialogTitle>
          <DialogDescription>Manage feed products that can be used in compositions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional notes..."
            />
          </div>

          <div>
            <Label>Feed Type</Label>
            <Select
              value={form.poultry_feed_type_id || undefined}
              onValueChange={(value) => setForm((p) => ({ ...p, poultry_feed_type_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="kg" />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 250.00"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

