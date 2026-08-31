import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PoultryHouse } from "@/lib/types";
import type { PoultryType } from "@/lib/types";
import { toast } from "react-toastify";
import type { HouseCapacityRule } from "@/lib/request";
import { getHouseCapacityRules, updateHouseCapacityRules, getPoultryTypes, getLiterTypes } from "@/lib/request";
import { Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LiterTypeOption = {
  id: number;
  name: string;
};

interface AddHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    payload: Omit<PoultryHouse, "id" | "farm_id" | "created_at" | "updated_at" | "deleted_at">
  ) => Promise<PoultryHouse | void>;
  initialData?: Partial<PoultryHouse>;
  /**
   * Optional: used when duplicating an existing house so capacity rules can be copied
   * into a "create" flow without hitting the backend rules loader.
   */
  initialCapacityRules?: HouseCapacityRule[];
  /**
   * Called after capacity rules are successfully saved/cleared on the backend.
   * Typically used to refresh the parent list.
   */
  onCapacityRulesSaved?: () => Promise<void> | void;
}

const AddHouseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialCapacityRules,
  onCapacityRulesSaved,
}: AddHouseModalProps) => {
  const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const [formData, setFormData] = useState({
    name: "",
    poultry_type_id: "",
    liter_type_id: "",
    capacity: "",
    dimensions: "",
    construction_date: "",
    last_maintenance_date: "",
    status: "empty",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(initialData?.id);
  const [capacityRules, setCapacityRules] = useState<
    Array<{ min_age_days: string; max_age_days: string; capacity: string; openEnded: boolean }>
  >([{ min_age_days: "", max_age_days: "", capacity: "", openEnded: false }]);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [poultryTypeOptions, setPoultryTypeOptions] = useState<PoultryType[]>([]);
  const [literTypeOptions, setLiterTypeOptions] = useState<LiterTypeOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || "",
        poultry_type_id: initialData?.poultry_type_id?.toString() || "",
        liter_type_id: initialData?.liter_type_id?.toString() || "",
        capacity: initialData?.capacity?.toString() || "",
        dimensions: initialData?.dimensions || "",
        construction_date: initialData?.construction_date || "",
        last_maintenance_date: initialData?.last_maintenance_date || "",
        status: initialData?.status || "active",
        notes: initialData?.notes || "",
      });
      setErrors({});
      setIsSubmitting(false);
      setRulesLoaded(false);

      // Reset rule editor state on open.
      // For create: start with 1 empty row.
      // For edit: load from API in the next effect.
      setCapacityRules([{ min_age_days: "", max_age_days: "", capacity: "", openEnded: false }]);

      // If we are duplicating (create-mode without an id), allow copying rules from the source pen.
      if (initialCapacityRules && initialCapacityRules.length > 0 && !initialData?.id) {
        setCapacityRules(
          initialCapacityRules
            .slice()
            .sort((a, b) => a.min_age_days - b.min_age_days)
            .map((r) => ({
              min_age_days: String(r.min_age_days),
              max_age_days: r.max_age_days == null ? "" : String(r.max_age_days),
              capacity: String(r.capacity),
              openEnded: r.max_age_days == null,
            }))
        );
      }
    }
  }, [isOpen, initialData, initialCapacityRules]);

  useEffect(() => {
    const loadTypeOptions = async () => {
      if (!isOpen || !token || !farmId) return;
      setTypesLoading(true);
      try {
        const [poultryRes, literRes] = await Promise.all([getPoultryTypes(token, farmId), getLiterTypes(token)]);

        setPoultryTypeOptions(poultryRes.success && Array.isArray(poultryRes.data) ? poultryRes.data : []);
        setLiterTypeOptions(literRes.success && Array.isArray(literRes.data) ? literRes.data : []);
      } catch {
        setPoultryTypeOptions([]);
        setLiterTypeOptions([]);
      } finally {
        setTypesLoading(false);
      }
    };

    loadTypeOptions();
  }, [isOpen, token, farmId]);

  useEffect(() => {
    const loadRules = async () => {
      if (!isOpen) return;
      if (!isEdit) return;
      if (!token || !farmId || !initialData?.id) return;
      const res = await getHouseCapacityRules(token, farmId, initialData.id);
      if (res.success && Array.isArray(res.data)) {
        setCapacityRules(
          res.data.length
            ? res.data.map((r) => ({
                min_age_days: String(r.min_age_days),
                max_age_days: r.max_age_days == null ? "" : String(r.max_age_days),
                capacity: String(r.capacity),
                openEnded: r.max_age_days == null,
              }))
            : [{ min_age_days: "", max_age_days: "", capacity: "", openEnded: false }]
        );
      }
      setRulesLoaded(true);
    };
    loadRules();
  }, [isOpen, isEdit, token, farmId, initialData?.id]);

  const parsedRules = useMemo(() => {
    return capacityRules
      .map((r) => {
        const minStr = String(r.min_age_days).trim();
        const maxStr = String(r.max_age_days).trim();
        const capStr = String(r.capacity).trim();

        // Ignore incomplete rows (prevents accidental "max=0" from empty string).
        if (!minStr || !capStr) return null;
        if (!r.openEnded && !maxStr) return null;

        const min = Number(minStr);
        const cap = Number(capStr);
        const max = r.openEnded ? null : Number(maxStr);

        if (!Number.isFinite(min) || !Number.isFinite(cap)) return null;
        if (max !== null && !Number.isFinite(max)) return null;

        return { min_age_days: min, max_age_days: max, capacity: cap };
      })
      .filter((r): r is { min_age_days: number; max_age_days: number | null; capacity: number } => r !== null);
  }, [capacityRules]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = "Name is required";
    if (!formData.poultry_type_id) next.poultry_type_id = "Poultry type ID is required";
    if (!formData.liter_type_id) next.liter_type_id = "Litter type ID is required";
    if (!formData.capacity || Number(formData.capacity) <= 0) next.capacity = "Enter a valid capacity";

    // capacity rule validation (create + edit).
    // Rules are optional: if user leaves them blank, we don't save any.
    const hasAnyRuleInput = capacityRules.some((r) => {
      return (
        String(r.min_age_days).trim() !== "" ||
        String(r.max_age_days).trim() !== "" ||
        String(r.capacity).trim() !== "" ||
        r.openEnded
      );
    });

    if (hasAnyRuleInput) {
      const rules = parsedRules;
      if (rules.length < 1) {
        next.capacity_rules = "Complete at least one valid capacity rule (min age, capacity, and max age or ∞)";
      } else {
        const sorted = [...rules].sort((a, b) => a.min_age_days - b.min_age_days);
        let prevMax: number | null = null; // null => infinity (open-ended)
        let hasPrev = false;

        for (const r of sorted) {
          if (r.min_age_days < 0) {
            next.capacity_rules = "Rule range invalid: min age must be >= 0";
            break;
          }
          if (r.capacity <= 0) {
            next.capacity_rules = "Rule invalid: capacity must be >= 1";
            break;
          }
          if (r.max_age_days !== null && r.min_age_days > r.max_age_days) {
            next.capacity_rules = "Rule range invalid: min age must be <= max age (or ∞)";
            break;
          }
          if (hasPrev && prevMax === null) {
            next.capacity_rules = "Rules overlap: an ∞ band must be the last band";
            break;
          }
          if (hasPrev && prevMax !== null && r.min_age_days <= prevMax) {
            next.capacity_rules = "Rules overlap. Ensure bands do not overlap.";
            break;
          }
          prevMax = r.max_age_days;
          hasPrev = true;
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const createdOrUpdated = await onSubmit({
        name: formData.name.trim(),
        poultry_type_id: Number(formData.poultry_type_id),
        liter_type_id: formData.liter_type_id,
        capacity: Number(formData.capacity),
        dimensions: formData.dimensions || null,
        construction_date: formData.construction_date || "",
        last_maintenance_date: formData.last_maintenance_date || null,
        status: formData.status,
        notes: formData.notes || null,
      });

      // Save capacity rules after house exists.
      // Rules are optional: skip if user didn't provide bands.
      const hasAnyRuleInput = capacityRules.some((r) => {
        return (
          String(r.min_age_days).trim() !== "" ||
          String(r.max_age_days).trim() !== "" ||
          String(r.capacity).trim() !== "" ||
          r.openEnded
        );
      });

      const houseIdForRules = isEdit ? initialData?.id : createdOrUpdated?.id;

      if (token && farmId && houseIdForRules != null) {
        if (hasAnyRuleInput) {
          const rulesPayload: HouseCapacityRule[] = parsedRules.map((r) => ({
            min_age_days: r.min_age_days,
            max_age_days: r.max_age_days,
            capacity: r.capacity,
          }));
          const res = await updateHouseCapacityRules(token, farmId, houseIdForRules, rulesPayload);
            if (!res.success) {
              res.error?.forEach((e) => toast.error(e));
            } else {
              await onCapacityRulesSaved?.();
            }
        } else if (isEdit && rulesLoaded) {
          // User cleared the inputs: treat as "remove all rules"
          const res = await updateHouseCapacityRules(token, farmId, houseIdForRules, []);
            if (!res.success) {
              res.error?.forEach((e) => toast.error(e));
            } else {
              await onCapacityRulesSaved?.();
            }
        }
      }

      onClose();
    } catch {
      // errors surfaced via toasts in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit House" : "Add House"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Poultry Type</Label>
              <Select
                value={formData.poultry_type_id}
                onValueChange={(value) => handleChange("poultry_type_id", value)}
                disabled={typesLoading}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue
                    placeholder={
                      typesLoading
                        ? "Loading poultry types..."
                        : "Select poultry type"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {poultryTypeOptions.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={String(t.id)}
                      className="truncate"
                      title={t.name}
                    >
                      <span className="truncate">{t.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.poultry_type_id && (
                <p className="text-xs text-red-500 mt-1">{errors.poultry_type_id}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Litter Type</Label>
              <Select
                value={formData.liter_type_id}
                onValueChange={(value) => handleChange("liter_type_id", value)}
                disabled={typesLoading}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue
                    placeholder={
                      typesLoading ? "Loading litter types..." : "Select litter type"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {literTypeOptions.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={String(t.id)}
                      className="truncate"
                      title={t.name}
                    >
                      <span className="truncate">{t.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.liter_type_id && (
                <p className="text-xs text-red-500 mt-1">{errors.liter_type_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
              {errors.capacity && (
                <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                placeholder="e.g. 10m x 20m"
                value={formData.dimensions}
                onChange={(e) => handleChange("dimensions", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="construction_date">Construction Date</Label>
              <Input
                id="construction_date"
                type="date"
                value={formData.construction_date}
                onChange={(e) => handleChange("construction_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_maintenance_date">Last Maintenance</Label>
              <Input
                id="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date || ""}
                onChange={(e) => handleChange("last_maintenance_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              placeholder="active | inactive | maintenance | empty"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* Age-based capacity rules */}
          <div className="space-y-2 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Age-based capacity rules</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setCapacityRules((p) => [...p, { min_age_days: "", max_age_days: "", capacity: "", openEnded: false }])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add band
                </Button>
              </div>

              {errors.capacity_rules && (
                <p className="text-xs text-red-500">{errors.capacity_rules}</p>
              )}

              <div className="space-y-2">
                {capacityRules.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_110px_40px] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Min age (days)</Label>
                      <Input
                        type="number"
                        value={r.min_age_days}
                        onChange={(e) =>
                          setCapacityRules((p) =>
                            p.map((x, i) => (i === idx ? { ...x, min_age_days: e.target.value } : x))
                          )
                        }
                        placeholder="7"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max age (days)</Label>
                      <Input
                        type="number"
                        value={r.max_age_days}
                        onChange={(e) =>
                          setCapacityRules((p) =>
                            p.map((x, i) => (i === idx ? { ...x, max_age_days: e.target.value } : x))
                          )
                        }
                        placeholder="14"
                        disabled={r.openEnded}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Capacity (birds)</Label>
                      <Input
                        type="number"
                        value={r.capacity}
                        onChange={(e) =>
                          setCapacityRules((p) =>
                            p.map((x, i) => (i === idx ? { ...x, capacity: e.target.value } : x))
                          )
                        }
                        placeholder="200"
                      />
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Checkbox
                        checked={r.openEnded}
                        onCheckedChange={(checked) => {
                          const isChecked = Boolean(checked);
                          setCapacityRules((p) =>
                            p.map((x, i) =>
                              i === idx
                                ? { ...x, openEnded: isChecked, max_age_days: isChecked ? "" : x.max_age_days }
                                : x
                            )
                          );
                        }}
                      />
                      <span className="text-xs text-gray-600 select-none">∞</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCapacityRules((p) => p.filter((_, i) => i !== idx))}
                      disabled={capacityRules.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>

              {isEdit && !rulesLoaded && (
                <p className="text-xs text-muted-foreground">Loading rules…</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddHouseModal;

