"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Component to Composition</DialogTitle>
          <DialogDescription>
            Current total: <span className="font-medium">{currentTotalPercent.toFixed(2)}%</span>. Aim for 100%.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <Label>Component *</Label>
            <Select value={feedComponentId} onValueChange={setFeedComponentId}>
              <SelectTrigger>
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
          </div>

          <div>
            <Label>Percentage (%) *</Label>
            <Input inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 35" />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

