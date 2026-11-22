import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { format } from "date-fns"
import { AlertTriangle, ArrowRight, CalendarIcon, Clock, Egg, Grid3x3, Hash, Hand, ListOrdered, Loader2, Pencil, Plus, Trash2, Undo2 } from "lucide-react"
import type { RootState } from "@/store"
import type { DetailedFlockRecord, FlockRecord } from "@/lib/types"
import {
  createEggCollection,
  deleteEggCollection,
  getEggSheet,
  updateEggCollection,
  type EggCollectionPayload,
  type EggCollectionRound,
  type EggEntryMode,
  type EggSheet,
  type EggSheetCell,
} from "@/lib/eggCollection"
import { FormField, FormModal, FormSection, FormSummary, formInputClass, formTextareaClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { confirmDialog } from "@/lib/confirmDialog"

interface RecordEggCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  flock?: FlockRecord | DetailedFlockRecord
  /** Day to open on (yyyy-MM-dd). Defaults to today. */
  initialDate?: string
  /** Read-only view when the user cannot record. */
  readOnly?: boolean
  /** Called after any round is saved or deleted so the page can refresh its reports. */
  onChanged?: () => void
}

type CellValues = Record<number, number>

/** "tap": each tap on a cell adds one egg. "pick": tap a cell, then pick its number. */
type EntryStyle = "tap" | "pick"

const ENTRY_STYLE_KEY = "eggCollection.entryStyle"

const readEntryStyle = (): EntryStyle => {
  try {
    return localStorage.getItem(ENTRY_STYLE_KEY) === "pick" ? "pick" : "tap"
  } catch {
    return "tap"
  }
}

const buzz = () => {
  try {
    navigator.vibrate?.(8)
  } catch {
    /* not supported */
  }
}

const localToday = () => format(new Date(), "yyyy-MM-dd")
const nowTime = () => format(new Date(), "HH:mm")

