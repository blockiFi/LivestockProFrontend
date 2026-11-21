import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Egg,
  Loader2,
  Moon,
  Sparkles,
  Star,
  TrendingDown,
} from "lucide-react"
import type { RootState } from "@/store"
import { FormModal, FormSection } from "@/components/ui/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AiGate } from "@/components/general/AiGate"
import { cn } from "@/lib/utils"
import {
  getEggCellAiInsights,
  getEggCellInsights,
  type CellAiInsights,
  type CellInsightCell,
  type CellInsightEvent,
  type CellInsightEventKey,
  type CellInsights,
} from "@/lib/eggCollection"

type View = "change" | "eggs" | "rate"

/** Change lists, in the order a farm manager would read them. */
const EVENT_GROUPS: { key: CellInsightEventKey; title: string; hint: string; tone: string }[] = [
  { key: "first_egg", title: "First egg", hint: "No egg ever collected from these cells before today.", tone: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  { key: "increase", title: "Laying more", hint: "More eggs than the previous recorded day, e.g. 1 → 2.", tone: "border-emerald-200 bg-emerald-50/60 text-emerald-900" },
  { key: "decrease", title: "Laying less", hint: "Fewer eggs than the previous recorded day, but still laying.", tone: "border-amber-300 bg-amber-50 text-amber-900" },
  { key: "stopped", title: "Stopped", hint: "Laid on the previous recorded day, nothing today.", tone: "border-rose-300 bg-rose-50 text-rose-900" },
  { key: "silent", title: "Silent", hint: "Laid before, but no eggs for several recorded days in a row.", tone: "border-slate-300 bg-slate-100 text-slate-800" },
  { key: "never_laid", title: "Not laid yet", hint: "No egg recorded from these cells so far.", tone: "border-slate-200 bg-white text-slate-700" },
  { key: "over_capacity", title: "More eggs than birds", hint: "Check the bird count or whether eggs went into the wrong cell.", tone: "border-violet-300 bg-violet-50 text-violet-900" },
  { key: "high_broken", title: "Many broken", hint: "Half or more of the cell's eggs broken, or 2+ broken.", tone: "border-orange-300 bg-orange-50 text-orange-900" },
  { key: "weak", title: "Weak cells", hint: "Lay rate well below the rest of the row over the window.", tone: "border-rose-200 bg-white text-rose-800" },
  { key: "top", title: "Top cells", hint: "90%+ lay rate over the window.", tone: "border-sky-200 bg-sky-50 text-sky-900" },
  { key: "full", title: "Every bird laid", hint: "As many eggs as birds today.", tone: "border-sky-200 bg-white text-sky-900" },
]

const STATUS_TILE: Record<string, string> = {
  first_egg: "bg-emerald-500 border-emerald-600 text-white",
  increase: "bg-emerald-100 border-emerald-300 text-emerald-900",
  decrease: "bg-amber-100 border-amber-300 text-amber-900",
  stopped: "bg-rose-500 border-rose-600 text-white",
  silent: "bg-slate-300 border-slate-400 text-slate-800",
  steady: "bg-white border-slate-200 text-slate-700",
  no_history: "bg-white border-dashed border-slate-300 text-slate-500",
}

const LEGEND: { status: string; label: string }[] = [
  { status: "first_egg", label: "First egg" },
  { status: "increase", label: "Up" },
  { status: "decrease", label: "Down" },
  { status: "stopped", label: "Stopped" },
  { status: "silent", label: "Silent" },
  { status: "steady", label: "Same" },
  { status: "no_history", label: "New, no history" },
]

/** Share of birds laying (0..1) as a green scale; empty cells stay white. */
const rateTile = (ratio: number | null) => {
  if (ratio === null) return "bg-white border-dashed border-slate-300 text-slate-500"
  if (ratio <= 0) return "bg-white border-slate-200 text-slate-500"
  if (ratio < 0.34) return "bg-lime-100 border-lime-200 text-lime-900"
  if (ratio < 0.67) return "bg-lime-300 border-lime-400 text-lime-950"
  if (ratio < 1) return "bg-emerald-400 border-emerald-500 text-white"
  return "bg-emerald-600 border-emerald-700 text-white"
}

/** Short text after the cell label in a change list chip. */
const chipText = (key: CellInsightEventKey, e: CellInsightEvent) => {
  switch (key) {
    case "first_egg":
      return `${e.eggs} egg${e.eggs === 1 ? "" : "s"}`
    case "top":
    case "weak":
      return `${e.window_rate}%`
    case "silent":
    case "never_laid":
      return e.detail.replace(/^no eggs? (for|yet in) /, "")
    case "over_capacity":
    case "full":
      return `${e.eggs}/${e.birds}`
    case "high_broken":
      return e.detail.replace(" broken", "")
    default:
      return e.detail
  }
}

const fmtDate = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : ""

const days = (n: number) => `${n} recorded day${n === 1 ? "" : "s"}`

const signed = (n: number | null | undefined) => (n === null || n === undefined ? "–" : n > 0 ? `+${n}` : String(n))

interface CellInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  flockId: number
  flockName?: string
  /** Day to open on; defaults to the latest day with a by-cell collection. */
  initialDate?: string | null
}

