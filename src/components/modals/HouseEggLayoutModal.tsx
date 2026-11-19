import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Bird, Grid3x3, Loader2, Plus, Rows3, Trash2, Users, X } from "lucide-react"
import type { RootState } from "@/store"
import type { FlockRecord, PoultryHouse } from "@/lib/types"
import { getFlocks } from "@/lib/request"
import {
  addHouseEggRow,
  assignHouseEggCells,
  deleteHouseEggRow,
  generateHouseEggLayout,
  getHouseEggLayout,
  nextRowCode,
  parseRowCodes,
  updateHouseEggCells,
  updateHouseEggRow,
  updateHouseEggSettings,
  type HouseEggLayout,
  type HouseLayoutRow,
} from "@/lib/eggCollection"
import { FormField, FormModal, FormSection, FormSummary, formInputClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** Tile colours for flocks sharing a house. */
const FLOCK_COLORS = [
  "bg-sky-100 border-sky-300 text-sky-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-violet-100 border-violet-300 text-violet-900",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-rose-100 border-rose-300 text-rose-900",
  "bg-lime-100 border-lime-300 text-lime-900",
]
const FLOCK_DOTS = ["bg-sky-400", "bg-amber-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400", "bg-lime-400"]

interface HouseEggLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  house: PoultryHouse | null
  canManage?: boolean
}

