import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Loader2, Plus, Trash2, Upload, Wand2 } from "lucide-react";
import type { PoultryType, ScheduleImportDraft, ScheduleImportItemDraft } from "@/lib/types";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { getPoultryTypes, createScheduleImportDraft, updateScheduleImportDraft, confirmScheduleImportDraft, getScheduleImportDraft, extractScheduleImportDraft, deleteScheduleImportDraft, getFeedTypes } from "@/lib/request";
import type { FeedType } from "@/lib/types";
import { expandFeedingImportItemToDays, formatFeedingDayRange, validateFeedingRanges, type FeedingImportLayout } from "@/lib/feeding-range";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  farmId: number;
  onConfirmed?: () => void;
};

const ImportScheduleFromDoc = ({ isOpen, onClose, farmId, onConfirmed }: Props) => {
  const token = useSelector((state: RootState) => state.authentication.token);
  const draftStorageKey = useMemo(() => `aiScheduleImport:lastDraft:${farmId}`, [farmId]);
  const poultryTypeStorageKey = useMemo(
    () => `aiScheduleImport:poultryType:${farmId}`,
    [farmId]
  );

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>([]);
  const [selectedPoultryTypeId, setSelectedPoultryTypeId] = useState<string>("");
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);

  const [medScheduleName, setMedScheduleName] = useState("");
  const [medScheduleDescription, setMedScheduleDescription] = useState("");
  const [vacScheduleName, setVacScheduleName] = useState("");
  const [vacScheduleDescription, setVacScheduleDescription] = useState("");
  const [feedingScheduleTitle, setFeedingScheduleTitle] = useState("");
  const [feedingScheduleDescription, setFeedingScheduleDescription] = useState("");

  const [draft, setDraft] = useState<ScheduleImportDraft | null>(null);
  const [items, setItems] = useState<ScheduleImportItemDraft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !token || !farmId) return;
    (async () => {
      const res = await getPoultryTypes(token, farmId);
      if (res.success && res.data) setPoultryTypes(res.data);
    })();
  }, [isOpen, token, farmId]);

  useEffect(() => {
    if (!isOpen || !token || !farmId) return;
    if (!selectedPoultryTypeId) {
      setFeedTypes([]);
      return;
    }
    (async () => {
      const res = await getFeedTypes(token, farmId, Number(selectedPoultryTypeId), false) as any;
      if (res?.success && res?.data) setFeedTypes(res.data);
    })();
  }, [isOpen, token, farmId, selectedPoultryTypeId]);

  // Resume last saved draft when the modal opens (survives full page refresh).
  useEffect(() => {
    if (!isOpen || !token || !farmId) return;
    if (draft) return;

    const savedPoultryType = localStorage.getItem(poultryTypeStorageKey) || "";
    if (savedPoultryType) {
      setSelectedPoultryTypeId(savedPoultryType);
    }

    const lastId = Number(localStorage.getItem(draftStorageKey) || "");
    if (!lastId) return;

    (async () => {
      const res = await getScheduleImportDraft(token, farmId, lastId);
      if (res.success && res.data) {
        setDraft(res.data);
        setItems(res.data.items || []);
      } else {
        // Draft may have been deleted/confirmed or DB reset; clear stale pointer and show message.
        localStorage.removeItem(draftStorageKey);
        setWarnings((prev) => [
          ...prev,
          ...(res.error || [`Saved draft #${lastId} was not found. Please upload the document again.`]),
        ]);
      }
    })();
  }, [isOpen, token, farmId, draft, draftStorageKey, poultryTypeStorageKey]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setDraft(null);
      setItems([]);
      setWarnings([]);
      setSelectedPoultryTypeId("");
      setMedScheduleName("");
      setMedScheduleDescription("");
      setVacScheduleName("");
      setVacScheduleDescription("");
      setFeedingScheduleTitle("");
      setFeedingScheduleDescription("");
      setIsUploading(false);
      setIsSaving(false);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const hasFeeding = useMemo(() => items.some((i) => i.kind === "feeding"), [items]);
  const feedingLayout: FeedingImportLayout =
    draft?.feeding_layout === "per_day" ? "per_day" : "range";
  const hasMedication = useMemo(() => items.some((i) => i.kind === "medication"), [items]);
  const hasVaccination = useMemo(() => items.some((i) => i.kind === "vaccination"), [items]);
  const feedingMissingFeedTypeCount = useMemo(
    () =>
      items.filter(
        (i) => i.kind === "feeding" && !(Number(i.feed_type_id) > 0)
      ).length,
    [items]
  );

  const confirmBlockers = useMemo(() => {
    const blockers: string[] = [];
    if (!selectedPoultryTypeId) blockers.push("Select a poultry type");
    if (items.length === 0) blockers.push("Add or extract at least one schedule item");
    if (feedingMissingFeedTypeCount > 0) {
      blockers.push(
        `Select a feed type for ${feedingMissingFeedTypeCount} feeding item(s)`
      );
    }
    return blockers;
  }, [selectedPoultryTypeId, items.length, feedingMissingFeedTypeCount]);

  const setPoultryTypeId = (id: string) => {
    setSelectedPoultryTypeId(id);
    if (id) {
      localStorage.setItem(poultryTypeStorageKey, id);
    } else {
      localStorage.removeItem(poultryTypeStorageKey);
    }
  };

  const onUpload = async () => {
    if (!token || !file) return;
    if (!selectedPoultryTypeId) {
      setWarnings(["Please select a poultry type before extracting with AI."]);
      return;
    }
    setIsUploading(true);
    setWarnings([]);
    try {
      const res = await createScheduleImportDraft(token, farmId, file, Number(selectedPoultryTypeId));
      if (res.success && res.data) {
        setDraft(res.data.draft);
        setItems(res.data.draft.items || []);
        setWarnings(res.data.warnings || []);
        localStorage.setItem(draftStorageKey, String(res.data.draft.id));
        localStorage.setItem(poultryTypeStorageKey, selectedPoultryTypeId);
      } else {
        setWarnings(res.error || ["Upload failed"]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const normalizeItemsForSave = (
    list: ScheduleImportItemDraft[],
    layout: FeedingImportLayout = feedingLayout
  ): ScheduleImportItemDraft[] =>
    list.map((it) => {
      if (it.kind !== "feeding") return it;
      const start = Number(it.start_day ?? it.feeding_day ?? 1) || 1;
      if (layout === "per_day") {
        return {
          ...it,
          age_days: null,
          start_day: start,
          end_day: start,
          feeding_day: start,
        };
      }
      const end =
        it.end_day === null && it.start_day != null
          ? null
          : it.end_day === null && it.start_day == null && it.feeding_day != null
            ? start
            : it.end_day == null
              ? start
              : Number(it.end_day);
      return {
        ...it,
        age_days: null,
        start_day: start,
        end_day: end,
        feeding_day: start,
      };
    });

  const onFeedingLayoutChange = (layout: FeedingImportLayout) => {
    setDraft((prev) => (prev ? { ...prev, feeding_layout: layout } : prev));
    if (layout === "per_day") {
      setItems((prev) => {
        const other = prev.filter((item) => item.kind !== "feeding");
        const feeding = prev.filter((item) => item.kind === "feeding");
        const expanded = feeding.flatMap((item) => expandFeedingImportItemToDays(item));
        expanded.sort(
          (a, b) =>
            Number(a.start_day ?? a.feeding_day ?? 0) - Number(b.start_day ?? b.feeding_day ?? 0)
        );
        return [...other, ...expanded];
      });
    }
  };

  const onSaveDraft = async () => {
    if (!token || !draft) return;
    setIsSaving(true);
    try {
      const payloadItems = normalizeItemsForSave(items);
      const res = await updateScheduleImportDraft(token, farmId, draft.id, {
        items: payloadItems,
        feeding_layout: feedingLayout,
      });
      if (res.success && res.data) {
        setDraft(res.data);
        setItems(res.data.items || []);
        localStorage.setItem(draftStorageKey, String(res.data.id));
      } else {
        setWarnings(res.error || ["Failed to save draft"]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onRetryExtract = async () => {
    if (!token || !draft) return;
    if (!selectedPoultryTypeId) {
      setWarnings(["Please select a poultry type before extracting with AI."]);
      return;
    }
    setIsExtracting(true);
    setWarnings([]);
    try {
      const res = await extractScheduleImportDraft(token, farmId, draft.id, Number(selectedPoultryTypeId));
      if (res.success && res.data) {
        setDraft(res.data.draft);
        setItems(res.data.draft.items || []);
        setWarnings(res.data.warnings || []);
        localStorage.setItem(poultryTypeStorageKey, selectedPoultryTypeId);
      } else {
        setWarnings(res.error || ["Failed to retry extraction"]);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const onStartOver = () => {
    localStorage.removeItem(draftStorageKey);
    localStorage.removeItem(poultryTypeStorageKey);
    setFile(null);
    setDraft(null);
    setItems([]);
    setWarnings([]);
    setSelectedPoultryTypeId("");
    setMedScheduleName("");
    setMedScheduleDescription("");
    setVacScheduleName("");
    setVacScheduleDescription("");
    setFeedingScheduleTitle("");
    setFeedingScheduleDescription("");
  };

  const onDeleteDraft = async () => {
    if (!token || !draft) {
      onStartOver();
      return;
    }
    setWarnings([]);
    const res = await deleteScheduleImportDraft(token, farmId, draft.id);
    if (!res.success) {
      setWarnings(res.error || ["Failed to delete draft"]);
      return;
    }
    onStartOver();
  };

  const onConfirm = async () => {
    if (!token || !draft) {
      setWarnings(["Authentication required. Please log in again."]);
      return;
    }
    if (!selectedPoultryTypeId) {
      setWarnings(["Please select a poultry type before confirming."]);
      return;
    }
    if (items.length === 0) {
      setWarnings(["No items to generate yet. Retry AI extraction or add items before confirming."]);
      return;
    }
    if (feedingMissingFeedTypeCount > 0) {
      setWarnings([`Feed type is required for feeding items. Missing for ${feedingMissingFeedTypeCount} item(s).`]);
      return;
    }

    const feedingItems = items.filter((i) => i.kind === "feeding");
    if (feedingItems.length > 0) {
      const rangeCheck = validateFeedingRanges(
        feedingItems.map((it, i) => {
          const start = Number(it.start_day ?? it.feeding_day ?? 1);
          const end =
            it.end_day === null && it.start_day != null
              ? null
              : Number(it.end_day ?? it.start_day ?? it.feeding_day ?? start);
          return {
            id: it.id ?? i,
            start_day: start,
            end_day: end,
          };
        })
      );
      if (rangeCheck.errors.length) {
        setWarnings(rangeCheck.errors);
        return;
      }
    }

    setIsConfirming(true);
    try {
      // Confirm uses server-side draft. Ensure latest UI edits are persisted first.
      const payloadItems = normalizeItemsForSave(items);
      const saveRes = await updateScheduleImportDraft(token, farmId, draft.id, {
        items: payloadItems,
        feeding_layout: feedingLayout,
      });
      if (!saveRes.success) {
        setWarnings((saveRes as any).error || ["Failed to save draft before confirming."]);
        return;
      }
      if (saveRes.data) {
        setDraft(saveRes.data);
        setItems(saveRes.data.items || []);
        localStorage.setItem(draftStorageKey, String(saveRes.data.id));
      }

      const res = await confirmScheduleImportDraft(token, farmId, draft.id, {
        poultry_type_id: Number(selectedPoultryTypeId),
        medication_schedule_name: medScheduleName || undefined,
        medication_schedule_description: medScheduleDescription || undefined,
        vaccination_schedule_name: vacScheduleName || undefined,
        vaccination_schedule_description: vacScheduleDescription || undefined,
        feeding_schedule_title: feedingScheduleTitle || undefined,
        feeding_schedule_description: feedingScheduleDescription || undefined,
      });
      if (res.success) {
        localStorage.removeItem(draftStorageKey);
        onConfirmed?.();
        onClose();
      } else {
        setWarnings(res.error || ["Failed to confirm draft"]);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<ScheduleImportItemDraft>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        if (patch.kind === "feeding" && it.kind !== "feeding") {
          const day = Number(next.start_day ?? next.feeding_day ?? next.age_days ?? 1) || 1;
          next.age_days = null;
          next.start_day = day;
          next.end_day = day;
          next.feeding_day = day;
          next.quantity = next.quantity ?? 40;
          next.feeding_times =
            Array.isArray(next.feeding_times) && next.feeding_times.length
              ? next.feeding_times
              : [
                  { time: "08:00", percentage: 50 },
                  { time: "17:00", percentage: 50 },
                ];
        }
        return next;
      })
    );
  };

  const updateFeedingTime = (
    idx: number,
    timeIdx: number,
    patch: Partial<{ time: string; percentage: number }>
  ) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const times = Array.isArray(it.feeding_times) ? [...it.feeding_times] : [];
        const current = times[timeIdx] || { time: "08:00", percentage: 0 };
        times[timeIdx] = { ...current, ...patch };
        return { ...it, feeding_times: times };
      })
    );
  };

  const addFeedingTime = (idx: number) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const times = Array.isArray(it.feeding_times) ? [...it.feeding_times] : [];
        times.push({ time: "08:00", percentage: 0 });
        return { ...it, feeding_times: times };
      })
    );
  };

  const removeFeedingTime = (idx: number, timeIdx: number) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const times = Array.isArray(it.feeding_times) ? [...it.feeding_times] : [];
        return { ...it, feeding_times: times.filter((_, t) => t !== timeIdx) };
      })
    );
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const addBlankItem = () => {
    setItems((prev) => [
      ...prev,
      {
        kind: "medication",
        age_days: 1,
        name: "",
        dose: 1,
        withdrawal_period_days: 0,
        description: "",
        storage_instructions: "",
        feeding_day: null,
        start_day: null,
        end_day: null,
        feed_type_id: null,
        quantity: null,
        feeding_times: [],
        confidence: null,
        notes: "",
      },
    ]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-6 sm:p-8">
        <SheetHeader className="p-0 pr-8">
          <SheetTitle>Import Schedule from PDF/Image (AI)</SheetTitle>
          <SheetDescription>
            Upload a document, review/edit the extracted draft, then confirm to generate schedules.
            Feeding data is detected as day ranges or day-by-day rows depending on the document layout.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-8">
          {!draft ? (
            <div className="space-y-4 rounded-lg border p-4 bg-white">
              <div className="space-y-2">
                <Label>Poultry Type (required for AI extraction)</Label>
                <Select value={selectedPoultryTypeId} onValueChange={setPoultryTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select poultry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {poultryTypes.map((pt) => (
                      <SelectItem key={pt.id} value={String(pt.id)}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document (PDF/Image)</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button onClick={onUpload} disabled={!file || isUploading || !selectedPoultryTypeId} className="gap-2">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload & Extract
              </Button>
              {warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}

              {items.length === 0 ? (
                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <div className="text-sm text-gray-700">
                    No items were extracted yet. You can retry extraction or start over and upload again.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" onClick={onRetryExtract} disabled={isExtracting} className="gap-2">
                      {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Retry AI Extraction
                    </Button>
                    <Button type="button" variant="outline" onClick={onStartOver}>
                      Start Over
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Poultry Type (required to confirm)</Label>
                  <Select value={selectedPoultryTypeId} onValueChange={setPoultryTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select poultry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {poultryTypes.map((pt) => (
                        <SelectItem key={pt.id} value={String(pt.id)}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasFeeding ? (
                  <div className="space-y-2">
                    <Label>Feeding schedule title</Label>
                    <Input
                      value={feedingScheduleTitle}
                      onChange={(e) => setFeedingScheduleTitle(e.target.value)}
                      placeholder="e.g. Broiler Feeding Schedule"
                    />
                  </div>
                ) : null}
              </div>

              {hasMedication || hasVaccination ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasMedication ? (
                    <div className="space-y-2">
                      <Label>Medication schedule name</Label>
                      <Input
                        value={medScheduleName}
                        onChange={(e) => setMedScheduleName(e.target.value)}
                        placeholder="e.g. Imported Medication Schedule"
                      />
                    </div>
                  ) : null}
                  {hasVaccination ? (
                    <div className="space-y-2">
                      <Label>Vaccination schedule name</Label>
                      <Input
                        value={vacScheduleName}
                        onChange={(e) => setVacScheduleName(e.target.value)}
                        placeholder="e.g. Imported Vaccination Schedule"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {hasMedication || hasVaccination ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasMedication ? (
                    <div className="space-y-2">
                      <Label>Medication schedule description</Label>
                      <Textarea
                        value={medScheduleDescription}
                        onChange={(e) => setMedScheduleDescription(e.target.value)}
                        placeholder="Optional description..."
                      />
                    </div>
                  ) : null}
                  {hasVaccination ? (
                    <div className="space-y-2">
                      <Label>Vaccination schedule description</Label>
                      <Textarea
                        value={vacScheduleDescription}
                        onChange={(e) => setVacScheduleDescription(e.target.value)}
                        placeholder="Optional description..."
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {hasFeeding ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2">
                    <Label>Feeding table format</Label>
                    <Select
                      value={feedingLayout}
                      onValueChange={(value) => onFeedingLayoutChange(value as FeedingImportLayout)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="range">Day ranges (weeks / spans)</SelectItem>
                        <SelectItem value="per_day">Day-by-day (one row per day)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-600">
                      {feedingLayout === "per_day"
                        ? "Each feeding row maps to a single flock day. The AI detected or you selected a daily table."
                        : "Feeding rows can span multiple days when the document groups by week or age range."}
                      {draft?.feeding_layout_reason ? (
                        <span className="block mt-1 text-slate-500">
                          AI note: {draft.feeding_layout_reason}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Feeding schedule description</Label>
                    <Textarea
                      value={feedingScheduleDescription}
                      onChange={(e) => setFeedingScheduleDescription(e.target.value)}
                      placeholder="Optional description..."
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{items.length} draft item(s)</div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="destructive" onClick={onDeleteDraft}>
                    Delete draft & start again
                  </Button>
                  <Button variant="outline" onClick={addBlankItem}>
                    Add item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={it.id ?? idx} className="rounded-lg border p-4 bg-white space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                      <div className="flex gap-2 items-center">
                        <Label className="w-24">Kind</Label>
                        <Select
                          value={it.kind}
                          onValueChange={(v) => updateItem(idx, { kind: v as any })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="vaccination">Vaccination</SelectItem>
                            <SelectItem value="feeding">Feeding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="destructive" onClick={() => removeItem(idx)}>
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {it.kind !== "feeding" ? (
                        <>
                          <div className="space-y-1">
                            <Label>Age (days)</Label>
                            <Input
                              type="number"
                              value={it.age_days ?? ""}
                              onChange={(e) => updateItem(idx, { age_days: Number(e.target.value) })}
                              min={0}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Dose</Label>
                            <Input
                              type="number"
                              value={it.dose ?? ""}
                              onChange={(e) => updateItem(idx, { dose: Number(e.target.value) })}
                              min={1}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Withdrawal (days)</Label>
                            <Input
                              type="number"
                              value={it.withdrawal_period_days ?? ""}
                              onChange={(e) => updateItem(idx, { withdrawal_period_days: Number(e.target.value) })}
                              min={0}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1 md:col-span-3">
                            <Label className="text-xs text-slate-500">
                              {feedingLayout === "per_day" ? (
                                <>
                                  Flock day{" "}
                                  <span className="font-medium text-slate-700">
                                    (Day {Number(it.start_day ?? it.feeding_day ?? 1)})
                                  </span>
                                  {" — "}one row per day from the document.
                                </>
                              ) : (
                                <>
                                  Day range{" "}
                                  <span className="font-medium text-slate-700">
                                    (
                                    {(() => {
                                      const start = Number(it.start_day ?? it.feeding_day ?? 1);
                                      const end =
                                        it.end_day === null && it.start_day != null
                                          ? null
                                          : Number(it.end_day ?? it.start_day ?? it.feeding_day ?? start);
                                      return formatFeedingDayRange(start, end);
                                    })()}
                                    )
                                  </span>
                                  {" — "}use a span when the document lists weeks or the same rate across days.
                                </>
                              )}
                            </Label>
                          </div>
                          {feedingLayout === "per_day" ? (
                            <div className="space-y-1">
                              <Label>Day</Label>
                              <Input
                                type="number"
                                value={it.start_day ?? it.feeding_day ?? ""}
                                onChange={(e) => {
                                  const day = Number(e.target.value) || 1;
                                  updateItem(idx, {
                                    start_day: day,
                                    end_day: day,
                                    feeding_day: day,
                                    age_days: null,
                                  });
                                }}
                                min={1}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <Label>From day</Label>
                                <Input
                                  type="number"
                                  value={it.start_day ?? it.feeding_day ?? ""}
                                  onChange={(e) => {
                                    const start = Number(e.target.value) || 1;
                                    const wasSingleDay =
                                      it.end_day != null &&
                                      Number(it.end_day) === Number(it.start_day ?? it.feeding_day);
                                    updateItem(idx, {
                                      start_day: start,
                                      feeding_day: start,
                                      age_days: null,
                                      end_day:
                                        it.end_day === null
                                          ? null
                                          : wasSingleDay
                                            ? start
                                            : Number(it.end_day ?? start),
                                    });
                                  }}
                                  min={1}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>To day</Label>
                                <Input
                                  type="number"
                                  value={it.end_day ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    updateItem(idx, {
                                      end_day: raw === "" ? null : Number(raw),
                                      feeding_day: it.start_day ?? it.feeding_day ?? 1,
                                      age_days: null,
                                    });
                                  }}
                                  min={1}
                                  disabled={it.end_day === null && it.start_day != null}
                                  placeholder={it.end_day === null ? "Open-ended" : ""}
                                />
                              </div>
                              <div className="space-y-1 flex items-end pb-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                  <Checkbox
                                    checked={it.end_day === null && it.start_day != null}
                                    onCheckedChange={(checked) => {
                                      const start = Number(it.start_day ?? it.feeding_day ?? 1) || 1;
                                      updateItem(idx, {
                                        start_day: start,
                                        feeding_day: start,
                                        end_day: checked ? null : start,
                                        age_days: null,
                                      });
                                    }}
                                  />
                                  Open-ended (from day onward)
                                </label>
                              </div>
                            </>
                          )}
                          <div className="space-y-1">
                            <Label>Quantity (g/bird/day)</Label>
                            <Input
                              type="number"
                              value={it.quantity ?? ""}
                              onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                              min={0}
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>
                              Feed type (required)
                              {!(Number(it.feed_type_id) > 0) ? (
                                <span className="text-red-600 font-normal"> — select one</span>
                              ) : null}
                            </Label>
                            <Select
                              value={
                                Number(it.feed_type_id) > 0
                                  ? String(it.feed_type_id)
                                  : undefined
                              }
                              onValueChange={(v) =>
                                updateItem(idx, { feed_type_id: Number(v) })
                              }
                            >
                              <SelectTrigger
                                className={
                                  !(Number(it.feed_type_id) > 0)
                                    ? "border-amber-400 ring-1 ring-amber-200"
                                    : undefined
                                }
                              >
                                <SelectValue
                                  placeholder={
                                    feedTypes.length
                                      ? "Select feed type"
                                      : selectedPoultryTypeId
                                        ? "Loading feed types…"
                                        : "Select poultry type first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {feedTypes.map((ft) => (
                                  <SelectItem key={ft.id} value={String(ft.id)}>
                                    {ft.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 md:col-span-3">
                            <div className="flex items-center justify-between">
                              <Label>Feeding times</Label>
                              <Button type="button" variant="outline" size="sm" onClick={() => addFeedingTime(idx)} className="gap-1">
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(it.feeding_times ?? []).length === 0 ? (
                                <div className="text-xs text-gray-500">No time slots yet.</div>
                              ) : null}
                              {(it.feeding_times ?? []).map((t, tIdx) => (
                                <div key={tIdx} className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-5">
                                    <Input
                                      type="time"
                                      value={t.time}
                                      onChange={(e) => updateFeedingTime(idx, tIdx, { time: e.target.value })}
                                    />
                                  </div>
                                  <div className="col-span-5">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step="0.1"
                                      value={t.percentage}
                                      onChange={(e) => updateFeedingTime(idx, tIdx, { percentage: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeFeedingTime(idx, tIdx)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="text-[11px] text-gray-500">
                                Tip: percentages for each day range should typically sum to 100.
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input value={it.name ?? ""} onChange={(e) => updateItem(idx, { name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea
                          value={it.description ?? ""}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Storage instructions</Label>
                        <Textarea
                          value={it.storage_instructions ?? ""}
                          onChange={(e) => updateItem(idx, { storage_instructions: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                {confirmBlockers.length > 0 ? (
                  <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    To confirm: {confirmBlockers.join(" · ")}
                  </div>
                ) : null}
                <div className="flex flex-col md:flex-row gap-3 md:justify-end">
                  <Button variant="outline" onClick={onSaveDraft} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Save Draft
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isConfirming || items.length === 0}
                    className="gap-2"
                  >
                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirm & Generate
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImportScheduleFromDoc;

