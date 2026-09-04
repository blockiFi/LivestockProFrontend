import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type RecordGuide = {
  type: string
  label: string
  sheetName: string
  required: string[]
  optional: string[]
  notes: string[]
  example: string
}

const RECORD_GUIDES: RecordGuide[] = [
  {
    type: "daily",
    label: "Daily records",
    sheetName: "daily",
    required: ["date"],
    optional: [
      "mortality_count",
      "culling_count",
      "feed_consumption_kg",
      "poultry_feed_type",
      "poultry_feed_inventory_id",
      "water_consumption_liters",
      "eggs_collected",
      "eggs_broken",
      "average_weight_kg",
      "notes",
    ],
    notes: [
      "One row per date. Prefer putting mortality, eggs, and feed here instead of duplicating them on dedicated sheets for the same date.",
      "poultry_feed_type must match a feed type name already set up on this farm.",
      "eggs_broken cannot exceed eggs_collected.",
    ],
    example: "date=2026-09-01, mortality_count=0, feed_consumption_kg=12.5, eggs_collected=180, eggs_broken=2",
  },
  {
    type: "mortality",
    label: "Mortality",
    sheetName: "mortality",
    required: ["date", "mortality_count"],
    optional: ["average_weight", "notes"],
    notes: [
      "Use when recording deaths separately from a daily row.",
      "average_weight is optional (kg).",
      "Do not also fill mortality_count on a daily row for the same date.",
    ],
    example: "date=2026-09-02, mortality_count=2",
  },
  {
    type: "eggs",
    label: "Egg reports",
    sheetName: "eggs",
    required: ["date", "eggs_collected"],
    optional: ["eggs_broken", "average_egg_weight", "notes"],
    notes: [
      "Use for dedicated egg production rows (layers).",
      "If the same date already has eggs_collected on a daily row, skip a separate eggs row for that date.",
      "eggs_broken cannot exceed eggs_collected and is removed from available stock.",
      "average_egg_weight is in grams.",
    ],
    example: "date=2026-09-02, eggs_collected=180, eggs_broken=3, average_egg_weight=58",
  },
  {
    type: "feed_usage",
    label: "Feed usage",
    sheetName: "feed_usage",
    required: ["date", "quantity"],
    optional: [
      "poultry_feed_type",
      "poultry_feed_type_id",
      "poultry_feed_inventory_id",
      "unit_cost",
    ],
    notes: [
      "quantity is kg of feed used.",
      "Provide poultry_feed_type (name) that matches a farm feed type, or a feed inventory / type id.",
      "Avoid duplicating feed already entered as feed_consumption_kg on a daily row for the same date.",
    ],
    example: "date=2026-09-02, quantity=25, poultry_feed_type=Layer Mash",
  },
  {
    type: "expenditure",
    label: "Expenditure",
    sheetName: "expenditure",
    required: ["date", "category", "amount"],
    optional: ["currency", "description", "payment_method", "reference_no"],
    notes: [
      "category must be one of: feed, medication, vaccination, labour, transport, utilities, equipment, housing, chicks, maintenance, other.",
      "amount is the total cost for that entry.",
    ],
    example: "date=2026-09-02, category=labour, amount=15000, description=Farm hands",
  },
  {
    type: "flock_sale",
    label: "Live bird sales",
    sheetName: "flock_sale",
    required: ["date", "quantity", "unit_price"],
    optional: ["customer_name", "customer_phone", "notes"],
    notes: [
      "Sells birds from this flock and reduces live bird count.",
      "quantity cannot exceed current live birds.",
    ],
    example: "date=2026-09-03, quantity=10, unit_price=3500, customer_name=Walk-in",
  },
  {
    type: "product_sale",
    label: "Product sales",
    sheetName: "product_sale",
    required: ["date", "type", "quantity", "unit_price"],
    optional: [
      "customer_name",
      "customer_phone",
      "payment_method",
      "payment_status",
      "notes",
    ],
    notes: [
      "record_type must be product_sale (singular). product_sales is also accepted as an alias.",
      "type must be egg, meat, or manure (this is product kind — not the same as record_type).",
      "For egg sales, quantity is deducted from available egg stock for this flock.",
    ],
    example: "record_type=product_sale, date=2026-09-03, type=egg, quantity=30, unit_price=250",
  },
]

type Props = {
  /** Highlight the format warning when parse failed */
  emphasize?: boolean
  defaultOpen?: boolean
}