const HouseEggLayoutModal = ({ isOpen, onClose, house, canManage = true }: HouseEggLayoutModalProps) => {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)

  const [layout, setLayout] = useState<HouseEggLayout | null>(null)
  const [flocks, setFlocks] = useState<FlockRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [lastClicked, setLastClicked] = useState<{ rowId: number; cellNumber: number } | null>(null)

  // Settings
  const [birdsPerCell, setBirdsPerCell] = useState("4")

  // Generate
  const [genCodes, setGenCodes] = useState("A-F")
  const [genCells, setGenCells] = useState("54")
  const [genFlock, setGenFlock] = useState<string>("none")

  // Add row
  const [newRowCode, setNewRowCode] = useState("")
  const [newRowCells, setNewRowCells] = useState("54")

  // Selection actions
  const [assignFlock, setAssignFlock] = useState<string>("")
  const [selectionBirds, setSelectionBirds] = useState("")

  // Row editing
  const [editingRow, setEditingRow] = useState<{ id: number; cells: string; birds: string } | null>(null)

  const apply = (next: HouseEggLayout | undefined) => {
    if (!next) return
    setLayout(next)
    setBirdsPerCell(next.house.birds_per_cell ? String(next.house.birds_per_cell) : "4")
    setNewRowCode(nextRowCode(next.rows.map((r) => r.code)))
  }

  const load = useCallback(async () => {
    if (!token || !farmId || !house) return
    setLoading(true)
    const [layoutRes, flocksRes] = await Promise.all([
      getHouseEggLayout(token, farmId, house.id),
      getFlocks(token, farmId),
    ])
    setLoading(false)
    if (layoutRes.success) apply(layoutRes.data)
    else toast.error(layoutRes.error?.join(", "))
    if (flocksRes.success && flocksRes.data) {
      setFlocks(flocksRes.data.filter((f) => (f.status ?? "active").toLowerCase() === "active"))
    }
  }, [token, farmId, house])

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set())
      setEditingRow(null)
      void load()
    } else {
      setLayout(null)
    }
  }, [isOpen, load])

  const flockName = useCallback(
    (id: number | null) => {
      if (!id) return "Unassigned"
      const f = flocks.find((x) => x.id === id)
      return f?.name || f?.batch_number || layout?.flocks.find((x) => x.id === id)?.name || `Flock #${id}`
    },
    [flocks, layout]
  )

  const flockColorIndex = useMemo(() => {
    const ids = layout?.flocks.map((f) => f.id) ?? []
    return (id: number | null) => (id ? ids.indexOf(id) % FLOCK_COLORS.length : -1)
  }, [layout])

  const run = async (fn: () => Promise<{ success: boolean; data?: HouseEggLayout; error?: string[] }>, ok?: string) => {
    setBusy(true)
    try {
      const res = await fn()
      if (res.success) {
        apply(res.data)
        if (ok) toast.success(ok)
        return true
      }
      toast.error(res.error?.join(", ") || "Something went wrong")
      return false
    } finally {
      setBusy(false)
    }
  }

  if (!house) return null
  const rows = layout?.rows.filter((r) => r.is_active) ?? []
  const cellMode = layout?.house.egg_collection_mode === "cell"

  const toggleCell = (row: HouseLayoutRow, cellNumber: number, cellId: number, shift: boolean) => {
    if (!canManage) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (shift && lastClicked && lastClicked.rowId === row.id) {
        const [a, b] = [lastClicked.cellNumber, cellNumber].sort((x, y) => x - y)
        row.cells.filter((c) => c.is_active && c.cell_number >= a && c.cell_number <= b).forEach((c) => next.add(c.id))
      } else if (next.has(cellId)) {
        next.delete(cellId)
      } else {
        next.add(cellId)
      }
      return next
    })
    setLastClicked({ rowId: row.id, cellNumber })
  }

  const selectRow = (row: HouseLayoutRow) => {
    setSelected((prev) => {
      const ids = row.cells.filter((c) => c.is_active).map((c) => c.id)
      const allIn = ids.every((id) => prev.has(id))
      const next = new Set(prev)
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const assignSelection = async (flockId: number | null) => {
    if (!token || !farmId || selected.size === 0) return
    const ok = await run(
      () => updateHouseEggCells(token, farmId, house.id, [...selected].map((id) => ({ id, flock_id: flockId }))),
      flockId ? `Assigned ${selected.size} cells to ${flockName(flockId)}` : `Cleared ${selected.size} cells`
    )
    if (ok) setSelected(new Set())
  }

  const setSelectionBirdCount = async () => {
    const birds = parseInt(selectionBirds, 10)
    if (!token || !farmId || selected.size === 0 || Number.isNaN(birds) || birds < 0) return
    const ok = await run(
      () => updateHouseEggCells(token, farmId, house.id, [...selected].map((id) => ({ id, birds }))),
      `Set ${selected.size} cells to ${birds} birds`
    )
    if (ok) {
      setSelected(new Set())
      setSelectionBirds("")
    }
  }

  const generate = async () => {
    if (!token || !farmId) return
    const codes = parseRowCodes(genCodes)
    const cells = parseInt(genCells, 10)
    const birds = parseInt(birdsPerCell, 10)
    if (codes.length === 0) return toast.error("Enter row letters, e.g. A-F")
    if (!cells || cells < 1) return toast.error("Enter how many cells each row has")
    if (!birds || birds < 1) return toast.error("Enter how many birds each cell holds")
    await run(
      () =>
        generateHouseEggLayout(token, farmId, house.id, {
          codes,
          cells_per_row: cells,
          birds_per_cell: birds,
          flock_id: genFlock !== "none" ? Number(genFlock) : null,
        }),
      `Created ${codes.length} rows × ${cells} cells`
    )
  }

  const saveSettings = async (mode?: "total" | "cell", applyToCells = false) => {
    if (!token || !farmId) return
    const birds = parseInt(birdsPerCell, 10)
    await run(
      () =>
        updateHouseEggSettings(token, farmId, house.id, {
          ...(mode ? { egg_collection_mode: mode } : {}),
          birds_per_cell: birds > 0 ? birds : null,
          apply_birds_to_cells: applyToCells,
        }),
      mode ? (mode === "cell" ? "Cell collection turned on" : "Cell collection turned off") : "Settings saved"
    )
  }

  const addRow = async () => {
    if (!token || !farmId) return
    const cells = parseInt(newRowCells, 10)
    if (!newRowCode.trim() || !cells) return toast.error("Enter a row letter and number of cells")
    await run(() => addHouseEggRow(token, farmId, house.id, { code: newRowCode, cell_count: cells }), `Row ${newRowCode.toUpperCase()} added`)
  }

  const saveRow = async () => {
    if (!token || !farmId || !editingRow) return
    const cells = parseInt(editingRow.cells, 10)
    const birds = editingRow.birds.trim() === "" ? null : parseInt(editingRow.birds, 10)
    const ok = await run(
      () =>
        updateHouseEggRow(token, farmId, house.id, editingRow.id, {
          cell_count: cells,
          birds_per_cell: birds,
          apply_birds_to_cells: true,
        }),
      "Row updated"
    )
    if (ok) setEditingRow(null)
  }

  const removeRow = async (row: HouseLayoutRow) => {
    if (!token || !farmId) return
    if (!window.confirm(`Remove row ${row.code}? Rows with recorded eggs are hidden instead of deleted.`)) return
    await run(() => deleteHouseEggRow(token, farmId, house.id, row.id), `Row ${row.code} removed`)
  }

  const assignWholeRow = async (row: HouseLayoutRow, flockId: number | null) => {
    if (!token || !farmId) return
    await run(
      () => assignHouseEggCells(token, farmId, house.id, { flock_id: flockId, row_ids: [row.id] }),
      flockId ? `Row ${row.code} assigned to ${flockName(flockId)}` : `Row ${row.code} cleared`
    )
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => !open && !busy && onClose()}
      title="Egg collection layout"
      description={`${house.name}: rows, cells, birds per cell and which flock is in each cell.`}
      icon={Grid3x3}
      tone="flock"
      size="full"
      busy={busy}
    >
      {loading || !layout ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading layout…
        </div>
      ) : (
        <>
          <FormSection
            step={1}
            icon={Bird}
            title="Cell collection"
            description="When on, flocks in this house can record eggs per cell (A1, A2…) as well as a total."
            action={
              canManage ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">{cellMode ? "On" : "Off"}</span>
                  <Switch
                    checked={cellMode}
                    disabled={busy}
                    onCheckedChange={(v) => void saveSettings(v ? "cell" : "total")}
                  />
                </div>
              ) : null
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <FormField label="Birds per cell" hint="Default for every cell; rows and single cells can differ.">
                <Input
                  type="number"
                  min={1}
                  value={birdsPerCell}
                  disabled={!canManage}
                  onChange={(e) => setBirdsPerCell(e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              {canManage && rows.length > 0 && (
                <div className="flex items-end gap-2 sm:col-span-3">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void saveSettings()}>
                    Save
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void saveSettings(undefined, true)}>
                    Save and apply to all cells
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <FormSummary label="Rows" value={layout.summary.rows} />
              <FormSummary label="Cells" value={layout.summary.cells.toLocaleString()} />
              <FormSummary label="Birds in cells" value={layout.summary.birds.toLocaleString()} />
              <FormSummary label="Unassigned cells" value={layout.summary.unassigned_cells.toLocaleString()} />
            </div>
          </FormSection>

          {canManage && rows.length === 0 && (
            <FormSection step={2} icon={Rows3} title="Create the layout" description="Like your paper register: one letter per row, numbered cells.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <FormField label="Rows" hint="A range (A-F) or a list (A, B, C)">
                  <Input value={genCodes} onChange={(e) => setGenCodes(e.target.value)} className={formInputClass()} />
                </FormField>
                <FormField label="Cells per row">
                  <Input type="number" min={1} value={genCells} onChange={(e) => setGenCells(e.target.value)} className={formInputClass()} />
                </FormField>
                <FormField label="Assign all cells to">
                  <Select value={genFlock} onValueChange={setGenFlock}>
                    <SelectTrigger className={formInputClass()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No flock yet</SelectItem>
                      {flocks.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.name || f.batch_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="flex items-end">
                  <Button type="button" className="w-full" disabled={busy} onClick={() => void generate()}>
                    Create layout
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {(() => {
                  const codes = parseRowCodes(genCodes).length
                  const cells = parseInt(genCells, 10) || 0
                  const birds = parseInt(birdsPerCell, 10) || 0
                  return `${codes} rows × ${cells} cells = ${(codes * cells).toLocaleString()} cells, ${(codes * cells * birds).toLocaleString()} birds at ${birds} per cell.`
                })()}
              </p>
            </FormSection>
          )}

          {rows.length > 0 && (
            <FormSection
              step={2}
              icon={Users}
              title="Cells and flocks"
              description="Each tile shows the cell and its birds (red when it differs from the row). Tap cells to select them, shift-click for a range, then assign a flock or change the bird count."
            >
              {layout.flocks.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  {layout.flocks.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1.5">
                      <span className={cn("h-2.5 w-2.5 rounded-full", FLOCK_DOTS[flockColorIndex(f.id)])} />
                      {flockName(f.id)}: {f.cells} cells, {f.birds.toLocaleString()} birds
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" /> Unassigned
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {rows.map((row) => {
                  const activeCells = row.cells.filter((c) => c.is_active)
                  const rowBirds = activeCells.reduce((s, c) => s + c.birds, 0)
                  const isEditing = editingRow?.id === row.id
                  return (
                    <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                          {row.code}
                        </span>
                        <span className="text-sm text-slate-600">
                          {activeCells.length} cells · {row.effective_birds_per_cell} birds per cell
                          {row.birds_per_cell ? " (row setting)" : ""} · {rowBirds.toLocaleString()} birds
                        </span>
                        {canManage && (
                          <div className="ml-auto flex flex-wrap items-center gap-1.5">
                            <Button type="button" size="sm" variant="ghost" onClick={() => selectRow(row)}>
                              Select row
                            </Button>
                            <Select onValueChange={(v) => void assignWholeRow(row, v === "none" ? null : Number(v))}>
                              <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue placeholder="Assign row to…" />
                              </SelectTrigger>
                              <SelectContent>
                                {flocks.map((f) => (
                                  <SelectItem key={f.id} value={String(f.id)}>
                                    {f.name || f.batch_number}
                                  </SelectItem>
                                ))}
                                <SelectItem value="none">Clear (no flock)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingRow(
                                  isEditing
                                    ? null
                                    : { id: row.id, cells: String(row.cell_count), birds: row.birds_per_cell ? String(row.birds_per_cell) : "" }
                                )
                              }
                            >
                              Edit
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => void removeRow(row)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {isEditing && editingRow && (
                        <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
                          <FormField label="Cells in row">
                            <Input
                              type="number"
                              min={1}
                              value={editingRow.cells}
                              onChange={(e) => setEditingRow({ ...editingRow, cells: e.target.value })}
                              className={formInputClass()}
                            />
                          </FormField>
                          <FormField label="Birds per cell (this row)" hint="Leave empty to use the house setting">
                            <Input
                              type="number"
                              min={1}
                              value={editingRow.birds}
                              onChange={(e) => setEditingRow({ ...editingRow, birds: e.target.value })}
                              className={formInputClass()}
                            />
                          </FormField>
                          <div className="flex items-end gap-2 sm:col-span-2">
                            <Button type="button" disabled={busy} onClick={() => void saveRow()}>
                              Save row
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setEditingRow(null)}>
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 sm:col-span-4">
                            Saving resets every cell in this row to the row's bird count.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 lg:grid-cols-[repeat(18,minmax(0,1fr))]">
                        {activeCells.map((cell) => {
                          const colorIdx = flockColorIndex(cell.flock_id)
                          const isSelected = selected.has(cell.id)
                          const fewer = cell.birds !== row.effective_birds_per_cell
                          return (
                            <button
                              key={cell.id}
                              type="button"
                              title={`${cell.label} · ${cell.birds} birds · ${flockName(cell.flock_id)}`}
                              onClick={(e) => toggleCell(row, cell.cell_number, cell.id, e.shiftKey)}
                              className={cn(
                                "flex h-11 flex-col items-center justify-center rounded-md border text-[11px] leading-tight transition",
                                colorIdx >= 0 ? FLOCK_COLORS[colorIdx] : "border-slate-200 bg-white text-slate-500",
                                isSelected && "ring-2 ring-slate-900 ring-offset-1",
                                canManage ? "cursor-pointer hover:brightness-95" : "cursor-default"
                              )}
                            >
                              <span className="font-semibold">{cell.label}</span>
                              <span className={cn(fewer && "font-bold text-rose-700")}>{cell.birds}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {canManage && (
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-4">
                  <FormField label="New row letter">
                    <Input value={newRowCode} onChange={(e) => setNewRowCode(e.target.value.toUpperCase())} className={formInputClass()} />
                  </FormField>
                  <FormField label="Cells">
                    <Input type="number" min={1} value={newRowCells} onChange={(e) => setNewRowCells(e.target.value)} className={formInputClass()} />
                  </FormField>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void addRow()}>
                      <Plus className="mr-1 h-4 w-4" /> Add row
                    </Button>
                  </div>
                </div>
              )}
            </FormSection>
          )}

          {canManage && selected.size > 0 && (
            <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-3 shadow-lg">
              <span className="text-sm font-medium text-slate-900">{selected.size} cells selected</span>
              <Select value={assignFlock} onValueChange={setAssignFlock}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Choose flock" />
                </SelectTrigger>
                <SelectContent>
                  {flocks.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name || f.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" disabled={busy || !assignFlock} onClick={() => void assignSelection(Number(assignFlock))}>
                Assign
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void assignSelection(null)}>
                Unassign
              </Button>
              <span className="mx-1 h-6 w-px bg-slate-200" />
              <Input
                type="number"
                min={0}
                placeholder="Birds"
                value={selectionBirds}
                onChange={(e) => setSelectionBirds(e.target.value)}
                className="h-9 w-24"
              />
              <Button type="button" size="sm" variant="outline" disabled={busy || selectionBirds === ""} onClick={() => void setSelectionBirdCount()}>
                Set birds
              </Button>
              <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
                <X className="mr-1 h-4 w-4" /> Clear selection
              </Button>
            </div>
          )}
        </>
      )}
    </FormModal>
  )
}

export default HouseEggLayoutModal
