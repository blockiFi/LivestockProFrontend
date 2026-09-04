import { useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Download, FileSpreadsheet, Loader2, Trash2, Upload, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { RootState } from "@/store"
import type {
  FlockRecordImportConfirmSummary,
  FlockRecordImportDraft,
  FlockRecordImportItemDraft,
  FlockRecordImportType,
} from "@/lib/types"
import {
  confirmFlockRecordImportDraft,
  createFlockRecordImportDraft,
  deleteFlockRecordImportDraft,
  downloadFlockRecordImportTemplate,
  extractFlockRecordImportDraft,
  updateFlockRecordImportDraft,
} from "@/lib/request"
import BulkImportInstructions from "@/components/poultry/Flocks/bulkImport/BulkImportInstructions"

type Props = {
  isOpen: boolean
  onClose: () => void
  farmId: number
  flockId: number
  onConfirmed?: () => void
}

const RECORD_TYPES: FlockRecordImportType[] = [
  "daily",
  "mortality",
  "eggs",
  "feed_usage",
  "expenditure",
  "flock_sale",
  "product_sale",
]

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  mortality: "Mortality",
  eggs: "Eggs",
  feed_usage: "Feed usage",
  expenditure: "Expenditure",
  flock_sale: "Bird sales",
  product_sale: "Product sales",
}

const EDITABLE_FIELDS: Record<string, string[]> = {
  daily: ["date", "mortality_count", "feed_consumption_kg", "eggs_collected", "notes"],
  mortality: ["date", "mortality_count", "average_weight", "notes"],
  eggs: ["date", "eggs_collected", "eggs_broken", "average_egg_weight", "notes"],
  feed_usage: ["date", "quantity", "poultry_feed_type", "unit_cost"],
  expenditure: ["date", "category", "amount", "description"],
  flock_sale: ["date", "quantity", "unit_price", "customer_name", "notes"],
  product_sale: ["date", "type", "quantity", "unit_price", "customer_name", "notes"],
}

