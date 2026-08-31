"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Sparkles, Save, Check, X, Wheat } from "lucide-react";
import type { FeedComponent, FeedType, PoultryType } from "@/lib/types";
import {
  getPoultryTypes,
  getFeedTypes,
  getFeedComponents,
  formulateFeed,
  reviseFormulatedFeed,
  createFeedProduct,
  createFeedComposition,
  generateFeedComponentWithAI,
} from "@/lib/request";
import type { FormulationChatMessage, FormulationPayload } from "@/lib/request";
import { ActionGate } from "@/components/general/ActionGate";
import { AiUpgradeNotice } from "@/components/general/AiGate";
import { useSubscription } from "@/hooks/useSubscription";
import { ACTIONS } from "@/lib/actionPermissions";

// ── Parsed formula row ───────────────────────────────────────────────
type FormulaRow = { componentName: string; percentage: number };

// ── Parse AI formula text ────────────────────────────────────────────
function parseFormula(text: string): FormulaRow[] {
  const rows: FormulaRow[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\n/);

  // Find "Proposed Formula" heading
  const headerRe = /proposed\s+formula/i;
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }

  const linesToParse = startIdx >= 0 ? lines.slice(startIdx) : lines;

  const skipStarts = [
    "total",
    "analysis",
    "rationale",
    "note",
    "this",
    "the",
    "remember",
  ];

  for (const raw of linesToParse) {
    let cleaned = raw
      .replace(/\*\*/g, "")
      .trim()
      .replace(/^[-•]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();

    if (!cleaned) continue;

    const match = cleaned.match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*%/);
    if (!match) continue;

    let name = match[1].trim();
    const pct = parseFloat(match[2]);

    name = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

    const lower = name.toLowerCase();
    if (skipStarts.some((sw) => lower.startsWith(sw))) continue;
    if (lower.length > 60) continue;

    if (name && pct > 0 && pct <= 100 && !seen.has(lower)) {
      rows.push({ componentName: name, percentage: pct });
      seen.add(lower);
    }
  }

  // Normalise to 100%
  if (rows.length > 0) {
    const total = rows.reduce((s, r) => s + r.percentage, 0);
    if (total > 0 && Math.abs(total - 100) > 0.01) {
      const factor = 100 / total;
      rows.forEach((r) => (r.percentage = Math.round(r.percentage * factor * 100) / 100));
      const newTotal = rows.reduce((s, r) => s + r.percentage, 0);
      if (Math.abs(newTotal - 100) > 0.01) {
        const diff = 100 - newTotal;
        rows[rows.length - 1].percentage =
          Math.round((rows[rows.length - 1].percentage + diff) * 100) / 100;
      }
    }
  }

  return rows;
}

