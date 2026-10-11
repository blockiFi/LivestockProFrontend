import { useEffect, useRef, useState } from "react";
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "@/components/ui/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, CalendarRange, FileText, ListChecks, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import type { FeedType } from "@/lib/types";
import {
  getFeedTypes,
  updateFeedingSchedule,
  updateMedVacSchedule,
  splitFeedingScheduleItem,
} from "@/lib/request";
import FeedingRangeEditor, { type FeedingRangeDraft } from "@/components/poultry/schedules/FeedingRangeEditor";
import { DEFAULT_FEEDING_TIMES, normalizeFeedingTimesForUi, validateFeedingRanges } from "@/lib/feeding-range";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  farmId: number;
  type: "medication" | "vaccination" | "feeding";
  poultryTypeId?: number | null;
  schedule: any;
  onSaved?: () => void | Promise<void>;
};

type LocalItem = any & { __localId?: string };

function inferFeedingMode(items: any[]): "daily" | "range" {
  if (!items.length) return "daily";
  const allSingleDay = items.every((it) => {
    const start = Number(it.start_day ?? it.feeding_day ?? 1);
    const open = it.end_day === null || it.is_open_ended === true || it.open_ended === true;
    if (open) return false;
    const end = Number(it.end_day ?? start);
    return start === end;
  });
  return allSingleDay ? "daily" : "range";
}

function hasMultiDayOrOpenRanges(items: any[]): boolean {
  return items.some((it) => {
    const start = Number(it.start_day ?? it.feeding_day ?? 1);
    if (it.end_day === null || it.open_ended || it.is_open_ended) return true;
    const end = Number(it.end_day ?? start);
    return end !== start;
  });
}