export default function BulkFlockRecordImportSheet({
  isOpen,
  onClose,
  farmId,
  flockId,
  onConfirmed,
}: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const [methodTab, setMethodTab] = useState<"file" | "ai">("file")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [draft, setDraft] = useState<FlockRecordImportDraft | null>(null)
  const [items, setItems] = useState<FlockRecordImportItemDraft[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [activeType, setActiveType] = useState<string>("daily")
  const [summary, setSummary] = useState<FlockRecordImportConfirmSummary | null>(null)

  const counts = useMemo(() => {
    const valid = items.filter((i) => i.status === "valid").length
    const invalid = items.filter((i) => i.status === "invalid").length
    return { valid, invalid, total: items.length }
  }, [items])

  const itemsByType = useMemo(
    () => items.filter((i) => i.record_type === activeType),
    [items, activeType]
  )

  const formatWarning = useMemo(
    () =>
      warnings.some(
        (w) =>
          w.toLowerCase().includes("record_type") ||
          w.toLowerCase().includes("sheets named after record types")
      ),
    [warnings]
  )

  const reset = () => {
    setFile(null)
    setDraft(null)
    setItems([])
    setWarnings([])
    setSummary(null)
    setActiveType("daily")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const applyDraftResponse = (next: FlockRecordImportDraft, nextWarnings?: string[]) => {
    setDraft(next)
    setItems(next.items ?? [])
    if (nextWarnings) setWarnings(nextWarnings)
    const firstWithRows = RECORD_TYPES.find((t) =>
      (next.items ?? []).some((i) => i.record_type === t)
    )
    if (firstWithRows) setActiveType(firstWithRows)
  }

  const handleDownloadTemplate = async () => {
    if (!token) return
    const res = await downloadFlockRecordImportTemplate(token, farmId, flockId)
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to download template")
      return
    }
    const url = URL.createObjectURL(res.data)
    const a = document.createElement("a")
    a.href = url
    a.download = "flock-record-import-template.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!token || !file) return
    setUploading(true)
    setSummary(null)
    const res = await createFlockRecordImportDraft(token, farmId, flockId, file, methodTab)
    setUploading(false)
    if (!res.success || !res.data) {
      toast.error(
        Array.isArray(res.error) ? res.error.join(", ") : res.error || "Upload failed"
      )
      return
    }
    applyDraftResponse(res.data.draft, res.data.warnings ?? [])
    if (methodTab === "ai" && res.data.ai_available === false) {
      toast.warning("AI extraction unavailable — review empty draft or retry")
    } else {
      toast.success("Import draft ready for review")
    }
  }

  const handleExtract = async () => {
    if (!token || !draft) return
    setExtracting(true)
    const res = await extractFlockRecordImportDraft(token, farmId, flockId, draft.id)
    setExtracting(false)
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Extraction failed")
      return
    }
    applyDraftResponse(res.data.draft, res.data.warnings ?? [])
    toast.success("AI extraction refreshed")
  }

  const updateItemField = (itemId: number | undefined, index: number, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        const match = item.id ? item.id === itemId : i === index
        if (!match) return item
        return {
          ...item,
          payload: { ...item.payload, [field]: value },
          status: "pending",
          validation_errors: null,
        }
      })
    )
  }

  const removeItem = (itemId: number | undefined, index: number) => {
    setItems((prev) =>
      prev.filter((item, i) => (item.id ? item.id !== itemId : i !== index))
    )
  }

  const handleSave = async () => {
    if (!token || !draft) return
    setSaving(true)
    const res = await updateFlockRecordImportDraft(token, farmId, flockId, draft.id, {
      items: items.map((item) => ({
        id: item.id,
        record_type: item.record_type,
        payload: item.payload,
        confidence: item.confidence,
      })),
      replace_all: true,
    })
    setSaving(false)
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Failed to save draft")
      return
    }
    applyDraftResponse(res.data)
    toast.success("Draft saved")
  }

  const handleConfirm = async () => {
    if (!token || !draft) return
    setConfirming(true)
    // Persist edits first
    const saveRes = await updateFlockRecordImportDraft(token, farmId, flockId, draft.id, {
      items: items.map((item) => ({
        id: item.id,
        record_type: item.record_type,
        payload: item.payload,
        confidence: item.confidence,
      })),
      replace_all: true,
    })
    if (!saveRes.success || !saveRes.data) {
      setConfirming(false)
      toast.error(saveRes.error?.join(", ") || "Failed to save before confirm")
      return
    }
    applyDraftResponse(saveRes.data)

    const res = await confirmFlockRecordImportDraft(token, farmId, flockId, draft.id)
    setConfirming(false)
    if (!res.success || !res.data) {
      toast.error(res.error?.join(", ") || "Confirm failed")
      return
    }
    applyDraftResponse(res.data.draft)
    setSummary(res.data.summary)
    toast.success(
      `Imported ${res.data.summary.succeeded} row(s); ${res.data.summary.failed} failed; ${res.data.summary.skipped} skipped`
    )
    onConfirmed?.()
  }

  const handleDiscard = async () => {
    if (!token || !draft) {
      handleClose()
      return
    }
    await deleteFlockRecordImportDraft(token, farmId, flockId, draft.id)
    handleClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Bulk upload flock records</SheetTitle>
          <SheetDescription>
            Import daily, mortality, eggs, feed, expenditure, and sales records via spreadsheet or AI.
            Your file must use the template sheet names or include a record_type column.
          </SheetDescription>
        </SheetHeader>

        {!draft && (
          <div className="mt-6 space-y-4">
            <Tabs value={methodTab} onValueChange={(v) => setMethodTab(v as "file" | "ai")}>
              <TabsList>
                <TabsTrigger value="file">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Spreadsheet
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Wand2 className="h-4 w-4 mr-1" />
                  AI assisted
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <BulkImportInstructions defaultOpen />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download template
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-file">Spreadsheet file (.xlsx or .csv)</Label>
                  <Input
                    id="bulk-file"
                    type="file"
                    accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    After upload you can review, edit, and confirm each row before anything is saved
                    to the flock.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Upload a PDF, image, or spreadsheet. AI extracts rows into a reviewable draft.
                  Requires an AI-enabled plan. Always verify dates, quantities, and record types
                  before confirming.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="bulk-ai-file">Document</Label>
                  <Input
                    id="bulk-ai-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading..." : "Upload & parse"}
            </Button>
          </div>
        )}

        {draft && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{draft.source_method === "ai" ? "AI" : "File"}</Badge>
              <span className="text-muted-foreground">{draft.original_filename}</span>
              <Badge className="bg-emerald-600">{counts.valid} valid</Badge>
              <Badge variant="destructive">{counts.invalid} invalid</Badge>
              <span className="text-muted-foreground">{counts.total} total</span>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
                {warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            {(formatWarning || counts.total === 0) && (
              <BulkImportInstructions emphasize defaultOpen />
            )}

            {summary && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm space-y-1">
                <p className="font-medium">Confirm result</p>
                <p>
                  Succeeded {summary.succeeded} · Failed {summary.failed} · Skipped {summary.skipped}
                </p>
                {summary.failures.slice(0, 5).map((f) => (
                  <p key={f.item_id} className="text-red-700">
                    #{f.item_id} ({f.record_type}): {f.error}
                  </p>
                ))}
              </div>
            )}

            <Tabs value={activeType} onValueChange={setActiveType}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {RECORD_TYPES.map((type) => {
                  const n = items.filter((i) => i.record_type === type).length
                  return (
                    <TabsTrigger key={type} value={type} className="text-xs">
                      {TYPE_LABELS[type]} ({n})
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value={activeType} className="mt-4 space-y-3">
                {itemsByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rows for this type.</p>
                ) : (
                  itemsByType.map((item) => {
                    const globalIndex = items.findIndex((i) => i === item)
                    const fields = EDITABLE_FIELDS[item.record_type] ?? ["date"]
                    return (
                      <div
                        key={item.id ?? `${item.record_type}-${item.row_index}`}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.status === "valid" ? "default" : "destructive"}
                              className={item.status === "valid" ? "bg-emerald-600" : undefined}
                            >
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Row {item.row_index + 1}</span>
                          </div>
                          {draft.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id, globalIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {item.validation_errors && item.validation_errors.length > 0 && (
                          <p className="text-xs text-red-600">{item.validation_errors.join(" · ")}</p>
                        )}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {fields.map((field) => (
                            <div key={field} className="space-y-1">
                              <Label className="text-xs">{field}</Label>
                              <Input
                                value={String(item.payload?.[field] ?? "")}
                                disabled={draft.status !== "draft"}
                                onChange={(e) =>
                                  updateItemField(item.id, globalIndex, field, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2 sticky bottom-0 bg-background py-3 border-t">
              {draft.status === "draft" && draft.source_method === "ai" && (
                <Button variant="outline" onClick={handleExtract} disabled={extracting}>
                  {extracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Re-extract
                </Button>
              )}
              {draft.status === "draft" && (
                <>
                  <Button variant="outline" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save edits
                  </Button>
                  <Button onClick={handleConfirm} disabled={confirming || counts.valid === 0}>
                    {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm {counts.valid} valid row(s)
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={handleDiscard}>
                {draft.status === "draft" ? "Discard" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
