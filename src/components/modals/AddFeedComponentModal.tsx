"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import type { FeedComponent } from "@/lib/types";
import { generateFeedComponentWithAI } from "@/lib/request";
import { AiGate } from "@/components/general/AiGate";

type FormState = {
  name: string;
  description: string;
  unit: string;
  crude_protein: string;
  crude_fat: string;
  crude_fiber: string;
  calcium: string;
  phosphorus: string;
  metabolizable_energy: string;
  moisture: string;
  ash: string;
  status: "active" | "inactive";
};

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function AddFeedComponentModal({
  isOpen,
  onClose,
  onSubmit,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<FeedComponent>) => Promise<void>;
  editing?: FeedComponent | null;
}) {
  const defaultForm: FormState = useMemo(
    () => ({
      name: "",
      description: "",
      unit: "kg",
      crude_protein: "",
      crude_fat: "",
      crude_fiber: "",
      calcium: "",
      phosphorus: "",
      metabolizable_energy: "",
      moisture: "",
      ash: "",
      status: "active",
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  useEffect(() => {
    if (!isOpen) return;
    if (!editing) {
      setForm(defaultForm);
      setError(null);
      return;
    }
    setForm({
      name: editing.name ?? "",
      description: editing.description ?? "",
      unit: editing.unit ?? "kg",
      crude_protein: toStr(editing.crude_protein ?? ""),
      crude_fat: toStr(editing.crude_fat ?? ""),
      crude_fiber: toStr(editing.crude_fiber ?? ""),
      calcium: toStr(editing.calcium ?? ""),
      phosphorus: toStr(editing.phosphorus ?? ""),
      metabolizable_energy: toStr(editing.metabolizable_energy ?? ""),
      moisture: toStr(editing.moisture ?? ""),
      ash: toStr(editing.ash ?? ""),
      status: (editing.status as any) === "inactive" ? "inactive" : "active",
    });
    setError(null);
  }, [isOpen, editing, defaultForm]);

  const parseNum = (s: string) => {
    if (s.trim() === "") return null;
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
    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit: form.unit.trim() || "kg",
        crude_protein: parseNum(form.crude_protein),
        crude_fat: parseNum(form.crude_fat),
        crude_fiber: parseNum(form.crude_fiber),
        calcium: parseNum(form.calcium),
        phosphorus: parseNum(form.phosphorus),
        metabolizable_energy: parseNum(form.metabolizable_energy),
        moisture: parseNum(form.moisture),
        ash: parseNum(form.ash),
        status: form.status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save feed component");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError("Enter a name before using AI assist");
      return;
    }
    if (!token || !farmId) {
      setError("You must be logged in with an active farm to use AI assist");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateFeedComponentWithAI(token, farmId, name);
      if (res.success && res.data) {
        const c = res.data;
        setForm((prev) => ({
          ...prev,
          name: c.name ?? prev.name,
          description: c.description ?? prev.description,
          unit: c.unit ?? prev.unit ?? "kg",
          crude_protein: toStr(c.crude_protein ?? ""),
          crude_fat: toStr(c.crude_fat ?? ""),
          crude_fiber: toStr(c.crude_fiber ?? ""),
          calcium: toStr(c.calcium ?? ""),
          phosphorus: toStr(c.phosphorus ?? ""),
          metabolizable_energy: toStr(c.metabolizable_energy ?? ""),
          moisture: toStr(c.moisture ?? ""),
          ash: toStr(c.ash ?? ""),
        }));
        toast.success("AI-generated nutritional profile applied");
      } else {
        const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error || "Failed to generate with AI");
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to generate component with AI";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Feed Component" : "Add Feed Component"}</DialogTitle>
          <DialogDescription>
            Feed components are ingredients like maize, soybean meal, fish meal, etc. Nutritional values are per 100%.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Name *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1"
                />
                <AiGate fallback={null}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !form.name.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Assist
                      </>
                    )}
                  </Button>
                </AiGate>
              </div>
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="kg" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional notes..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Crude Protein (%)</Label>
              <Input inputMode="decimal" value={form.crude_protein} onChange={(e) => setForm((p) => ({ ...p, crude_protein: e.target.value }))} />
            </div>
            <div>
              <Label>Crude Fat (%)</Label>
              <Input inputMode="decimal" value={form.crude_fat} onChange={(e) => setForm((p) => ({ ...p, crude_fat: e.target.value }))} />
            </div>
            <div>
              <Label>Crude Fiber (%)</Label>
              <Input inputMode="decimal" value={form.crude_fiber} onChange={(e) => setForm((p) => ({ ...p, crude_fiber: e.target.value }))} />
            </div>
            <div>
              <Label>Moisture (%)</Label>
              <Input inputMode="decimal" value={form.moisture} onChange={(e) => setForm((p) => ({ ...p, moisture: e.target.value }))} />
            </div>
            <div>
              <Label>Calcium (%)</Label>
              <Input inputMode="decimal" value={form.calcium} onChange={(e) => setForm((p) => ({ ...p, calcium: e.target.value }))} />
            </div>
            <div>
              <Label>Phosphorus (%)</Label>
              <Input inputMode="decimal" value={form.phosphorus} onChange={(e) => setForm((p) => ({ ...p, phosphorus: e.target.value }))} />
            </div>
            <div>
              <Label>Ash (%)</Label>
              <Input inputMode="decimal" value={form.ash} onChange={(e) => setForm((p) => ({ ...p, ash: e.target.value }))} />
            </div>
            <div>
              <Label>Metab. Energy (kcal/kg)</Label>
              <Input inputMode="decimal" value={form.metabolizable_energy} onChange={(e) => setForm((p) => ({ ...p, metabolizable_energy: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Create Component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