// ── Main component ───────────────────────────────────────────────────
export default function FeedFormulationPage() {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const { aiEnabled } = useSubscription();

  // Data lists
  const [poultryTypes, setPoultryTypes] = useState<PoultryType[]>([]);
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [allComponents, setAllComponents] = useState<FeedComponent[]>([]);

  // Form state
  const [selectedPoultryTypeId, setSelectedPoultryTypeId] = useState<string>("");
  const [selectedFeedTypeId, setSelectedFeedTypeId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>([]);

  // Target nutritional profile
  const [targetProfile, setTargetProfile] = useState({
    crude_protein: "",
    metabolizable_energy: "",
    crude_fat: "",
    crude_fiber: "",
    calcium: "",
    phosphorus: "",
  });

  // AI results
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [formulaRows, setFormulaRows] = useState<FormulaRow[]>([]);
  const [calculatedProfile, setCalculatedProfile] = useState<Record<string, number> | null>(null);
  const [chatMessages, setChatMessages] = useState<FormulationChatMessage[]>([]);
  const [remodificationMessage, setRemodificationMessage] = useState("");
  const [revising, setRevising] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [productName, setProductName] = useState("");

  // ── Fetch poultry types on mount ──
  useEffect(() => {
    if (!token || !farmId) return;
    (async () => {
      const res = await getPoultryTypes(token, farmId);
      if (res.success && res.data) setPoultryTypes(res.data);
    })();
  }, [token, farmId]);

  // ── Fetch feed types when poultry type changes ──
  useEffect(() => {
    if (!token || !farmId || !selectedPoultryTypeId) {
      setFeedTypes([]);
      return;
    }
    (async () => {
      const res = await getFeedTypes(token, farmId, Number(selectedPoultryTypeId));
      if (res.success && res.data) setFeedTypes(res.data as FeedType[]);
    })();
  }, [token, farmId, selectedPoultryTypeId]);

  // ── Fetch components on mount ──
  useEffect(() => {
    if (!token || !farmId) return;
    (async () => {
      const res = await getFeedComponents(token, farmId, { status: "active" });
      if (res.success && res.data) setAllComponents(res.data);
    })();
  }, [token, farmId]);

  // Derived values
  const selectedFeedType = feedTypes.find((t) => String(t.id) === selectedFeedTypeId);
  const canFormulate = !!selectedFeedTypeId;

  // ── Toggle component selection ──
  const toggleComponent = (id: number) => {
    setSelectedComponentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Calculate nutritional profile from formula rows ──
  const calculateProfileFromRows = (rows: FormulaRow[], comps: FeedComponent[]): Record<string, number> => {
    const nutrients: Record<string, number> = {
      crude_protein: 0,
      crude_fat: 0,
      crude_fiber: 0,
      calcium: 0,
      phosphorus: 0,
      metabolizable_energy: 0,
      moisture: 0,
      ash: 0,
    };

    for (const row of rows) {
      // Match by name (case-insensitive, partial)
      const comp = comps.find(
        (c) =>
          c.name.toLowerCase() === row.componentName.toLowerCase() ||
          c.name.toLowerCase().includes(row.componentName.toLowerCase()) ||
          row.componentName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!comp) continue;

      const pct = row.percentage;
      nutrients.crude_protein += (comp.crude_protein || 0) * pct / 100;
      nutrients.crude_fat += (comp.crude_fat || 0) * pct / 100;
      nutrients.crude_fiber += (comp.crude_fiber || 0) * pct / 100;
      nutrients.calcium += (comp.calcium || 0) * pct / 100;
      nutrients.phosphorus += (comp.phosphorus || 0) * pct / 100;
      nutrients.metabolizable_energy += (comp.metabolizable_energy || 0) * pct / 100;
      nutrients.moisture += (comp.moisture || 0) * pct / 100;
      nutrients.ash += (comp.ash || 0) * pct / 100;
    }

    for (const key in nutrients) {
      nutrients[key] = Math.round(nutrients[key] * 100) / 100;
    }

    return nutrients;
  };

  // ── Handle formulate ──
  const handleFormulate = async () => {
    if (!token || !farmId || !selectedFeedType) return;

    setLoading(true);
    setAiText(null);
    setFormulaRows([]);
    setCalculatedProfile(null);
    setSaved(false);
    setChatMessages([]);
    setRemodificationMessage("");

    const profile: Record<string, number> = {};
    for (const [key, val] of Object.entries(targetProfile)) {
      const num = parseFloat(val);
      if (num > 0) profile[key] = num;
    }

    const payload: FormulationPayload = {
      feed_type_name: selectedFeedType.name + (selectedFeedType.description ? ` (${selectedFeedType.description})` : ""),
      description: description || undefined,
      target_profile: Object.keys(profile).length > 0 ? profile : undefined,
      component_ids: selectedComponentIds.length > 0 ? selectedComponentIds : undefined,
    };

    try {
      const res = await formulateFeed(token, farmId, payload);
      if (res.success && res.data?.ai_available && res.data.ai) {
        const formulaText = res.data.ai.formula || res.data.ai.analysis || "";
        setAiText(formulaText);
        setChatMessages([{ role: "assistant", content: formulaText }]);
        const parsed = parseFormula(formulaText);
        setFormulaRows(parsed);
        setProductName(selectedFeedType.name + " Formula");
        if (parsed.length > 0) {
          // Calculate nutritional profile from the parsed components
          const profile = calculateProfileFromRows(parsed, allComponents);
          setCalculatedProfile(profile);
          toast.success(`Formula generated with ${parsed.length} component(s)`);
        } else {
          toast.warning("Formula generated but could not parse components automatically.");
        }
      } else if (res.success && !res.data?.ai_available) {
        toast.error("AI is not available. Please check your API key configuration.");
      } else {
        toast.error((res.error || []).join(", ") || "Failed to generate formula");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!token || !farmId || !selectedFeedType) return;
    if (!aiText || !aiText.trim()) {
      toast.error("Generate a formula first before applying remodifications.");
      return;
    }
    if (!remodificationMessage.trim()) {
      toast.error("Please enter a remodification message.");
      return;
    }

    // Build numeric profile payload from inputs (same as formulate)
    const profile: Record<string, number> = {};
    for (const [key, val] of Object.entries(targetProfile)) {
      const num = parseFloat(val);
      if (num > 0) profile[key] = num;
    }

    const feedTypeName =
      selectedFeedType.name + (selectedFeedType.description ? ` (${selectedFeedType.description})` : "");

    const userMsg = remodificationMessage.trim();
    const nextMessages: FormulationChatMessage[] = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(nextMessages);
    setRemodificationMessage("");

    setRevising(true);
    try {
      const res = await reviseFormulatedFeed(token, farmId, {
        feed_type_name: feedTypeName,
        description: description || undefined,
        target_profile: Object.keys(profile).length > 0 ? (profile as any) : undefined,
        component_ids: selectedComponentIds.length > 0 ? selectedComponentIds : undefined,
        current_formula_text: aiText,
        message: userMsg,
        messages: nextMessages,
      });

      if (res.success && res.data?.ai_available && res.data.ai) {
        const newText = res.data.ai.formula || res.data.ai.analysis || "";
        setAiText(newText);
        setChatMessages((prev) => [...prev, { role: "assistant", content: newText }]);

        const parsed = parseFormula(newText);
        setFormulaRows(parsed);
        if (parsed.length > 0) {
          const profileNow = calculateProfileFromRows(parsed, allComponents);
          setCalculatedProfile(profileNow);
          toast.success("Formula updated");
        } else {
          setCalculatedProfile(null);
          toast.warning("AI updated the response, but we could not parse components automatically.");
        }
      } else if (res.success && !res.data?.ai_available) {
        toast.error("AI is not available. Please check your API key configuration.");
      } else {
        toast.error((res.error || []).join(", ") || "Failed to revise formula");
      }
    } finally {
      setRevising(false);
    }
  };

  // ── Save as feed product ──
  const handleSave = async () => {
    if (!token || !farmId || formulaRows.length === 0 || !productName.trim()) {
      toast.error("Please provide a product name and have a formula to save.");
      return;
    }
    setSaving(true);
    try {
      // 1. Create the feed product
      const productRes = await createFeedProduct(token, farmId, {
        name: productName.trim(),
        description: description || `AI-formulated ${selectedFeedType?.name || "feed"}`,
        poultry_feed_type_id: selectedFeedType?.id ? Number(selectedFeedType.id) : null,
        status: "active",
        unit: "kg",
      });

      if (!productRes.success || !productRes.data) {
        toast.error("Failed to create product: " + ((productRes.error || []).join(", ")));
        return;
      }

      const newProductId = productRes.data.id;

      // 2. For each formula row, find or generate the component, then create composition
      let successCount = 0;
      for (const row of formulaRows) {
        // Try to find an existing component by name (case-insensitive)
        let component = allComponents.find(
          (c) => c.name.toLowerCase() === row.componentName.toLowerCase()
        );

        // If not found, try to generate via AI
        if (!component) {
          const genRes = await generateFeedComponentWithAI(token, farmId, row.componentName);
          if (genRes.success && genRes.data) {
            component = genRes.data;
            setAllComponents((prev) => [...prev, genRes.data!]);
          } else {
            toast.warning(`Could not find or create component: ${row.componentName}`);
            continue;
          }
        }

        // Create composition entry
        const compRes = await createFeedComposition(token, farmId, newProductId, {
          feed_component_id: component.id,
          percentage: row.percentage,
        });
        if (compRes.success) successCount++;
      }

      toast.success(`Product "${productName}" saved with ${successCount} composition(s).`);
      setSaved(true);
      // Recalculate profile now that any AI-generated components are available
      const updatedProfile = calculateProfileFromRows(formulaRows, allComponents);
      setCalculatedProfile(updatedProfile);
    } catch (err) {
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // ── Component search / filter ──
  const [componentSearch, setComponentSearch] = useState("");
  const filteredComponents = allComponents.filter((c) =>
    c.name.toLowerCase().includes(componentSearch.toLowerCase())
  );

  const header = (
    <div className="flex items-center gap-3">
      <Sparkles className="h-7 w-7 text-amber-500" />
      <div>
        <h1 className="text-2xl font-bold">AI Feed Formulation</h1>
        <p className="text-sm text-muted-foreground">
          Let AI help you create optimal feed formulas tailored to your needs
        </p>
      </div>
    </div>
  );

  if (!aiEnabled) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {header}
        <AiUpgradeNotice />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      {header}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ───────── LEFT: Input Form ───────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Feed Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wheat className="h-4 w-4" /> Feed Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Poultry Type</Label>
                <Select
                  value={selectedPoultryTypeId}
                  onValueChange={(v) => {
                    setSelectedPoultryTypeId(v);
                    setSelectedFeedTypeId("");
                  }}
                >
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

              <div>
                <Label className="text-xs text-muted-foreground">Feed Type / Phase</Label>
                <Select
                  value={selectedFeedTypeId}
                  onValueChange={setSelectedFeedTypeId}
                  disabled={feedTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={feedTypes.length === 0 ? "Select poultry type first" : "Select feed type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {feedTypes.map((ft) => (
                      <SelectItem key={ft.id} value={String(ft.id)}>
                        {ft.name} {ft.description ? `(${ft.description})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description / Requirements (optional)</Label>
                <Textarea
                  placeholder="e.g. cost-effective, high-energy, for hot climate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Nutritional Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Target Nutritional Profile (optional)</CardTitle>
              <p className="text-xs text-muted-foreground">Leave blank to let AI decide optimal values</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["crude_protein", "Crude Protein (%)", "22.0"],
                  ["metabolizable_energy", "ME (kcal/kg)", "3100"],
                  ["crude_fat", "Crude Fat (%)", "6.0"],
                  ["crude_fiber", "Crude Fiber (%)", "3.0"],
                  ["calcium", "Calcium (%)", "1.0"],
                  ["phosphorus", "Phosphorus (%)", "0.65"],
                ] as [keyof typeof targetProfile, string, string][]).map(([key, label, ph]) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={ph}
                      value={targetProfile[key]}
                      onChange={(e) =>
                        setTargetProfile((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="text-sm h-8"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Component Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Components (optional)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pick ingredients you want included; AI may add more if needed
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Search components..."
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                className="text-sm h-8"
              />
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {filteredComponents.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No components found</p>
                )}
                {filteredComponents.map((c) => {
                  const selected = selectedComponentIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleComponent(c.id)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                        selected
                          ? "bg-green-50 border border-green-300 text-green-800"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {selected && <Check className="h-3 w-3 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {selectedComponentIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedComponentIds.map((id) => {
                    const comp = allComponents.find((c) => c.id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-red-100"
                        onClick={() => toggleComponent(id)}
                      >
                        {comp?.name ?? id}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulate Button */}
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700"
            size="lg"
            disabled={!canFormulate || loading}
            onClick={handleFormulate}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Formulating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Formulate Feed
              </>
            )}
          </Button>
        </div>

        {/* ───────── RIGHT: Results ───────── */}
        <div className="lg:col-span-2 space-y-4">
          {!aiText && !loading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground space-y-2 p-8">
                <Sparkles className="h-12 w-12 mx-auto opacity-20" />
                <p className="text-lg font-medium">Ready to Formulate</p>
                <p className="text-sm max-w-md">
                  Select a feed type, optionally provide a target nutritional profile and
                  components, then click <strong>Formulate Feed</strong> to let AI generate an
                  optimal formula.
                </p>
              </div>
            </Card>
          )}

          {loading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-3 p-8">
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-amber-500" />
                <p className="text-lg font-medium">Generating Formula...</p>
                <p className="text-sm text-muted-foreground">
                  AI is calculating the optimal formula. This may take a moment.
                </p>
              </div>
            </Card>
          )}

          {aiText && !loading && (
            <>
              {/* Parsed Formula Table */}
              {formulaRows.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Generated Formula</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {formulaRows.length} component(s) | Total:{" "}
                        {formulaRows.reduce((s, r) => s + r.percentage, 0).toFixed(2)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">Component</TableHead>
                          <TableHead className="text-xs text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formulaRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="text-sm font-medium">{row.componentName}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{row.percentage.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Calculated Nutritional Profile */}
              {calculatedProfile && formulaRows.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Calculated Nutritional Profile</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Estimated values based on matched component data
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {([
                        ["crude_protein", "Crude Protein", "%"],
                        ["metabolizable_energy", "Metab. Energy", " kcal/kg"],
                        ["crude_fat", "Crude Fat", "%"],
                        ["crude_fiber", "Crude Fiber", "%"],
                        ["calcium", "Calcium", "%"],
                        ["phosphorus", "Phosphorus", "%"],
                        ["moisture", "Moisture", "%"],
                        ["ash", "Ash", "%"],
                      ] as [string, string, string][]).map(([key, label, unit]) => {
                        const val = calculatedProfile[key];
                        return (
                          <div key={key} className="rounded-lg border p-3 text-center bg-gradient-to-br from-white to-slate-50">
                            <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {val != null && val > 0 ? `${val}${unit}` : "-"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {/* Unmatched warning */}
                    {(() => {
                      const unmatched = formulaRows.filter(
                        (row) =>
                          !allComponents.some(
                            (c) =>
                              c.name.toLowerCase() === row.componentName.toLowerCase() ||
                              c.name.toLowerCase().includes(row.componentName.toLowerCase()) ||
                              row.componentName.toLowerCase().includes(c.name.toLowerCase())
                          )
                      );
                      if (unmatched.length === 0) return null;
                      return (
                        <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-700">
                          <strong>Note:</strong> {unmatched.length} component(s) could not be matched
                          to existing data for calculation:{" "}
                          {unmatched.map((u) => u.componentName).join(", ")}.
                          Saving the formula will auto-generate missing components via AI.
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Save Section */}
              {formulaRows.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Save as Feed Product</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Save this formula as a new feed product with its compositions
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Product Name</Label>
                      <Input
                        placeholder="Enter product name..."
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="text-sm"
                        disabled={saved}
                      />
                    </div>
                    <ActionGate anyOf={ACTIONS.feedProducts.create}>
                      <Button
                        onClick={handleSave}
                        disabled={saving || saved || !productName.trim()}
                        className={saved ? "bg-green-600 hover:bg-green-600" : ""}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : saved ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved Successfully
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save as Feed Product
                          </>
                        )}
                      </Button>
                    </ActionGate>
                  </CardContent>
                </Card>
              )}

              {/* Full AI Analysis / Response */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI Analysis & Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap overflow-auto max-h-[500px] bg-gray-50 rounded-lg p-4">
                    {aiText}
                  </div>
                </CardContent>
              </Card>

              {/* Remodification Chat */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Remodify with AI</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Describe the changes you want (e.g. “reduce soy, increase energy, keep total 100%”).
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-h-64 overflow-auto rounded-lg border bg-white p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No messages yet.</p>
                    ) : (
                      chatMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                            m.role === "user"
                              ? "bg-blue-50 border border-blue-100"
                              : "bg-slate-50 border border-slate-100"
                          }`}
                        >
                          <div className="text-[11px] mb-1 text-muted-foreground">
                            {m.role === "user" ? "You" : "AI"}
                          </div>
                          {m.content}
                        </div>
                      ))
                    )}
                  </div>

                  <Textarea
                    value={remodificationMessage}
                    onChange={(e) => setRemodificationMessage(e.target.value)}
                    placeholder="Type your remodification message..."
                    rows={3}
                    className="text-sm"
                    disabled={revising || loading}
                  />
                  <Button
                    onClick={handleRevise}
                    disabled={revising || loading || !aiText}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {revising ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying changes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Apply Remodification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
