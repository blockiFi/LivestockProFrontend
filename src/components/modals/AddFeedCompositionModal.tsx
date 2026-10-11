"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FormField, FormModal, FormSection, ModalFooterActions, formInputClass } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Percent, PieChart } from "lucide-react";
import type { FeedComponent } from "@/lib/types";

export default function AddFeedCompositionModal({
  isOpen,
  onClose,
  components,
  onSubmit,
  currentTotalPercent,
  existingCompositions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  components: FeedComponent[];
  currentTotalPercent: number;
  onSubmit: (payload: { feed_component_id: number; percentage: number }) => Promise<void> | void;
  existingCompositions?: Array<{ feed_component_id: number }>;
}) {
  const activeComponents = useMemo(() => {
    const active = components.filter((c) => (c.status ?? "active") !== "inactive");
    const existingIds = new Set(existingCompositions.map(c => c.feed_component_id));
    return active.filter(c => !existingIds.has(c.id));
  }, [components, existingCompositions]);
  const [feedComponentId, setFeedComponentId] = useState<string>("");
  const [percentage, setPercentage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFeedComponentId("");
    setPercentage("");
    setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const compId = Number(feedComponentId);
    const pct = Number(percentage);
    if (!compId || Number.isNaN(compId)) {
      setError("Please select a feed component");
      return;
    }
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setError("Percentage must be between 0 and 100");
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({ feed_component_id: compId, percentage: pct });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add component to composition");
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
      title="Add component to composition"
      description={
        <>
          Current total: <span className="font-semibold">{currentTotalPercent.toFixed(2)}%</span>. Aim for 100%.
        </>
      }
      icon={Layers}
      tone="feed"
      size="md"
      busy={isSaving}
      onSubmit={handleSubmit}
      footer={
        <ModalFooterActions onCancel={onClose} submitLabel="Add" busyLabel="Adding..." busy={isSaving} />
      }
    >
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      <FormSection icon={PieChart} title="Component share" description="Pick an ingredient and its share of the mix.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Component" required>
            <Select value={feedComponentId} onValueChange={setFeedComponentId}>
              <SelectTrigger className={formInputClass()}>
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                {activeComponents.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Percentage (%)" required htmlFor="composition-percentage">
            <div className="relative">
              <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="composition-percentage"
                inputMode="decimal"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="e.g. 35"
                className={formInputClass(false, "pl-9")}
              />
            </div>
          </FormField>
        </div>
      </FormSection>
    </FormModal>
  );
}