export default function EditScheduleModal({
  open,
  onOpenChange,
  token,
  farmId,
  type,
  poultryTypeId,
  schedule,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<LocalItem[]>([]);
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [feedingEntryMode, setFeedingEntryMode] = useState<"daily" | "range">("daily");
  const initForScheduleIdRef = useRef<number | null>(null);

  const isFeeding = type === "feeding";
  const scheduleId = schedule?.id;

  useEffect(() => {
    if (!open) {
      initForScheduleIdRef.current = null;
      return;
    }
    const sid = schedule?.id ?? null;
    if (!sid) return;
    if (initForScheduleIdRef.current === sid) return;
    initForScheduleIdRef.current = sid;

    setName(isFeeding ? schedule?.title ?? "" : schedule?.name ?? "");
    setDescription(schedule?.description ?? "");
    const currentItems = (schedule?.items ?? []).map((it: any) => ({
      ...it,
      start_day: it.start_day ?? it.feeding_day ?? 1,
      end_day: it.end_day === undefined ? (it.feeding_day ?? it.start_day ?? 1) : it.end_day,
      open_ended: it.end_day === null || it.is_open_ended === true,
      age_days: it.start_day ?? it.feeding_day ?? 1,
      feeding_times: normalizeFeedingTimesForUi(it.feeding_times),
    }));
    setItems(currentItems);
    if (isFeeding) {
      setFeedingEntryMode(inferFeedingMode(currentItems));
    }
  }, [open, isFeeding, schedule]);

  useEffect(() => {
    if (!open || !isFeeding || !poultryTypeId) return;
    (async () => {
      const res = (await getFeedTypes(token, farmId, Number(poultryTypeId), false)) as any;
      if (res?.success && res?.data) setFeedTypes(res.data);
    })();
  }, [open, isFeeding, poultryTypeId, token, farmId]);

  const feedingRanges: FeedingRangeDraft[] = items.map((it, i) => ({
    id: it.id,
    __localId: it.__localId ?? `local-${i}`,
    feed_type_id: it.feed_type_id ?? null,
    start_day: Number(it.start_day ?? it.feeding_day ?? 1),
    end_day: it.open_ended ? null : it.end_day != null ? Number(it.end_day) : Number(it.start_day ?? 1),
    open_ended: Boolean(it.open_ended),
    quantity: it.quantity ?? 0,
    feeding_times: normalizeFeedingTimesForUi(it.feeding_times),
  }));

  const switchFeedingMode = (mode: "daily" | "range") => {
    if (mode === feedingEntryMode) return;
    if (mode === "daily" && hasMultiDayOrOpenRanges(items)) {
      alert(
        "This schedule has multi-day or open-ended ranges. Split or remove them before switching to Daily mode."
      );
      return;
    }
    if (mode === "range") {
      // Daily → Range: keep 1-day rows as-is (user can extend)
      setItems((prev) =>
        prev.map((it) => {
          const day = Number(it.start_day ?? it.age_days ?? it.feeding_day ?? 1);
          return {
            ...it,
            start_day: day,
            end_day: it.end_day ?? day,
            open_ended: false,
            age_days: day,
          };
        })
      );
    }
    setFeedingEntryMode(mode);
  };

  const updateDailyItem = (idx: number, patch: Partial<LocalItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        const day = Number(next.age_days ?? next.start_day ?? 1);
        return {
          ...next,
          age_days: day,
          start_day: day,
          end_day: day,
          open_ended: false,
          feeding_day: day,
        };
      })
    );
  };

  const addDailyItem = () => {
    const lastDay = items.reduce((max, it) => {
      const d = Number(it.start_day ?? it.age_days ?? 0);
      return Math.max(max, d);
    }, 0);
    const day = lastDay + 1 || 1;
    setItems((prev) => [
      ...prev,
      {
        __localId: `new-${Date.now()}`,
        feed_type_id: feedTypes[0]?.id ?? null,
        age_days: day,
        start_day: day,
        end_day: day,
        open_ended: false,
        quantity: 40,
        feeding_times: DEFAULT_FEEDING_TIMES.map((t) => ({ ...t })),
      },
    ]);
  };

  const removeDailyItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDailyTime = (itemIdx: number, timeIdx: number, patch: { time?: string; percentage?: number }) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const times = normalizeFeedingTimesForUi(it.feeding_times);
        times[timeIdx] = { ...(times[timeIdx] ?? { time: "08:00", percentage: 0 }), ...patch };
        return { ...it, feeding_times: times };
      })
    );
  };

  const handleSave = async () => {
    if (!token || !farmId || !scheduleId) return;
    setIsSaving(true);
    try {
      if (!name.trim()) throw new Error(isFeeding ? "Title is required" : "Name is required");

      if (isFeeding) {
        const payloadItems =
          feedingEntryMode === "daily"
            ? items.map((it) => {
                const day = Number(it.start_day ?? it.age_days ?? 1);
                return {
                  id: it.id,
                  feed_type_id: Number(it.feed_type_id),
                  feeding_times: normalizeFeedingTimesForUi(it.feeding_times),
                  quantity: Number(it.quantity) || 0,
                  start_day: day,
                  end_day: day,
                  open_ended: false,
                };
              })
            : items.map((it) => ({
                id: it.id,
                feed_type_id: Number(it.feed_type_id),
                feeding_times: normalizeFeedingTimesForUi(it.feeding_times),
                quantity: Number(it.quantity) || 0,
                start_day: Number(it.start_day) || 1,
                end_day: it.open_ended ? null : Number(it.end_day ?? it.start_day),
                open_ended: Boolean(it.open_ended),
              }));

        const normalized = payloadItems.map((r, i) => ({
          id: r.id ?? i,
          start_day: Number(r.start_day) || 1,
          end_day: r.open_ended ? null : Number(r.end_day ?? r.start_day),
        }));
        const check = validateFeedingRanges(normalized);
        if (check.errors.length) {
          throw new Error(check.errors.join("\n"));
        }

        for (const [i, it] of payloadItems.entries()) {
          if (!it.feed_type_id) throw new Error(`Item ${i + 1}: feed type is required`);
          if (!it.quantity || it.quantity <= 0) throw new Error(`Item ${i + 1}: quantity is required`);
          const times = it.feeding_times || [];
          if (!times.length) throw new Error(`Item ${i + 1}: at least one feeding time is required`);
          const total = times.reduce((s: number, ft: any) => s + Number(ft.percentage || 0), 0);
          if (Math.abs(total - 100) > 0.01) {
            throw new Error(`Item ${i + 1}: feeding time percentages must total 100%`);
          }
        }

        const res = await updateFeedingSchedule(token, farmId, scheduleId, {
          title: name,
          description,
          items: payloadItems,
        });
        if (!res.success) {
          const err = (res as any).error;
          const msg = Array.isArray(err)
            ? err.map((e: any) => (typeof e === "string" ? e : JSON.stringify(e))).join(", ")
            : err?.items
              ? Array.isArray(err.items)
                ? err.items.join(", ")
                : JSON.stringify(err.items)
              : "Failed to update feeding schedule";
          throw new Error(msg);
        }
      } else {
        const res = await updateMedVacSchedule(token, farmId, type, scheduleId, { name, description });
        if (!res.success) throw new Error((res as any).error?.[0] ?? "Failed to update schedule");
      }

      await Promise.resolve(onSaved?.());
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSplit = async (_index: number, day: number) => {
    const item = items[_index];
    if (!item?.id) return;
    const res = await splitFeedingScheduleItem(token, farmId, item.id, { day });
    if (!res.success) {
      alert((res as any).error?.[0] ?? "Split failed");
      return;
    }
    await Promise.resolve(onSaved?.());
    const original = res.data?.original;
    const created = res.data?.created;
    if (original && created) {
      setItems((prev) => {
        const next = [...prev];
        next[_index] = { ...original, open_ended: original.end_day === null };
        next.splice(_index + 1, 0, { ...created, open_ended: created.end_day === null });
        return next;
      });
      setFeedingEntryMode("range");
    }
  };

  const modeToggle = (
    <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {(["daily", "range"] as const).map((mode) => (
        <Button
          key={mode}
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 rounded-lg",
            feedingEntryMode === mode && "bg-teal-700 text-white hover:bg-teal-800 hover:text-white"
          )}
          onClick={() => switchFeedingMode(mode)}
        >
          {mode === "daily" ? "Daily (per day)" : "Day ranges"}
        </Button>
      ))}
    </div>
  );

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="capitalize">Edit {type} schedule</span>}
      description="Update the schedule details and its items."
      icon={PencilLine}
      tone="schedule"
      size={isFeeding ? "xl" : "lg"}
      busy={isSaving}
      footer={
        <ModalFooterActions
          onCancel={() => onOpenChange(false)}
          submitType="button"
          onConfirm={handleSave}
          submitLabel="Save"
          busyLabel="Saving..."
          busy={isSaving}
          icon={Save}
        />
      }
    >
      <FormSection step={1} icon={FileText} title="Schedule details" description="Name and description shown across the app.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={isFeeding ? "Title" : "Name"} required htmlFor="edit-schedule-name">
            <Input
              id="edit-schedule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Description" htmlFor="edit-schedule-description">
            <Textarea
              id="edit-schedule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={formTextareaClass()}
            />
          </FormField>
        </div>
      </FormSection>

      {isFeeding ? (
        <FormSection
          step={2}
          icon={feedingEntryMode === "range" ? CalendarRange : CalendarDays}
          title="Feeding items"
          description={
            feedingEntryMode === "range"
              ? "Set one rate across a span of days, including open-ended ranges."
              : "One feed rate per placement day. Saved as single-day ranges."
          }
          action={modeToggle}
        >
          {feedingEntryMode === "range" ? (
            <FeedingRangeEditor
              ranges={feedingRanges}
              feedTypes={feedTypes}
              allowSplit
              onSplit={handleSplit}
              onChange={(ranges) => {
                setItems(
                  ranges.map((r) => ({
                    id: r.id,
                    __localId: r.__localId,
                    feed_type_id: r.feed_type_id,
                    start_day: r.start_day,
                    end_day: r.open_ended ? null : r.end_day,
                    open_ended: Boolean(r.open_ended),
                    quantity: r.quantity,
                    feeding_times: normalizeFeedingTimesForUi(r.feeding_times),
                    feeding_day: r.start_day,
                    age_days: r.start_day,
                  }))
                );
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{items.length} day(s)</p>
                <Button type="button" size="sm" onClick={addDailyItem} className="rounded-xl bg-teal-700 text-white hover:bg-teal-800">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add day
                </Button>
              </div>
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No days yet. Add a feeding day to get started.
                </div>
              )}
              {items.map((it, idx) => (
                <div
                  key={it.id ?? it.__localId ?? idx}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                      <FormField label="Day">
                        <Input
                          type="number"
                          min={1}
                          value={it.age_days ?? it.start_day ?? 1}
                          onChange={(e) =>
                            updateDailyItem(idx, { age_days: Number(e.target.value) || 1 })
                          }
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="g / bird / day">
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={it.quantity ?? 0}
                          onChange={(e) => updateDailyItem(idx, { quantity: e.target.value })}
                          className={formInputClass()}
                        />
                      </FormField>
                      <FormField label="Feed type" className="md:col-span-2">
                        <Select
                          value={it.feed_type_id ? String(it.feed_type_id) : ""}
                          onValueChange={(v) => updateDailyItem(idx, { feed_type_id: Number(v) })}
                        >
                          <SelectTrigger className={formInputClass()}>
                            <SelectValue placeholder="Select feed type" />
                          </SelectTrigger>
                          <SelectContent>
                            {feedTypes.map((ft) => (
                              <SelectItem key={ft.id} value={String(ft.id)}>
                                {ft.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6 h-8 w-8 p-0 text-red-600"
                      onClick={() => removeDailyItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField label="Feeding times">
                    <div className="space-y-2">
                      {(normalizeFeedingTimesForUi(it.feeding_times)).map((ft, ti) => (
                        <div key={ti} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={ft.time}
                            className={formInputClass(false, "h-9 w-32")}
                            onChange={(e) => updateDailyTime(idx, ti, { time: e.target.value })}
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={ft.percentage}
                            className={formInputClass(false, "h-9 w-24")}
                            onChange={(e) =>
                              updateDailyTime(idx, ti, { percentage: Number(e.target.value) })
                            }
                          />
                          <span className="text-xs text-slate-500">%</span>
                          {normalizeFeedingTimesForUi(it.feeding_times).length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                const times = normalizeFeedingTimesForUi(it.feeding_times)
                                updateDailyItem(idx, {
                                  feeding_times: times.filter((_, i) => i !== ti),
                                })
                              }}
                            >
                              <X className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl"
                        onClick={() => {
                          const times = normalizeFeedingTimesForUi(it.feeding_times)
                          updateDailyItem(idx, {
                            feeding_times: [...times, { time: "12:00", percentage: 0 }],
                          })
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add time
                      </Button>
                    </div>
                  </FormField>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      ) : (
        <FormSection step={2} icon={ListChecks} title="Schedule items" description="Items are read-only in this view.">
          <p className="text-sm text-slate-500">
            {items.length} item(s). Medication/vaccination item editing remains read-only in this view.
          </p>
        </FormSection>
      )}
    </FormModal>
  );
}
