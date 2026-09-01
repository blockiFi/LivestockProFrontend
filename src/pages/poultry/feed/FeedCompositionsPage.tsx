"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calculator, Trash2, Wheat, Save, X } from "lucide-react";
import type { FeedComponent, FeedComposition, PoultryFeedProduct } from "@/lib/types";
import {
  calculateFeedNutrition,
  createFeedComposition,
  deleteFeedComposition,
  getFeedComponents,
  getFeedCompositions,
  getFeedProducts,
  createFeedProduct,
  updateFeedProduct,
  deleteFeedProduct,
  analyzeFeedFormula,
  recommendFeedFormula,
  generateFeedComponentWithAI,
} from "@/lib/request";
import AddFeedCompositionModal from "@/components/modals/AddFeedCompositionModal";
import AddFeedProductModal from "@/components/modals/AddFeedProductModal";
import { ActionGate } from "@/components/general/ActionGate";
import { AiUpgradeNotice } from "@/components/general/AiGate";
import { useSubscription } from "@/hooks/useSubscription";
import { ACTIONS } from "@/lib/actionPermissions";

function fmt(v?: number | null, suffix = "") {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n}${suffix}`;
}

// Helper to create a temporary composition ID for local editing
let tempIdCounter = -1;
function getTempId() {
  return tempIdCounter--;
}

export default function FeedCompositionsPage() {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const { aiEnabled } = useSubscription();

  const [products, setProducts] = useState<PoultryFeedProduct[]>([]);
  const [components, setComponents] = useState<FeedComponent[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [compositions, setCompositions] = useState<FeedComposition[]>([]); // Saved compositions from backend
  const [localCompositions, setLocalCompositions] = useState<FeedComposition[]>([]); // In-memory changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [calculatedNutrition, setCalculatedNutrition] = useState<Record<string, number> | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [editPct, setEditPct] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PoultryFeedProduct | null>(null);

  const [aiLoading, setAiLoading] = useState<"analyze" | "recommend" | null>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState<string | null>(null);
  const [aiRecommendationText, setAiRecommendationText] = useState<string | null>(null);
  const [parsedRecommendations, setParsedRecommendations] = useState<Array<{ componentName: string; percentage: number }>>([]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Allow managing if product is selected and belongs to current farm (not system-wide or other farms)
  const canManageSelectedProduct = !!selectedProductId && selectedProduct && selectedProduct.farm_id === farmId;
  
  // Allow adding components only if product belongs to current farm
  const canAddComponent = !!selectedProductId && selectedProduct && selectedProduct.farm_id === farmId;

  // Calculate total percentage from local compositions
  const totalPercent = useMemo(
    () => localCompositions.reduce((s, c) => s + (Number(c.percentage) || 0), 0),
    [localCompositions]
  );

  const percentBadge = useMemo(() => {
    const diff = Math.abs(totalPercent - 100);
    if (diff <= 0.01) return <Badge className="bg-green-100 text-green-800 border-green-200">100%</Badge>;
    if (totalPercent > 100) return <Badge className="bg-red-100 text-red-800 border-red-200">{totalPercent.toFixed(2)}%</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{totalPercent.toFixed(2)}%</Badge>;
  }, [totalPercent]);

  // Calculate nutrition in memory from local compositions
  // Uses editPct values if available (for real-time updates while editing)
  const calculateNutritionInMemory = (comps: FeedComposition[]) => {
    if (!selectedProduct || comps.length === 0) {
      setCalculatedNutrition(null);
      return;
    }

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

    for (const comp of comps) {
      const component = components.find(c => c.id === comp.feed_component_id);
      if (!component) continue;
      
      // Use editPct value if editing, otherwise use comp.percentage
      const pctValue = editPct[comp.id] !== undefined 
        ? Number(editPct[comp.id]) 
        : (Number(comp.percentage) || 0);
      
      const pct = Number.isFinite(pctValue) && pctValue > 0 ? pctValue : 0;
      if (pct <= 0) continue;

      nutrients.crude_protein += (component.crude_protein || 0) * pct / 100;
      nutrients.crude_fat += (component.crude_fat || 0) * pct / 100;
      nutrients.crude_fiber += (component.crude_fiber || 0) * pct / 100;
      nutrients.calcium += (component.calcium || 0) * pct / 100;
      nutrients.phosphorus += (component.phosphorus || 0) * pct / 100;
      nutrients.metabolizable_energy += (component.metabolizable_energy || 0) * pct / 100;
      nutrients.moisture += (component.moisture || 0) * pct / 100;
      nutrients.ash += (component.ash || 0) * pct / 100;
    }

    // Round to 2 decimals
    for (const key in nutrients) {
      nutrients[key] = Math.round(nutrients[key] * 100) / 100;
    }

    setCalculatedNutrition(nutrients);
  };

  const loadBase = async () => {
    if (!token || !farmId) return;
    const [prodRes, compRes] = await Promise.all([
      getFeedProducts(token, farmId),
      getFeedComponents(token, farmId, { status: "active" }),
    ]);

    if (prodRes.success) setProducts((prodRes.data as any) || []);
    else toast.error((prodRes.error || []).join(", ") || "Failed to load feed products");

    if (compRes.success) setComponents(compRes.data || []);
    else toast.error((compRes.error || []).join(", ") || "Failed to load feed components");

    // default selection
    const first = (prodRes as any).data?.[0];
    if (first && !selectedProductId) setSelectedProductId(first.id);
  };

  const loadCompositions = async (productId: number) => {
    if (!token || !farmId) return;
    const res = await getFeedCompositions(token, farmId, productId);
    if (res.success) {
      const loaded = res.data || [];
      setCompositions(loaded);
      setLocalCompositions(loaded.map(c => ({ ...c }))); // Copy for local editing
      const init: Record<number, string> = {};
      for (const c of loaded) init[c.id] = String(c.percentage ?? "");
      setEditPct(init);
      setHasUnsavedChanges(false);
      calculateNutritionInMemory(loaded);
      // Clear AI recommendations when loading new product
      setAiAnalysisText(null);
      setAiRecommendationText(null);
      setParsedRecommendations([]);
    } else {
      toast.error((res.error || []).join(", ") || "Failed to load composition");
    }
  };

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, farmId]);

  useEffect(() => {
    if (selectedProductId) loadCompositions(selectedProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  // Recalculate nutrition when local compositions, components, or editPct changes
  useEffect(() => {
    calculateNutritionInMemory(localCompositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCompositions, components, selectedProduct, editPct]);

  const filteredCompositions = useMemo(() => {
    const s = filter.trim().toLowerCase();
    if (!s) return localCompositions;
    return localCompositions.filter((c) => {
      const component = components.find(comp => comp.id === c.feed_component_id);
      return (component?.name || "").toLowerCase().includes(s);
    });
  }, [localCompositions, filter, components]);

  // Add component to local memory (not saved yet)
  const handleAddLocal = (payload: { feed_component_id: number; percentage: number }) => {
    if (!canAddComponent) {
      toast.error("You can only add components to products that belong to your farm");
      return;
    }

    const component = components.find(c => c.id === payload.feed_component_id);
    if (!component) {
      toast.error("Component not found");
      return;
    }

    // Check if component already exists
    const existing = localCompositions.find(c => c.feed_component_id === payload.feed_component_id);
    if (existing) {
      toast.error("Component already added. Update the percentage instead.");
      return;
    }

    const newComp: FeedComposition = {
      id: getTempId(), // Temporary ID for local editing
      poultry_feed_product_id: selectedProductId!,
      feed_component_id: payload.feed_component_id,
      percentage: payload.percentage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      component: component,
    };

    setLocalCompositions(prev => [...prev, newComp]);
    setEditPct(prev => ({ ...prev, [newComp.id]: String(payload.percentage) }));
    setHasUnsavedChanges(true);
    setIsAddOpen(false);
  };

  // Save all local changes to backend
  const handleSaveAll = async () => {
    if (!token || !farmId || !selectedProductId) return;

    if (!canManageSelectedProduct) {
      toast.error("You can only save compositions for products that belong to your farm");
      return;
    }

    if (localCompositions.length === 0) {
      toast.error("No compositions to save. Add components first.");
      return;
    }

    try {
      // Delete all existing compositions first
      for (const comp of compositions) {
        await deleteFeedComposition(token, farmId, selectedProductId, comp.id);
      }

      // Create all local compositions
      for (const comp of localCompositions) {
        // Validate composition data before sending
        if (!comp.feed_component_id || comp.feed_component_id <= 0) {
          toast.error(`Invalid component ID for composition: ${comp.id}`);
          continue;
        }
        if (comp.percentage === undefined || comp.percentage === null || comp.percentage < 0 || comp.percentage > 100) {
          toast.error(`Invalid percentage for composition: ${comp.id}`);
          continue;
        }

        const payload = {
          feed_component_id: Number(comp.feed_component_id),
          percentage: Number(comp.percentage),
        };

        await createFeedComposition(token, farmId, selectedProductId, payload);
      }

      // Calculate and update nutrition in backend
      const calcRes = await calculateFeedNutrition(token, farmId, selectedProductId);
      if (calcRes.success) {
        const updated = calcRes.data?.product;
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      }

      toast.success("Composition saved successfully");
      setHasUnsavedChanges(false);
      await loadCompositions(selectedProductId); // Reload to get real IDs
    } catch (error: any) {
      toast.error(error?.message || "Failed to save composition");
    }
  };

  const handleDeleteLocal = (compositionId: number) => {
    if (!canManageSelectedProduct) {
      toast.error("You can only delete compositions for products that belong to your farm");
      return;
    }
    setLocalCompositions(prev => prev.filter(c => c.id !== compositionId));
    setEditPct(prev => {
      const next = { ...prev };
      delete next[compositionId];
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleUpdatePctLocal = (compositionId: number, percentage: number) => {
    if (!canManageSelectedProduct) {
      toast.error("You can only edit compositions for products that belong to your farm");
      return;
    }
    setLocalCompositions(prev => prev.map(c => 
      c.id === compositionId ? { ...c, percentage } : c
    ));
    setEditPct(prev => ({ ...prev, [compositionId]: String(percentage) }));
    setHasUnsavedChanges(true);
  };

  const handleSavePct = (compositionId: number) => {
    const pct = Number(editPct[compositionId]);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }
    handleUpdatePctLocal(compositionId, pct);
  };

  const handleCalculate = async () => {
    if (!token || !farmId || !selectedProductId) return;
    const res = await calculateFeedNutrition(token, farmId, selectedProductId);
    if (res.success) {
      toast.success("Nutrition calculated");
      const updated = res.data?.product;
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      }
    } else {
      toast.error((res.error || []).join(", ") || "Failed to calculate nutrition");
    }
  };

  const handleUpsertProduct = async (payload: Partial<PoultryFeedProduct>) => {
    if (!token || !farmId) return;
    if (editingProduct) {
      const res = await updateFeedProduct(token, farmId, editingProduct.id, payload);
      if (res.success && res.data) {
        toast.success("Feed product updated");
        const updated = res.data;
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        setIsProductModalOpen(false);
        setEditingProduct(null);
      } else {
        const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
        toast.error(msg);
        throw new Error(msg);
      }
    } else {
      const res = await createFeedProduct(token, farmId, payload);
      if (res.success && res.data) {
        toast.success("Feed product created");
        const newProduct = res.data;
        setProducts((prev) => [...prev, newProduct]);
        setSelectedProductId(newProduct.id);
        setIsProductModalOpen(false);
      } else {
        const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
        toast.error(msg);
        throw new Error(msg);
      }
    }
  };

  const handleDeleteProduct = async () => {
    if (!token || !farmId || !selectedProductId) return;
    const res = await deleteFeedProduct(token, farmId, selectedProductId);
    if (res.success) {
      toast.success("Feed product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== selectedProductId));
      setSelectedProductId(null);
      setCompositions([]);
      setLocalCompositions([]);
    } else {
      toast.error((res.error || []).join(", ") || "Failed to delete feed product");
    }
  };

  const handleAnalyze = async () => {
    if (!token || !farmId || !selectedProductId) return;
    setAiLoading("analyze");
    try {
      const res = await analyzeFeedFormula(token, farmId, selectedProductId);
      if (res.success) {
        const profile = res.data?.nutritional_profile ?? {};
        const aiNote = res.data?.ai_analysis ?? null;
        // Build analysis text: nutritional profile + AI note
        let text = "Nutritional Profile:\n" + JSON.stringify(profile, null, 2);
        if (aiNote) {
          text += "\n\n--- AI Analysis ---\n" + aiNote;
        }
        setAiAnalysisText(text);
        toast.success("Formula analysed");
      } else {
        toast.error((res.error || []).join(", ") || "Failed to analyse formula");
      }
    } finally {
      setAiLoading(null);
    }
  };

  // Parse recommendation text to extract component names and percentages
  const parseRecommendation = (text: string): Array<{ componentName: string; percentage: number }> => {
    let recommendations: Array<{ componentName: string; percentage: number }> = [];
    const seen = new Set<string>();
    const lines = text.split(/\n/);

    // ── Step 1: Isolate the formula section ──────────────────────────
    // Find a header like "Improved Formula", "Proposed Formula", etc.
    const formulaHeaderRe = /(?:improved|proposed|recommended|suggested|new|revised|optimized)\s+formula/i;
    let formulaStartIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (formulaHeaderRe.test(lines[i])) {
        formulaStartIdx = i + 1;
        break;
      }
    }

    // Collect formula-section lines; stop when we hit a trailing paragraph or new section
    const formulaLines: string[] = [];
    if (formulaStartIdx >= 0) {
      for (let i = formulaStartIdx; i < lines.length; i++) {
        const stripped = lines[i].replace(/\*\*/g, "").trim();
        if (!stripped) continue;
        // Stop at a new section header, rationale, note, or trailing explanatory paragraph
        if (/^(?:#{1,3}\s)/i.test(stripped)) break;
        if (/^(?:Rationale|Note:|This\s+(?:revised|improved|new|formula)|The\s+(?:revised|improved|inclusion|formula))/i.test(stripped)) break;
        // Stop if line starts with a numbered top-level section like "4)" that isn't a formula item
        if (/^\d+\)\s/.test(stripped) && !/^\d+\)\s*[A-Z].*:\s*\d/.test(stripped)) break;
        formulaLines.push(lines[i]);
      }
    }

    // Fall back to all lines if we couldn't isolate the formula section
    const linesToParse = formulaLines.length > 0 ? formulaLines : lines;

    // ── Step 2: Parse each candidate line ────────────────────────────
    const skipNameStarts = ["total", "analysis", "rationale", "improvements", "note", "balance", "suggested", "this", "the"];
    const skipNameContains = [/crude\s/i, /metabolizable/i, /calcium\s+is/i, /phosphorus\s+is/i, /fiber\s+is/i, /moisture\s+is/i, /energy\s+level/i, /protein\s+level/i];

    for (const rawLine of linesToParse) {
      // Pre-clean: strip markdown formatting and list markers
      let cleaned = rawLine
        .replace(/\*\*/g, "")        // remove bold markers
        .replace(/(?<!\w)\*(?!\w)/g, "") // remove stray italic markers (not in words)
        .trim()
        .replace(/^[-•]\s*/, "")     // remove bullet markers
        .replace(/^\d+[.)]\s*/, "")  // remove numbered list markers
        .trim();

      if (!cleaned) continue;

      // Match "ComponentName: number%" — grab everything before the LAST ": number%"
      const match = cleaned.match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*%/);
      if (!match) continue;

      let name = match[1].trim();
      const pct = parseFloat(match[2]);

      // Remove parenthetical content: (44% CP), (DCP), (Calcium Carbonate), (ME), etc.
      name = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

      // Skip analysis keywords and summary text
      const lowerName = name.toLowerCase();
      if (skipNameStarts.some(sw => lowerName.startsWith(sw))) continue;
      if (skipNameContains.some(re => re.test(name))) continue;
      if (lowerName.length > 60) continue; // analysis sentences are long

      if (name && pct > 0 && pct <= 100 && !seen.has(lowerName)) {
        recommendations.push({ componentName: name, percentage: pct });
        seen.add(lowerName);
      }
    }

    // ── Step 3: Normalise to 100% ───────────────────────────────────
    if (recommendations.length > 0) {
      const total = recommendations.reduce((sum, r) => sum + r.percentage, 0);
      if (total > 0 && Math.abs(total - 100) > 0.01) {
        const factor = 100 / total;
        recommendations = recommendations.map(r => ({
          ...r,
          percentage: Math.round(r.percentage * factor * 100) / 100,
        }));
        const newTotal = recommendations.reduce((sum, r) => sum + r.percentage, 0);
        if (Math.abs(newTotal - 100) > 0.01 && recommendations.length > 0) {
          const diff = 100 - newTotal;
          recommendations[recommendations.length - 1].percentage =
            Math.round((recommendations[recommendations.length - 1].percentage + diff) * 100) / 100;
        }
      }
    }

    return recommendations;
  };

  const handleRecommend = async () => {
    if (!token || !farmId || !selectedProductId) return;
    setAiLoading("recommend");
    try {
      const res = await recommendFeedFormula(token, farmId, selectedProductId);
      if (res.success) {
        const ai = res.data?.ai;
        let recommendationText = "";
        if (ai && typeof ai.recommendation === "string") {
          recommendationText = ai.recommendation;
        } else if (typeof ai === "string") {
          recommendationText = ai;
        } else {
          recommendationText = "AI recommendation received, but format was unexpected.";
        }
        setAiRecommendationText(recommendationText);
        
        // Parse the recommendation to extract components
        const parsed = parseRecommendation(recommendationText);
        setParsedRecommendations(parsed);
        
        if (parsed.length > 0) {
          toast.success(`AI recommendation generated. Parsed ${parsed.length} component(s).`);
        } else {
          toast.warning("AI recommendation generated, but could not parse components. Please check the format.");
          console.log("Recommendation text:", recommendationText);
          console.log("Parsed components:", parsed);
        }
      } else {
        toast.error((res.error || []).join(", ") || "Failed to get recommendation");
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleImplementRecommendation = async () => {
    if (!canManageSelectedProduct || !token || !farmId) {
      toast.error("You can only implement recommendations for products that belong to your farm");
      return;
    }

    if (parsedRecommendations.length === 0) {
      toast.error("No recommendations to implement. Please generate a recommendation first.");
      return;
    }

    // Match parsed recommendations to actual components
    const newCompositions: FeedComposition[] = [];
    const newEditPct: Record<number, string> = {};
    let addedCount = 0;
    let aiGeneratedCount = 0;
    let notFound: string[] = [];
    const usedComponentIds = new Set<number>();

    // First pass: match existing components
    for (const rec of parsedRecommendations) {
      // Try to find component by name (case-insensitive, partial match)
      const component = components.find(
        (c) => !usedComponentIds.has(c.id) && (
          c.name.toLowerCase().includes(rec.componentName.toLowerCase()) ||
          rec.componentName.toLowerCase().includes(c.name.toLowerCase())
        )
      );

      if (component) {
        const newComp: FeedComposition = {
          id: getTempId(),
          poultry_feed_product_id: selectedProductId!,
          feed_component_id: component.id,
          percentage: rec.percentage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          component: component,
        };
        newCompositions.push(newComp);
        newEditPct[newComp.id] = String(rec.percentage);
        usedComponentIds.add(component.id);
        addedCount++;
      } else {
        notFound.push(rec.componentName);
      }
    }

    // Second pass: Generate missing components using AI
    if (notFound.length > 0) {
      toast.info(`Generating ${notFound.length} component(s) using AI...`);
      
      for (const componentName of notFound) {
        try {
          // Generate component using AI
          const genRes = await generateFeedComponentWithAI(token, farmId, componentName);
          
          if (genRes.success && genRes.data) {
            const aiComponent = genRes.data;
            
            // Add to components list
            setComponents(prev => [...prev, aiComponent]);
            
            // Find the recommendation for this component
            const rec = parsedRecommendations.find(r => r.componentName === componentName);
            if (rec) {
              const newComp: FeedComposition = {
                id: getTempId(),
                poultry_feed_product_id: selectedProductId!,
                feed_component_id: aiComponent.id,
                percentage: rec.percentage,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                component: aiComponent,
              };
              newCompositions.push(newComp);
              newEditPct[newComp.id] = String(rec.percentage);
              usedComponentIds.add(aiComponent.id);
              addedCount++;
              aiGeneratedCount++;
            }
          } else {
            console.error(`Failed to generate component "${componentName}":`, genRes.error);
          }
        } catch (error: any) {
          console.error(`Error generating component "${componentName}":`, error);
        }
      }
    }

    // Batch update state
    if (addedCount > 0) {
      setLocalCompositions(newCompositions);
      setEditPct(newEditPct);
      setHasUnsavedChanges(true);
      
      let message = `Added ${addedCount} component(s) from recommendation`;
      if (aiGeneratedCount > 0) {
        message += ` (${aiGeneratedCount} generated using AI)`;
      }
      toast.success(message);
    } else {
      toast.error("Could not match or generate any recommended components.");
    }
  };

  // Use calculated nutrition from memory, or fall back to product's saved nutrition
  const displayNutrition = calculatedNutrition || (selectedProduct ? {
    crude_protein: selectedProduct.crude_protein,
    crude_fat: selectedProduct.crude_fat,
    crude_fiber: selectedProduct.crude_fiber,
    calcium: selectedProduct.calcium,
    phosphorus: selectedProduct.phosphorus,
    metabolizable_energy: selectedProduct.metabolizable_energy,
    moisture: selectedProduct.moisture,
    ash: selectedProduct.ash,
  } : null);

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed Composition</h1>
          <p className="text-gray-600">Reference table for each feed product and its ingredient composition.</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionGate anyOf={ACTIONS.feedProducts.create}>
            <Button variant="outline" onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Feed Product
            </Button>
          </ActionGate>
          <Button variant="outline" onClick={handleCalculate} disabled={!canManageSelectedProduct}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Nutrition
          </Button>
          <ActionGate anyOf={ACTIONS.feedProducts.update}>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleSaveAll} 
              disabled={!hasUnsavedChanges || !canManageSelectedProduct}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Composition
            </Button>
          </ActionGate>
          <ActionGate anyOf={ACTIONS.feedProducts.create}>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddOpen(true)} disabled={!canAddComponent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </ActionGate>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">You have unsaved changes. Click "Save Composition" to save them.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedProductId) loadCompositions(selectedProductId);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Discard
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Feed Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedProductId == null ? "" : String(selectedProductId)}
              onValueChange={(v) => {
                if (hasUnsavedChanges) {
                  if (!confirm("You have unsaved changes. Discard them?")) return;
                }
                setSelectedProductId(Number(v));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feed product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total %</span>
              {percentBadge}
            </div>

            {selectedProduct && (
              <div className="rounded-lg border border-gray-100 p-4 space-y-2 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Wheat className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-500">Nutritional profile {calculatedNutrition ? "(calculated)" : "(saved)"}</p>
                    {!canManageSelectedProduct && (
                      <p className="text-xs text-amber-600 mt-1">This product belongs to another farm. You can view but not edit.</p>
                    )}
                  </div>
                  {canManageSelectedProduct && (
                    <div className="flex gap-1">
                      <ActionGate anyOf={ACTIONS.feedProducts.update}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingProduct(selectedProduct); setIsProductModalOpen(true); }}
                        >
                          Edit
                        </Button>
                      </ActionGate>
                      <ActionGate anyOf={ACTIONS.feedProducts.delete}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={handleDeleteProduct}
                        >
                          Delete
                        </Button>
                      </ActionGate>
                    </div>
                  )}
                </div>
                {displayNutrition && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[11px] text-gray-500">Crude Protein</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.crude_protein, "%")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Metab. Energy</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.metabolizable_energy, " kcal/kg")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Crude Fat</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.crude_fat, "%")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Crude Fiber</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.crude_fiber, "%")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Calcium</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.calcium, "%")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Phosphorus</p>
                      <p className="font-medium text-gray-800">{fmt(displayNutrition.phosphorus, "%")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Composition Table</CardTitle>
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search components..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCompositions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No components added yet.</p>
                <p className="text-sm mt-1">Click "Add Component" to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompositions.map((comp) => {
                    const component = components.find(c => c.id === comp.feed_component_id);
                    const isEditing = editPct[comp.id] !== undefined;
                    const currentPct = isEditing ? editPct[comp.id] : String(comp.percentage ?? "");

                    return (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">
                          {component?.name || `Component #${comp.feed_component_id}`}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={currentPct}
                                onChange={(e) => setEditPct(prev => ({ ...prev, [comp.id]: e.target.value }))}
                                className="w-24"
                                disabled={!canManageSelectedProduct}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSavePct(comp.id);
                                  } else if (e.key === "Escape") {
                                    setEditPct(prev => {
                                      const next = { ...prev };
                                      delete next[comp.id];
                                      return next;
                                    });
                                  }
                                }}
                              />
                              <ActionGate anyOf={ACTIONS.feedProducts.update}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSavePct(comp.id)}
                                  disabled={!canManageSelectedProduct}
                                >
                                  Save
                                </Button>
                              </ActionGate>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{comp.percentage}%</span>
                              <ActionGate anyOf={ACTIONS.feedProducts.update}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditPct(prev => ({ ...prev, [comp.id]: String(comp.percentage ?? "") }))}
                                  disabled={!canManageSelectedProduct}
                                >
                                  Edit
                                </Button>
                              </ActionGate>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionGate anyOf={ACTIONS.feedProducts.delete}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteLocal(comp.id)}
                              disabled={!canManageSelectedProduct}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ActionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      {selectedProduct && canManageSelectedProduct && !aiEnabled && <AiUpgradeNotice />}
      {selectedProduct && canManageSelectedProduct && aiEnabled && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">AI Formula Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={aiLoading === "analyze" || !canManageSelectedProduct}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {aiLoading === "analyze" ? "Analyzing..." : "Analyse Formula"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRecommend}
                disabled={aiLoading === "recommend" || !canManageSelectedProduct}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {aiLoading === "recommend" ? "Getting Recommendation..." : "Recommend Better Formula"}
              </Button>
            </div>

            {aiAnalysisText && (
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Analysis Results</h4>
                <div className="text-sm whitespace-pre-wrap overflow-auto max-h-96">{aiAnalysisText}</div>
              </div>
            )}

            {aiRecommendationText && (
              <div className="rounded-lg border border-gray-200 p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">AI Recommendation</h4>
                  <ActionGate anyOf={ACTIONS.feedProducts.create}>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleImplementRecommendation}
                      disabled={!canManageSelectedProduct || parsedRecommendations.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Implement
                    </Button>
                  </ActionGate>
                </div>
                <div className="text-sm whitespace-pre-wrap">{aiRecommendationText}</div>
                {parsedRecommendations.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">
                      Parsed {parsedRecommendations.length} component(s) (Total: {parsedRecommendations.reduce((sum, r) => sum + r.percentage, 0).toFixed(2)}%):
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {parsedRecommendations.map((rec, idx) => (
                        <li key={idx}>
                          {rec.componentName}: {rec.percentage}%
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-amber-600">
                      Could not parse components from recommendation. Please check the format.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AddFeedCompositionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={async (payload) => { handleAddLocal(payload); }}
        components={components}
        currentTotalPercent={totalPercent}
        existingCompositions={localCompositions}
      />

      <AddFeedProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleUpsertProduct}
        editing={editingProduct}
      />

    </div>
  );
}