export default function CellInsightsModal({ isOpen, onClose, flockId, flockName, initialDate }: CellInsightsModalProps) {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)

  const [date, setDate] = useState<string | null>(initialDate ?? null)
  const [windowDays, setWindowDays] = useState(7)
  const [data, setData] = useState<CellInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>("change")
  const [houseId, setHouseId] = useState<number | null>(null)
  const [highlight, setHighlight] = useState<Set<number>>(new Set())
  const [selectedCell, setSelectedCell] = useState<CellInsightCell | null>(null)
  const [ai, setAi] = useState<CellAiInsights | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const load = useCallback(
    async (forDate: string | null) => {
      if (!token || !farmId) return
      setLoading(true)
      const res = await getEggCellInsights(token, farmId, flockId, {
        ...(forDate ? { date: forDate } : {}),
        window: windowDays,
      })
      setLoading(false)
      if (!res.success || !res.data) {
        setData(null)
        return
      }
      // First open with no date: jump to the latest recorded day.
      if (!forDate && !res.data.has_data && res.data.latest_recorded_date) {
        setDate(res.data.latest_recorded_date)
        return
      }
      setData(res.data)
      setDate(res.data.date)
    },
    [token, farmId, flockId, windowDays]
  )

  useEffect(() => {
    if (isOpen) void load(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date, windowDays])

  useEffect(() => {
    if (!isOpen) {
      setData(null)
      setAi(null)
      setAiError(null)
      setHighlight(new Set())
      setSelectedCell(null)
      setKnownDates([])
      setDate(initialDate ?? null)
    }
  }, [isOpen, initialDate])

  // A different day or window makes the AI read stale.
  useEffect(() => {
    setAi(null)
    setAiError(null)
    setHighlight(new Set())
    setSelectedCell(null)
  }, [date, windowDays])

  useEffect(() => {
    if (data?.houses?.length && !data.houses.some((h) => h.house_id === houseId)) {
      setHouseId(data.houses[0].house_id)
    }
  }, [data, houseId])

  // Each load only lists recorded days up to its date, so keep every day seen to step forward again.
  const [knownDates, setKnownDates] = useState<string[]>([])
  useEffect(() => {
    if (data?.recorded_dates?.length) {
      setKnownDates((prev) => [...new Set([...prev, ...data.recorded_dates])].sort().reverse())
    }
  }, [data])
  const allRecorded = knownDates
  const idx = date ? allRecorded.indexOf(date) : -1
  const olderDate = idx >= 0 ? allRecorded[idx + 1] : allRecorded[0]

  const runAi = async () => {
    if (!token || !farmId || !data?.has_data) return
    setAiLoading(true)
    setAiError(null)
    const res = await getEggCellAiInsights(token, farmId, flockId, { date: data.date, window: windowDays })
    setAiLoading(false)
    if (res.success && res.data) {
      setAi(res.data)
      if (!res.data.ai_available) setAiError("The AI couldn't be reached just now. Try again in a moment.")
    } else {
      setAiError(res.error?.join(", ") || "Failed to get AI analysis")
    }
  }

  const labelToId = useMemo(() => {
    const m = new Map<string, number>()
    data?.houses?.forEach((h) => h.rows.forEach((r) => r.cells.forEach((c) => m.set(c.label.toUpperCase(), c.cell_id))))
    return m
  }, [data])

  const highlightLabels = (labels: string[]) => {
    const ids = labels.map((l) => labelToId.get(l.toUpperCase())).filter((x): x is number => Boolean(x))
    setHighlight(new Set(ids))
    if (ids.length) {
      const house = data?.houses?.find((h) => h.rows.some((r) => r.cells.some((c) => c.cell_id === ids[0])))
      if (house) setHouseId(house.house_id)
      // Wait for the house tab to render, then bring the first highlighted cell into view.
      setTimeout(() => document.getElementById(`cell-tile-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80)
    }
  }

  const s = data?.summary
  const house = data?.houses?.find((h) => h.house_id === houseId) ?? data?.houses?.[0]

  const tileClass = (c: CellInsightCell) => {
    if (view === "eggs") return rateTile(c.birds > 0 ? c.eggs / c.birds : null)
    if (view === "rate") return rateTile(c.window_rate === null ? null : c.window_rate / 100)
    return STATUS_TILE[c.status] ?? STATUS_TILE.steady
  }

  const tileText = (c: CellInsightCell) => {
    if (view === "rate") return c.window_rate === null ? "–" : `${Math.round(c.window_rate)}%`
    if (view === "eggs") return `${c.eggs}/${c.birds}`
    return c.previous_eggs === null ? String(c.eggs) : `${c.previous_eggs}→${c.eggs}`
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Cell insights"
      description={`${flockName ? `${flockName}: ` : ""}which cells started laying, went up, dropped or stopped, compared with the previous recorded day.`}
      icon={BarChart3}
      tone="flock"
      size="full"
    >
      {/* Day picker */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={!olderDate || loading}
          onClick={() => olderDate && setDate(olderDate)}
          title="Previous recorded day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={date ?? ""}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="h-9 w-[170px]"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={idx <= 0 || loading}
          onClick={() => idx > 0 && setDate(allRecorded[idx - 1])}
          title="Next recorded day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-slate-600">
          {data?.has_data && data.previous_date ? (
            <>
              <span className="font-medium text-slate-900">{fmtDate(data.date)}</span> compared with{" "}
              <span className="font-medium text-slate-900">{fmtDate(data.previous_date)}</span>
            </>
          ) : data?.has_data ? (
            "First recorded day, nothing to compare with yet."
          ) : null}
        </span>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span>Lay rate over</span>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          >
            {[3, 7, 14, 30].map((n) => (
              <option key={n} value={n}>
                {n} recorded days
              </option>
            ))}
          </select>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {!data && loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analysing cells…
        </div>
      ) : !data?.has_cells ? (
        <EmptyNote text="This flock has no cells assigned. Set up the house's egg collection layout and assign cells to this flock first." />
      ) : !data.has_data ? (
        <EmptyNote
          text={
            data.latest_recorded_date
              ? `No by-cell collection on ${fmtDate(data.date)}. The latest one is ${fmtDate(data.latest_recorded_date)}.`
              : "No by-cell collection recorded for this flock yet. Record a collection by cell to see insights."
          }
          action={
            data.latest_recorded_date ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setDate(data.latest_recorded_date ?? null)}>
                Go to {fmtDate(data.latest_recorded_date)}
              </Button>
            ) : null
          }
        />
      ) : (
        s && (
          <>
            {s.possibly_incomplete && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Only {s.cells_entered} cells have entries on this day against {s.previous_cells_entered} on{" "}
                  {fmtDate(data.previous_date)}. If more rounds are still to come, the drops below will shrink once they're
                  recorded.
                </span>
              </div>
            )}

            {/* Headline numbers */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat
                icon={Egg}
                label="Eggs from cells"
                value={s.eggs.toLocaleString()}
                sub={s.previous_eggs === null ? `${s.rounds} round${s.rounds === 1 ? "" : "s"}` : `${signed(s.change)} vs ${s.previous_eggs.toLocaleString()}`}
                trend={s.change}
              />
              <Stat
                icon={BarChart3}
                label="Lay rate"
                value={s.lay_rate === null ? "–" : `${s.lay_rate}%`}
                sub={`${s.birds.toLocaleString()} birds in ${s.cells} cells`}
              />
              <Stat
                icon={Star}
                label="Cells laying"
                value={`${s.cells_laying} / ${s.cells}`}
                sub={s.previous_cells_laying === null ? "" : `${signed(s.cells_laying - s.previous_cells_laying)} vs ${s.previous_cells_laying}`}
                trend={s.previous_cells_laying === null ? null : s.cells_laying - s.previous_cells_laying}
              />
              <Stat icon={TrendingDown} label="Broken" value={s.broken.toLocaleString()} sub={`${s.counts.high_broken} cells with many broken`} />
            </div>

            <div className="flex flex-wrap gap-2">
              {EVENT_GROUPS.filter((g) => (s.counts[g.key] ?? 0) > 0).map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => highlightLabels((data.events?.[g.key] ?? []).map((e) => e.label))}
                  className={cn("rounded-full border px-3 py-1 text-sm font-medium transition hover:shadow", g.tone)}
                  title={g.hint}
                >
                  {g.title} · {s.counts[g.key]}
                </button>
              ))}
            </div>

            {/* AI */}
            <FormSection step={1} icon={Sparkles} title="AI analysis" description="The AI reads the numbers below and says what to check first.">
              <AiGate>
                {!ai?.ai_insights && !ai?.ai_text ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={() => void runAi()} disabled={aiLoading} className="gap-2">
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {aiLoading ? "Analysing…" : "Analyse with AI"}
                    </Button>
                    {aiError && <span className="text-sm text-rose-600">{aiError}</span>}
                  </div>
                ) : ai.ai_insights ? (
                  <AiResult ai={ai} onCells={highlightLabels} onRefresh={() => void runAi()} refreshing={aiLoading} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{ai.ai_text}</p>
                )}
              </AiGate>
            </FormSection>

            {/* Heatmap */}
                        <FormSection step={2} icon={Egg} title="Cell map" description="Tap a cell for its details. Tap a chip above to highlight those cells.">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {data.houses && data.houses.length > 1 &&
                  data.houses.map((h) => (
                    <Button
                      key={h.house_id}
                      type="button"
                      size="sm"
                      variant={h.house_id === house?.house_id ? "default" : "outline"}
                      onClick={() => setHouseId(h.house_id)}
                    >
                      {h.house_name}
                    </Button>
                  ))}
                <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
                  {(
                    [
                      ["change", "Change"],
                      ["eggs", "Eggs today"],
                      ["rate", `${windowDays}-day lay rate`],
                    ] as [View, string][]
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={cn("rounded-md px-3 py-1", view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {view === "change" ? (
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  {LEGEND.map((l) => (
                    <span key={l.status} className="inline-flex items-center gap-1.5">
                      <span className={cn("inline-block h-3 w-3 rounded border", STATUS_TILE[l.status])} />
                      {l.label}
                    </span>
                  ))}
                  <span className="text-slate-400">Tiles show previous → today</span>
                </div>
              ) : (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>{view === "eggs" ? "Eggs ÷ birds today" : "Lay rate"}:</span>
                  {[0, 0.2, 0.5, 0.8, 1].map((r) => (
                    <span key={r} className="inline-flex items-center gap-1">
                      <span className={cn("inline-block h-3 w-3 rounded border", rateTile(r))} />
                      {Math.round(r * 100)}%
                    </span>
                  ))}
                </div>
              )}

              {highlight.size > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                  <span>{highlight.size} cells highlighted</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setHighlight(new Set())}>
                    Clear
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {house?.rows.map((row) => {
                  const r = data.rows?.find((x) => x.row_id === row.row_id)
                  return (
                    <div key={row.row_id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 font-semibold text-white">{row.code}</span>
                        {r && (
                          <>
                            <span className="font-medium text-slate-900">{r.eggs} eggs</span>
                            {r.change !== null && (
                              <span className={cn("font-medium", r.change > 0 ? "text-emerald-600" : r.change < 0 ? "text-rose-600" : "text-slate-500")}>
                                {signed(r.change)}
                              </span>
                            )}
                            <span className="text-slate-500">
                              {r.lay_rate ?? "–"}% · {r.cells_laying}/{r.cells} cells laying · {r.up} up · {r.down} down
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.cells.map((c) => (
                          <button
                            key={c.cell_id}
                            id={`cell-tile-${c.cell_id}`}
                            type="button"
                            onClick={() => setSelectedCell(c)}
                            title={`${c.label}: ${c.eggs} eggs from ${c.birds} birds${c.previous_eggs !== null ? `, ${c.previous_eggs} before` : ""}`}
                            className={cn(
                              "relative flex h-12 w-14 flex-col items-center justify-center rounded-md border text-[11px] leading-tight transition",
                              tileClass(c),
                              highlight.size > 0 && !highlight.has(c.cell_id) && "opacity-25",
                              highlight.has(c.cell_id) && "ring-2 ring-slate-900 ring-offset-1",
                              selectedCell?.cell_id === c.cell_id && "ring-2 ring-sky-500 ring-offset-1"
                            )}
                          >
                            <span className="font-semibold">{c.label}</span>
                            <span>{tileText(c)}</span>
                            {c.flags.includes("over_capacity") && <span className="absolute right-0.5 top-0 text-[10px] font-bold text-violet-700">!</span>}
                            {c.flags.includes("high_broken") && <span className="absolute left-0.5 top-0 h-1.5 w-1.5 rounded-full bg-orange-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedCell && <CellDetail cell={selectedCell} windowDays={windowDays} onClose={() => setSelectedCell(null)} />}
            </FormSection>

            {/* Change lists */}
            <FormSection step={3} icon={ArrowUpRight} title="What changed" description="Every cell that moved, grouped. Tap a group to highlight it on the map.">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {EVENT_GROUPS.map((g) => {
                  const list = data.events?.[g.key] ?? []
                  if (!list.length) return null
                  return (
                    <div key={g.key} className={cn("rounded-xl border p-3", g.tone)}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => highlightLabels(list.map((e) => e.label))}
                      >
                        <span className="font-semibold">{g.title}</span>
                        <Badge variant="outline" className="bg-white/70">
                          {list.length}
                        </Badge>
                      </button>
                      <p className="mb-2 mt-0.5 text-xs opacity-75">{g.hint}</p>
                      <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
                        {list.map((e) => (
                          <button
                            key={e.cell_id}
                            type="button"
                            onClick={() => highlightLabels([e.label])}
                            className="rounded-md border border-current/20 bg-white/80 px-2 py-0.5 text-xs hover:bg-white"
                            title={e.detail}
                          >
                            <span className="font-semibold">{e.label}</span>{" "}
                            <span className="opacity-75">{chipText(g.key, e)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </FormSection>

            {/* Rows + trend */}
            <FormSection step={4} icon={BarChart3} title="Rows and trend" description="Row totals for the day, and eggs from the flock's cells per recorded day.">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2 text-right">Eggs</th>
                        <th className="px-3 py-2 text-right">Before</th>
                        <th className="px-3 py-2 text-right">Change</th>
                        <th className="px-3 py-2 text-right">Lay rate</th>
                        <th className="px-3 py-2 text-right">Laying</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows?.map((r) => (
                        <tr key={r.row_id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium">
                            {data.houses && data.houses.length > 1 ? <span className="text-slate-400">{r.house_name} · </span> : null}
                            {r.row_code}
                          </td>
                          <td className="px-3 py-2 text-right">{r.eggs}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{r.previous_eggs ?? "–"}</td>
                          <td className={cn("px-3 py-2 text-right font-medium", (r.change ?? 0) > 0 ? "text-emerald-600" : (r.change ?? 0) < 0 ? "text-rose-600" : "text-slate-500")}>
                            {signed(r.change)}
                          </td>
                          <td className="px-3 py-2 text-right">{r.lay_rate ?? "–"}%</td>
                          <td className="px-3 py-2 text-right text-slate-500">
                            {r.cells_laying}/{r.cells}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  {data.trend && data.trend.length > 1 ? (
                    <ChartContainer
                      config={{
                        eggs: { label: "Eggs", color: "#d97706" },
                        cells_laying: { label: "Cells laying", color: "#059669" },
                      }}
                      className="aspect-[16/8] w-full min-h-[220px]"
                    >
                      <LineChart data={data.trend.map((t) => ({ ...t, label: fmtDate(t.date) }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} width={44} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="eggs" stroke="var(--color-eggs)" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="cells_laying" stroke="var(--color-cells_laying)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-10 text-center text-sm text-slate-500">The trend appears after two recorded days.</p>
                  )}
                </div>
              </div>
            </FormSection>
          </>
        )
      )}
    </FormModal>
  )
}

function EmptyNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
      <Moon className="h-6 w-6 text-slate-400" />
      <p className="max-w-md">{text}</p>
      {action}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  trend?: number | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub ? (
        <div
          className={cn(
            "mt-0.5 flex items-center gap-1 text-xs",
            trend && trend > 0 ? "text-emerald-600" : trend && trend < 0 ? "text-rose-600" : "text-slate-500"
          )}
        >
          {trend && trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend && trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
          {sub}
        </div>
      ) : null}
    </div>
  )
}

const STATUS_TEXT: Record<string, string> = {
  first_egg: "First egg ever from this cell",
  increase: "Laying more than the previous recorded day",
  decrease: "Laying less than the previous recorded day",
  stopped: "Stopped: laid before, nothing today",
  silent: "Silent for several recorded days",
  steady: "Same as the previous recorded day",
  no_history: "No earlier days to compare with",
}

function CellDetail({ cell, windowDays, onClose }: { cell: CellInsightCell; windowDays: number; onClose: () => void }) {
  const flagText: Record<string, string> = {
    over_capacity: "More eggs than birds",
    full: "Every bird laid",
    high_broken: "Many broken",
    silent: `No eggs for ${cell.zero_streak} recorded days`,
    never_laid: "No egg recorded yet",
    top: "Top cell",
    weak: "Weak against its row",
  }
  return (
    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">
            {cell.label} · {cell.birds} birds
          </div>
          <div className="text-slate-600">{STATUS_TEXT[cell.status]}</div>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="Today" value={`${cell.eggs} eggs`} />
        <Mini label="Previous day" value={cell.previous_eggs === null ? "–" : `${cell.previous_eggs} eggs`} />
        <Mini label={`Lay rate (${windowDays} days)`} value={cell.window_rate === null ? "–" : `${cell.window_rate}%`} />
        <Mini label="Broken today" value={String(cell.broken)} />
        <Mini label="Average before" value={cell.average_before === null ? "–" : `${cell.average_before} eggs/day`} />
        <Mini label="Laying streak" value={days(cell.laying_streak)} />
        <Mini label="Empty streak" value={days(cell.zero_streak)} />
      </div>
      {cell.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {cell.flags.map((f) => (
            <Badge key={f} variant="outline" className="bg-white">
              {flagText[f] ?? f}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white bg-white/80 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function AiResult({
  ai,
  onCells,
  onRefresh,
  refreshing,
}: {
  ai: CellAiInsights
  onCells: (labels: string[]) => void
  onRefresh: () => void
  refreshing: boolean
}) {
  const i = ai.ai_insights!
  const prioTone: Record<string, string> = {
    high: "bg-rose-100 text-rose-800 border-rose-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  }
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">{i.headline}</div>
          <p className="mt-1 text-slate-700">{i.summary}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={refreshing} className="shrink-0 gap-1">
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Re-run
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {i.positives?.length ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="mb-1 font-semibold text-emerald-900">Going well</div>
            <ul className="list-disc space-y-1 pl-4 text-emerald-900">
              {i.positives.map((p, k) => (
                <li key={k}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {i.concerns?.length ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
            <div className="mb-1 font-semibold text-rose-900">Concerns</div>
            <ul className="list-disc space-y-1 pl-4 text-rose-900">
              {i.concerns.map((p, k) => (
                <li key={k}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {i.actions?.length ? (
        <div className="space-y-2">
          <div className="font-semibold text-slate-900">What to do</div>
          {i.actions.map((a, k) => (
            <div key={k} className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
              <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-semibold uppercase", prioTone[a.priority] ?? prioTone.low)}>
                {a.priority}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900">{a.action}</div>
                {a.reason && <div className="text-slate-600">{a.reason}</div>}
              </div>
              {a.cells?.length ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => onCells(a.cells ?? [])}>
                  Show {a.cells.length > 3 ? `${a.cells.length} cells` : a.cells.join(", ")}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {i.watch_cells?.length ? (
        <div>
          <div className="mb-1 font-semibold text-slate-900">Cells to watch</div>
          <div className="flex flex-wrap gap-1">
            {i.watch_cells.map((w, k) => (
              <button
                key={k}
                type="button"
                onClick={() => onCells([w.cell])}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                title={w.reason}
              >
                <span className="font-semibold">{w.cell}</span> <span className="text-slate-500">{w.reason}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