export default function BulkImportInstructions({
  emphasize = false,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [expandedType, setExpandedType] = useState<string | null>("daily")

  return (
    <div
      className={`rounded-lg border text-sm ${
        emphasize
          ? "border-amber-300 bg-amber-50/80"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2 p-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className={`mt-0.5 h-4 w-4 shrink-0 ${emphasize ? "text-amber-700" : "text-slate-500"}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${emphasize ? "text-amber-950" : "text-slate-900"}`}>
            How to format your spreadsheet
          </p>
          <p className={`text-xs mt-0.5 ${emphasize ? "text-amber-800" : "text-muted-foreground"}`}>
            Sheet names or a <code className="text-[11px]">record_type</code> column are required —
            otherwise the upload cannot be parsed.
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200/80 px-3 pb-3 pt-3">
          <div className="space-y-2">
            <p className="font-medium text-slate-900">Step 1 — Prefer the downloadable template</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Click <strong>Download template</strong>, keep the sheet names as they are, replace the
              example rows with your data, then upload that file. Delete sheets you do not need. Leave
              the <code className="text-[11px]">instructions</code> sheet alone.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-slate-900">Step 2 — Choose one file layout</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border bg-white p-3 space-y-1.5">
                <Badge variant="outline" className="text-[10px]">
                  Layout A · Multi-sheet Excel
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Name each sheet exactly (lowercase):{" "}
                  <code className="text-[11px]">daily</code>,{" "}
                  <code className="text-[11px]">mortality</code>,{" "}
                  <code className="text-[11px]">eggs</code>,{" "}
                  <code className="text-[11px]">feed_usage</code>,{" "}
                  <code className="text-[11px]">expenditure</code>,{" "}
                  <code className="text-[11px]">flock_sale</code>,{" "}
                  <code className="text-[11px]">product_sale</code>.
                </p>
                <p className="text-[11px] text-rose-700">
                  Names like “Daily Records” or “Egg Production” will not work.
                </p>
              </div>
              <div className="rounded-md border bg-white p-3 space-y-1.5">
                <Badge variant="outline" className="text-[10px]">
                  Layout B · Single sheet / CSV
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add a required first column named{" "}
                  <code className="text-[11px]">record_type</code>. Each row’s value must be one of
                  the type keys above (e.g. <code className="text-[11px]">eggs</code>).
                </p>
                <p className="text-[11px] text-slate-600 font-mono bg-slate-50 rounded px-1.5 py-1 overflow-x-auto">
                  record_type,date,eggs_collected…
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-slate-900">Step 3 — Columns per record type</p>
            <p className="text-xs text-muted-foreground">
              Dates must be <code className="text-[11px]">YYYY-MM-DD</code>. Expand a type for required
              fields, optional columns, and an example row.
            </p>
            <div className="space-y-1.5">
              {RECORD_GUIDES.map((guide) => {
                const isOpen = expandedType === guide.type
                return (
                  <div key={guide.type} className="rounded-md border bg-white overflow-hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-between rounded-none px-3 py-2 font-normal"
                      onClick={() => setExpandedType(isOpen ? null : guide.type)}
                    >
                      <span className="flex items-center gap-2 text-left">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-900">{guide.label}</span>
                        <code className="text-[10px] text-slate-500">{guide.sheetName}</code>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {guide.required.length} required
                      </span>
                    </Button>
                    {isOpen && (
                      <div className="space-y-2 border-t px-3 py-2.5 text-xs">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Required</p>
                          <div className="flex flex-wrap gap-1">
                            {guide.required.map((col) => (
                              <Badge key={col} variant="secondary" className="font-mono text-[10px]">
                                {col}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {guide.optional.length > 0 && (
                          <div>
                            <p className="font-medium text-slate-700 mb-1">Optional</p>
                            <div className="flex flex-wrap gap-1">
                              {guide.optional.map((col) => (
                                <Badge
                                  key={col}
                                  variant="outline"
                                  className="font-mono text-[10px] font-normal"
                                >
                                  {col}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          {guide.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                        <p className="rounded bg-slate-50 px-2 py-1.5 font-mono text-[10px] text-slate-600 break-all">
                          Example: {guide.example}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3 space-y-1">
            <p className="font-medium text-slate-900 text-xs">Common mistakes</p>
            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
              <li>Uploading an export/report that has no matching sheet names and no record_type column.</li>
              <li>
                Using <code className="text-[11px]">type</code> instead of{" "}
                <code className="text-[11px]">record_type</code> on a combined sheet (
                <code className="text-[11px]">type</code> is only for product sales: egg / meat /
                manure).
              </li>
              <li>Putting mortality, eggs, and feed on both daily and dedicated sheets for the same date.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