const RecordEggCollectionModal = ({ isOpen, onClose, flock, initialDate, readOnly = false, onChanged }: RecordEggCollectionModalProps) => {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)

  const [date, setDate] = useState(initialDate ?? localToday())
  const [sheet, setSheet] = useState<EggSheet | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Round being edited: null = new round, otherwise the round.
  const [editing, setEditing] = useState<EggCollectionRound | null>(null)
  const [showForm, setShowForm] = useState(true)
  const [mode, setMode] = useState<EggEntryMode>("cell")
  const [collectedAt, setCollectedAt] = useState(nowTime())
  const [totalEggs, setTotalEggs] = useState("")
  const [cellEggs, setCellEggs] = useState<CellValues>({})
  const [cellBroken, setCellBroken] = useState<CellValues>({})
  const [extraBroken, setExtraBroken] = useState("")
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [entering, setEntering] = useState<"eggs" | "broken">("eggs")
  const [houseIdx, setHouseIdx] = useState(0)
  const [rowId, setRowId] = useState<number | null>(null)
  const [focusedCell, setFocusedCell] = useState<number | null>(null)
  const [entryStyle, setEntryStyleState] = useState<EntryStyle>(readEntryStyle)
  /** Earlier states of the cell entries, newest last, for Undo. */
  const history = useRef<{ eggs: CellValues; broken: CellValues }[]>([])
  const [historySize, setHistorySize] = useState(0)
  const tileRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  /** Long-press on a touch screen takes one off (iOS has no right-click). */
  const pressTimer = useRef<number | null>(null)
  const longPressed = useRef(false)

  const flockId = flock?.id

  const resetForm = useCallback(
    (hasCells: boolean) => {
      setEditing(null)
      setMode(hasCells ? "cell" : "total")
      setCollectedAt(nowTime())
      setTotalEggs("")
      setCellEggs({})
      setCellBroken({})
      setExtraBroken("")
      setWeight("")
      setNotes("")
      setEntering("eggs")
      setFocusedCell(null)
      history.current = []
      setHistorySize(0)
    },
    []
  )

  const loadSheet = useCallback(
    async (forDate: string) => {
      if (!token || !farmId || !flockId) return null
      setLoading(true)
      const res = await getEggSheet(token, farmId, flockId, forDate)
      setLoading(false)
      if (!res.success || !res.data) {
        toast.error(res.error?.join(", ") || "Could not load the egg sheet")
        return null
      }
      setSheet(res.data)
      setHouseIdx((i) => Math.min(i, Math.max(0, res.data!.houses.length - 1)))
      setRowId((current) => {
        const rows = res.data!.houses.flatMap((h) => h.rows)
        return rows.some((r) => r.row_id === current) ? current : rows[0]?.row_id ?? null
      })
      return res.data
    },
    [token, farmId, flockId]
  )

  useEffect(() => {
    if (!isOpen) return
    const d = initialDate ?? localToday()
    setDate(d)
    void loadSheet(d).then((s) => {
      resetForm(Boolean(s?.has_cells))
      setShowForm(!readOnly && !(s?.report?.rounds.length))
    })
  }, [isOpen, initialDate, loadSheet, resetForm, readOnly])

  const changeDate = async (d: string) => {
    if (!d || d > localToday()) return
    setDate(d)
    const s = await loadSheet(d)
    resetForm(Boolean(s?.has_cells))
    setShowForm(!readOnly && !(s?.report?.rounds.length))
  }

  // Cells of the round being edited, so their eggs don't count against "already recorded".
  const editingCells = useMemo(() => {
    const map: Record<number, { eggs: number; broken: number }> = {}
    editing?.cells.forEach((c) => (map[c.cell_id] = { eggs: c.eggs, broken: c.broken }))
    return map
  }, [editing])

  const allCells = useMemo(() => sheet?.houses.flatMap((h) => h.rows.flatMap((r) => r.cells)) ?? [], [sheet])

  /** Eggs this cell can still give today, outside the round being edited. */
  const maxFor = useCallback(
    (cell: EggSheetCell) => Math.max(0, cell.birds - (cell.recorded_eggs - (editingCells[cell.id]?.eggs ?? 0))),
    [editingCells]
  )

  const roundEggs = mode === "cell" ? Object.values(cellEggs).reduce((s, v) => s + v, 0) : parseInt(totalEggs, 10) || 0
  const roundBrokenCells = mode === "cell" ? Object.values(cellBroken).reduce((s, v) => s + v, 0) : 0
  const roundBroken = roundBrokenCells + (parseInt(extraBroken, 10) || 0)
  const dayEggsOther = (sheet?.report?.eggs_collected ?? 0) - (editing?.eggs_collected ?? 0)
  const dayBrokenOther = (sheet?.report?.eggs_broken ?? 0) - (editing?.eggs_broken ?? 0)
  const dayEggs = dayEggsOther + (showForm ? roundEggs : 0)
  const dayBroken = dayBrokenOther + (showForm ? roundBroken : 0)
  const birdCount = sheet?.flock_bird_count ?? 0
  const henDay = birdCount > 0 ? Math.round((dayEggs / birdCount) * 10000) / 100 : 0
  const unfilled = allCells.filter((c) => cellEggs[c.id] === undefined).length

  const currentHouse = sheet?.houses[houseIdx]
  const currentRow = currentHouse?.rows.find((r) => r.row_id === rowId) ?? currentHouse?.rows[0]
  const orderedCellIds = useMemo(() => currentRow?.cells.map((c) => c.id) ?? [], [currentRow])

  const focusCell = (id: number | null) => {
    setFocusedCell(id)
    if (id) requestAnimationFrame(() => tileRefs.current[id]?.focus())
  }

  const setEntryStyle = (style: EntryStyle) => {
    setEntryStyleState(style)
    try {
      localStorage.setItem(ENTRY_STYLE_KEY, style)
    } catch {
      /* private mode */
    }
  }

  /** Remember the current entries so the next change can be undone. */
  const remember = () => {
    history.current = [...history.current.slice(-49), { eggs: cellEggs, broken: cellBroken }]
    setHistorySize(history.current.length)
  }

  const undo = () => {
    const last = history.current.pop()
    if (!last) return
    setCellEggs(last.eggs)
    setCellBroken(last.broken)
    setHistorySize(history.current.length)
  }

  /**
   * Tap-to-count: each tap adds one egg (or one broken egg in Broken mode). After the most the cell
   * can give it goes back to 0, so an extra tap is fixed by tapping round again or with Undo.
   */
  const tapCell = (cell: EggSheetCell, step: 1 | -1 = 1) => {
    setFocusedCell(cell.id)
    remember()
    buzz()
    if (entering === "eggs") {
      const cap = maxFor(cell)
      const cur = cellEggs[cell.id]
      let next: number
      if (step === -1) next = Math.max(0, (cur ?? 0) - 1)
      else if (cur === undefined) next = cap > 0 ? 1 : 0
      else next = cur >= cap ? 0 : cur + 1
      setCellEggs((prev) => ({ ...prev, [cell.id]: next }))
      if ((cellBroken[cell.id] ?? 0) > next) setCellBroken((prev) => ({ ...prev, [cell.id]: next }))
    } else {
      const eggs = cellEggs[cell.id] ?? 0
      if (eggs === 0) {
        toast.info(`Enter ${cell.label}'s eggs before its broken eggs`, { toastId: "broken-needs-eggs" })
        return
      }
      const cur = cellBroken[cell.id] ?? 0
      const next = step === -1 ? Math.max(0, cur - 1) : cur >= eggs ? 0 : cur + 1
      setCellBroken((prev) => {
        const copy = { ...prev }
        if (next === 0) delete copy[cell.id]
        else copy[cell.id] = next
        return copy
      })
    }
  }

  /** Cells in the row with no entry yet become 0 (the birds there laid nothing). */
  const zeroRestOfRow = () => {
    if (!currentRow) return
    remember()
    setCellEggs((prev) => {
      const next = { ...prev }
      currentRow.cells.forEach((c) => {
        if (next[c.id] === undefined) next[c.id] = 0
      })
      return next
    })
  }

  const rowsInOrder = useMemo(
    () => sheet?.houses.flatMap((h, hi) => h.rows.map((r) => ({ houseIdx: hi, rowId: r.row_id, code: r.code }))) ?? [],
    [sheet]
  )
  const nextRow = (() => {
    const i = rowsInOrder.findIndex((r) => r.rowId === currentRow?.row_id)
    return i >= 0 ? rowsInOrder[i + 1] ?? null : null
  })()
  const goToRow = (target: { houseIdx: number; rowId: number }) => {
    setHouseIdx(target.houseIdx)
    setRowId(target.rowId)
    setFocusedCell(null)
  }

  const setCellValue = (cell: EggSheetCell, value: number | undefined, advance = true) => {
    remember()
    if (entering === "eggs") {
      setCellEggs((prev) => {
        const next = { ...prev }
        if (value === undefined) delete next[cell.id]
        else next[cell.id] = value // may exceed what the cell can still give; the server warns
        return next
      })
      if (value !== undefined && (cellBroken[cell.id] ?? 0) > value) {
        setCellBroken((prev) => ({ ...prev, [cell.id]: value }))
      }
    } else {
      const eggs = cellEggs[cell.id] ?? 0
      setCellBroken((prev) => {
        const next = { ...prev }
        if (!value) delete next[cell.id]
        else next[cell.id] = Math.min(value, eggs)
        return next
      })
    }
    if (advance) {
      const idx = orderedCellIds.indexOf(cell.id)
      const nextId = orderedCellIds[idx + 1]
      focusCell(nextId ?? null)
    }
  }

  const onTileKey = (e: React.KeyboardEvent, cell: EggSheetCell) => {
    const idx = orderedCellIds.indexOf(cell.id)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      setCellValue(cell, Number(e.key))
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      setCellValue(cell, undefined, false)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusCell(orderedCellIds[idx + 1] ?? cell.id)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusCell(orderedCellIds[idx - 1] ?? cell.id)
    }
  }

  const fillRow = () => {
    if (!currentRow) return
    remember()
    setCellEggs((prev) => {
      const next = { ...prev }
      currentRow.cells.forEach((c) => (next[c.id] = maxFor(c)))
      return next
    })
  }

  const clearRow = () => {
    if (!currentRow) return
    remember()
    const ids = new Set(currentRow.cells.map((c) => c.id))
    setCellEggs((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !ids.has(Number(k)))))
    setCellBroken((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !ids.has(Number(k)))))
  }

  const rowTotal = (cells: EggSheetCell[]) => cells.reduce((s, c) => s + (cellEggs[c.id] ?? 0), 0)
  const rowCapacity = (cells: EggSheetCell[]) => cells.reduce((s, c) => s + maxFor(c), 0)

  const startEdit = (round: EggCollectionRound) => {
    setEditing(round)
    setMode(round.entry_mode)
    setCollectedAt(round.collected_at ?? "")
    setTotalEggs(round.entry_mode === "total" ? String(round.eggs_collected) : "")
    setCellEggs(Object.fromEntries(round.cells.map((c) => [c.cell_id, c.eggs])))
    setCellBroken(Object.fromEntries(round.cells.filter((c) => c.broken > 0).map((c) => [c.cell_id, c.broken])))
    setExtraBroken(round.eggs_broken_extra ? String(round.eggs_broken_extra) : "")
    setWeight(round.average_egg_weight ? String(round.average_egg_weight) : "")
    setNotes(round.notes ?? "")
    setEntering("eggs")
    history.current = []
    setHistorySize(0)
    setShowForm(true)
  }

  const removeRound = async (round: EggCollectionRound) => {
    if (!token || !farmId || !flockId) return
    const ok = await confirmDialog({
      title: `Delete round ${round.round_no}?`,
      description: `${round.eggs_collected.toLocaleString()} eggs will be removed from this day's total.`,
      confirmLabel: "Delete round",
    })
    if (!ok) return
    setSaving(true)
    const res = await deleteEggCollection(token, farmId, flockId, round.id)
    setSaving(false)
    if (!res.success) return toast.error(res.error?.join(", "))
    toast.success(`Round ${round.round_no} deleted`)
    const s = await loadSheet(date)
    if (editing?.id === round.id) resetForm(Boolean(s?.has_cells))
    onChanged?.()
  }

  const save = async () => {
    if (!token || !farmId || !flockId) return
    if (mode === "total" && totalEggs.trim() === "") return toast.error("Enter the eggs collected in this round")
    if (mode === "cell" && Object.keys(cellEggs).length === 0) return toast.error("Enter eggs for at least one cell")
    if (roundBroken > roundEggs) return toast.error("Broken eggs cannot be more than eggs collected")
    if (mode === "cell" && unfilled > 0) {
      const ok = await confirmDialog({
        title: `${unfilled.toLocaleString()} cells have no entry`,
        description: "Cells without an entry are left out of this round, not saved as 0. Save the round anyway?",
        confirmLabel: "Save round",
        cancelLabel: "Keep entering",
        tone: "flock",
      })
      if (!ok) return
    }

    const payload: EggCollectionPayload = {
      date,
      collected_at: collectedAt || null,
      entry_mode: mode,
      eggs_broken_extra: parseInt(extraBroken, 10) || 0,
      average_egg_weight: weight ? parseFloat(weight) : null,
      notes: notes || null,
      ...(mode === "total"
        ? { eggs_collected: parseInt(totalEggs, 10) || 0 }
        : {
            cells: Object.entries(cellEggs).map(([id, eggs]) => ({
              cell_id: Number(id),
              eggs,
              broken: cellBroken[Number(id)] ?? 0,
            })),
          }),
    }

    setSaving(true)
    const res = editing
      ? await updateEggCollection(token, farmId, flockId, editing.id, payload)
      : await createEggCollection(token, farmId, flockId, payload)
    setSaving(false)

    if (!res.success || !res.data) return toast.error(res.error?.join(", ") || "Could not save")
    res.data.warnings.forEach((w) => toast.warning(w))
    toast.success(editing ? `Round ${res.data.collection.round_no} updated` : `Round ${res.data.collection.round_no} saved`)
    const s = await loadSheet(date)
    resetForm(Boolean(s?.has_cells))
    setShowForm(false)
    onChanged?.()
  }

  const rounds = sheet?.report?.rounds ?? []

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && !saving && onClose()}
      title="Record egg collection"
      description={flock ? `${flock.name || flock.batch_number}: rounds through the day add up to the daily total.` : undefined}
      icon={Egg}
      tone="flock"
      size="full"
      busy={saving}
      dismissible={false}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            Day total <span className="font-semibold text-slate-900">{dayEggs.toLocaleString()}</span> eggs · broken{" "}
            <span className="font-semibold text-slate-900">{dayBroken.toLocaleString()}</span> · good{" "}
            <span className="font-semibold text-slate-900">{Math.max(0, dayEggs - dayBroken).toLocaleString()}</span> · hen-day{" "}
            <span className="font-semibold text-slate-900">{henDay.toFixed(2)}%</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Close
            </Button>
            {showForm && !readOnly && (
              <Button type="button" disabled={saving} onClick={() => void save()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? `Update round ${editing.round_no}` : "Save round"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <FormSection step={1} icon={CalendarIcon} title="Day" description="Pick the day, then add each collection round.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FormField label="Date">
            <Input type="date" max={localToday()} value={date} onChange={(e) => void changeDate(e.target.value)} className={formInputClass()} />
          </FormField>
          <FormSummary label="Birds in flock" value={birdCount.toLocaleString()} />
          <FormSummary label="Cells for this flock" value={(sheet?.total_cells ?? 0).toLocaleString()} />
          <FormSummary label="Birds in those cells" value={(sheet?.total_birds_in_cells ?? 0).toLocaleString()} />
        </div>

        {loading ? (
          <div className="mt-3 flex items-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {rounds.length === 0 && <p className="text-sm text-slate-500">No rounds recorded for this day yet.</p>}
            {rounds.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm",
                  editing?.id === r.id ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
                )}
              >
                <span className="font-semibold text-slate-900">Round {r.round_no}</span>
                {r.collected_at && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {r.collected_at}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {r.entry_mode === "cell" ? `By cell · ${r.cells.length} cells` : r.source === "legacy" ? "Earlier total" : "Total"}
                </span>
                <span className="text-slate-900">{r.eggs_collected.toLocaleString()} eggs</span>
                {r.eggs_broken > 0 && <span className="text-rose-700">{r.eggs_broken} broken</span>}
                {r.recorded_by_name && <span className="text-slate-500">by {r.recorded_by_name}</span>}
                {!readOnly && (
                  <div className="ml-auto flex gap-1">
                    <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => startEdit(r)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-rose-600" disabled={saving} onClick={() => void removeRound(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {!readOnly && !showForm && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm(Boolean(sheet?.has_cells))
                  setShowForm(true)
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add round
              </Button>
            )}
          </div>
        )}
      </FormSection>

      {showForm && !readOnly && sheet && (
        <FormSection
          step={2}
          icon={mode === "cell" ? Grid3x3 : Hash}
          title={editing ? `Edit round ${editing.round_no}` : `Round ${rounds.length + 1}`}
          description={mode === "cell" ? entryStyle === "tap" ? "Tap a cell once for each egg collected from it." : "Tap a cell, then a number. Typing a number moves to the next cell." : "Enter the eggs collected in this round."}
          action={
            sheet.has_cells ? (
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
                {(["cell", "total"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn("rounded-md px-3 py-1", mode === m ? "bg-slate-900 text-white" : "text-slate-600")}
                  >
                    {m === "cell" ? "By cell" : "Total"}
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <FormField label="Time collected">
              <Input type="time" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className={formInputClass()} />
            </FormField>
            {mode === "total" && (
              <FormField label="Eggs collected" required>
                <Input type="number" min={0} value={totalEggs} onChange={(e) => setTotalEggs(e.target.value)} className={formInputClass()} />
              </FormField>
            )}
            <FormField label={mode === "cell" ? "Broken after collection" : "Broken eggs"} hint={mode === "cell" ? "Not tied to a cell, e.g. while carrying" : undefined}>
              <Input type="number" min={0} value={extraBroken} onChange={(e) => setExtraBroken(e.target.value)} className={formInputClass()} />
            </FormField>
            <FormField label="Avg egg weight (g)">
              <Input type="number" min={0} step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className={formInputClass()} />
            </FormField>
          </div>

          {mode === "cell" && (
            <div className="mt-4 space-y-3">
              {sheet.houses.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {sheet.houses.map((h, i) => (
                    <button
                      key={h.house_id}
                      type="button"
                      onClick={() => {
                        setHouseIdx(i)
                        setRowId(h.rows[0]?.row_id ?? null)
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        i === houseIdx ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                      )}
                    >
                      {h.house_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {currentHouse?.rows.map((r) => (
                  <button
                    key={r.row_id}
                    type="button"
                    onClick={() => setRowId(r.row_id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm",
                      currentRow?.row_id === r.row_id ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700"
                    )}
                  >
                    <span className="font-semibold">{r.code}</span> · {rowTotal(r.cells)}/{rowCapacity(r.cells)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
                  {(["eggs", "broken"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEntering(m)}
                      className={cn(
                        "rounded-md px-3 py-1",
                        entering === m ? (m === "eggs" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white") : "text-slate-600"
                      )}
                    >
                      {m === "eggs" ? "Eggs" : "Broken"}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm" title="How tapping a cell works">
                  {(
                    [
                      ["tap", Hand, "Tap to count"],
                      ["pick", ListOrdered, "Pick number"],
                    ] as const
                  ).map(([style, Icon, label]) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setEntryStyle(style)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-3 py-1",
                        entryStyle === style ? "bg-slate-900 text-white" : "text-slate-600"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
                <Button type="button" size="sm" variant="outline" className="gap-1" disabled={historySize === 0} onClick={undo}>
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </Button>
                <span className="ml-auto text-xs text-slate-500">
                  {unfilled > 0 ? `${unfilled} cells without an entry` : "All cells filled"}
                </span>
              </div>

              {entering === "eggs" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={zeroRestOfRow}>
                    Rest of row {currentRow?.code} = 0
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={fillRow}>
                    Fill row {currentRow?.code} to max
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={clearRow}>
                    Clear row
                  </Button>
                  {nextRow && (
                    <Button type="button" size="sm" className="ml-auto gap-1" onClick={() => goToRow(nextRow)}>
                      Next: row {nextRow.code} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}

              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
                {entryStyle === "tap"
                  ? entering === "eggs"
                    ? "Tap a cell once for each egg: 1 tap = 1 egg, 2 taps = 2 eggs. After the cell's most it goes back to 0. Right-click or long-press takes one off. Typing a number also works."
                    : "Broken mode: tap a cell once for each broken egg. Switch back to Eggs when you're done."
                  : "Tap a cell, then pick its number. You can also type the number on a keyboard; it moves to the next cell."}
              </p>

              {entryStyle === "pick" &&
                focusedCell !== null &&
                (() => {
                  const cell = currentRow?.cells.find((c) => c.id === focusedCell)
                  if (!cell) return null
                  const top = entering === "eggs" ? Math.max(maxFor(cell), cell.birds) : cellEggs[cell.id] ?? 0
                  return (
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 p-2">
                      <span className="mr-1 text-sm font-medium text-slate-700">
                        {cell.label} {entering === "broken" ? "broken" : ""}
                      </span>
                      {Array.from({ length: top + 1 }, (_, n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCellValue(cell, n)}
                          className={cn(
                            "h-9 w-9 rounded-lg border text-sm font-semibold",
                            n > maxFor(cell) && entering === "eggs"
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                      <button type="button" onClick={() => setCellValue(cell, undefined, false)} className="ml-1 text-xs text-slate-500 underline">
                        clear
                      </button>
                    </div>
                  )
                })()}

              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 lg:grid-cols-[repeat(18,minmax(0,1fr))]">
                {currentRow?.cells.map((cell) => {
                  const eggs = cellEggs[cell.id]
                  const broken = cellBroken[cell.id] ?? 0
                  const max = maxFor(cell)
                  const filled = eggs !== undefined
                  const ratio = filled && cell.birds > 0 ? eggs / cell.birds : 0
                  const over = filled && eggs > max
                  return (
                    <button
                      key={cell.id}
                      ref={(el) => {
                        tileRefs.current[cell.id] = el
                      }}
                      type="button"
                      onClick={() => {
                        if (longPressed.current) {
                          longPressed.current = false
                          return
                        }
                        if (entryStyle === "tap") tapCell(cell)
                        else focusCell(cell.id)
                      }}
                      onContextMenu={(e) => {
                        if (entryStyle !== "tap") return
                        e.preventDefault()
                        if (pressTimer.current === null && !longPressed.current) tapCell(cell, -1)
                      }}
                      onPointerDown={(e) => {
                        if (entryStyle !== "tap" || e.pointerType !== "touch") return
                        longPressed.current = false
                        pressTimer.current = window.setTimeout(() => {
                          pressTimer.current = null
                          longPressed.current = true
                          tapCell(cell, -1)
                        }, 500)
                      }}
                      onPointerUp={() => {
                        if (pressTimer.current !== null) window.clearTimeout(pressTimer.current)
                        pressTimer.current = null
                      }}
                      onPointerLeave={() => {
                        if (pressTimer.current !== null) window.clearTimeout(pressTimer.current)
                        pressTimer.current = null
                      }}
                      onFocus={() => setFocusedCell(cell.id)}
                      onKeyDown={(e) => onTileKey(e, cell)}
                      title={`${cell.label}: ${cell.birds} birds${cell.recorded_eggs ? `, ${cell.recorded_eggs} eggs in other rounds` : ""}`}
                      className={cn(
                        "relative flex h-14 select-none flex-col items-center justify-center rounded-md border text-[11px] leading-tight outline-none transition active:scale-95",
                        entryStyle === "tap" && "h-16 touch-manipulation",
                        !filled && "border-dashed border-slate-300 bg-white text-slate-400",
                        filled && ratio >= 1 && "border-emerald-500 bg-emerald-500 text-white",
                        filled && ratio >= 0.5 && ratio < 1 && "border-emerald-300 bg-emerald-200 text-emerald-950",
                        filled && ratio > 0 && ratio < 0.5 && "border-emerald-200 bg-emerald-50 text-emerald-900",
                        filled && ratio === 0 && "border-slate-300 bg-slate-100 text-slate-700",
                        over && "border-amber-500 bg-amber-100 text-amber-900",
                        focusedCell === cell.id && "ring-2 ring-sky-500 ring-offset-1"
                      )}
                    >
                      <span className="font-semibold">{cell.label}</span>
                      <span className="text-sm font-bold">
                        {filled ? eggs : "–"}
                        <span className="text-[10px] font-normal opacity-70">/{max}</span>
                      </span>
                      {broken > 0 && (
                        <span className="absolute right-0.5 top-0.5 rounded bg-rose-600 px-1 text-[9px] font-bold text-white">{broken}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">
                Each tile shows eggs entered / the most the cell can still give today (birds minus eggs in other rounds). Red badges are broken eggs.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FormSummary label="This round" value={`${roundEggs.toLocaleString()} eggs`} />
            <FormSummary label="Broken this round" value={roundBroken.toLocaleString()} />
            <FormSummary label="Good this round" value={Math.max(0, roundEggs - roundBroken).toLocaleString()} />
            <FormSummary
              label={
                <span className="inline-flex items-center gap-1">
                  {roundBroken > roundEggs && <AlertTriangle className="h-3 w-3 text-rose-600" />}
                  Day total so far
                </span>
              }
              value={`${dayEggs.toLocaleString()} eggs`}
            />
          </div>

          <FormField label="Notes" className="mt-4">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={formTextareaClass()} placeholder="Optional" />
          </FormField>

          {editing && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => {
                resetForm(Boolean(sheet.has_cells))
                setShowForm(false)
              }}
            >
              Cancel edit
            </Button>
          )}
        </FormSection>
      )}
    </FormModal>
  )
}

export default RecordEggCollectionModal
