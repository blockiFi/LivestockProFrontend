"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import { FormField, FormModal, FormSection, ModalFooterActions, formInputClass } from "@/components/ui/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Layers, Loader2, Sparkles, Wheat } from "lucide-react";
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

  const nutrientFields: Array<{ key: Exclude<keyof FormState, "status">; label: string }> = [
    { key: "crude_protein", label: "Crude protein (%)" },
    { key: "crude_fat", label: "Crude fat (%)" },
    { key: "crude_fiber", label: "Crude fiber (%)" },
    { key: "moisture", label: "Moisture (%)" },
    { key: "calcium", label: "Calcium (%)" },
    { key: "phosphorus", label: "Phosphorus (%)" },
    { key: "ash", label: "Ash (%)" },
    { key: "metabolizable_energy", label: "Metab. energy (kcal/kg)" },
  ];

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editing ? "Edit feed component" : "Add feed component"}
      description="Feed components are ingredients like maize, soybean meal, fish meal, etc. Nutritional values are per 100%."
      icon={Layers}
      tone="feed"
      size="lg"
      busy={isSaving}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          submitLabel={editing ? "Save changes" : "Create component"}
          busyLabel="Saving..."
          busy={isSaving}
        />
      }
    >
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <FormSection icon={Wheat} title="Ingredient" description="Name the ingredient, or let AI fill in its nutritional profile.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Name" required htmlFor="feed-component-name" className="md:col-span-2">
            <div className="flex gap-2">
              <Input
                id="feed-component-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={formInputClass(false, "flex-1")}
              />
              <AiGate fallback={null}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !form.name.trim()}
                  className="h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      AI Assist
                    </>
                  )}
                </Button>
              </AiGate>
            </div>
          </FormField>
          <FormField label="Unit" htmlFor="feed-component-unit">
            <Input
              id="feed-component-unit"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              placeholder="kg"
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Description" htmlFor="feed-component-desc" className="md:col-span-3">
            <Input
              id="feed-component-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional notes..."
              className={formInputClass()}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={FlaskConical} title="Nutritional profile" description="Leave blank any values you don't know.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {nutrientFields.map(({ key, label }) => (
            <FormField key={key} label={label} htmlFor={`feed-component-${key}`}>
              <Input
                id={`feed-component-${key}`}
                inputMode="decimal"
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className={formInputClass()}
              />
            </FormField>
          ))}
        </div>
      </FormSection>
    </FormModal>
  );
}
