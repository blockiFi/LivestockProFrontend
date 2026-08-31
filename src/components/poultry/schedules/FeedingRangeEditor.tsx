import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Scissors, Trash2, Wheat } from "lucide-react"
import type { FeedType } from "@/lib/types"
import {
  formatFeedingDayRange,
  parseWeekHelper,
  plannedKgForRange,
  validateFeedingRanges,
} from "@/lib/feeding-range"

export type FeedingRangeDraft = {
  id?: number
  __localId?: string
  feed_type_id: number | null
  start_day: number
  end_day: number | null
  open_ended?: boolean
  quantity: number | string
  feeding_times: Array<{ time: string; percentage: number }>
}

type Props = {
  ranges: FeedingRangeDraft[]
  onChange: (ranges: FeedingRangeDraft[]) => void
  feedTypes: FeedType[]
  flockSizePreview?: number
  disabled?: boolean
  /** When true, show split controls (needs persisted id). */
  allowSplit?: boolean
  onSplit?: (index: number, day: number) => void
}

const defaultTimes = [
  { time: "08:00", percentage: 50 },
  { time: "17:00", percentage: 50 },
]

export default function FeedingRangeEditor({
  ranges,
  onChange,
  feedTypes,
  flockSizePreview = 1000,
  disabled = false,
  allowSplit = false,
  onSplit,
}: Props) {
  const [weekHelper, setWeekHelper] = useState("")
  const [splitDayByIndex, setSplitDayByIndex] = useState<Record<number, string>>({})

  const validation = useMemo(
    () =>
      validateFeedingRanges(
        ranges.map((r, i) => ({
          id: r.id ?? r.__localId ?? i,
          start_day: Number(r.start_day) || 1,
          end_day: r.open_ended || r.end_day == null ? null : Number(r.end_day),
        }))
      ),
    [ranges]
  )

  const updateAt = (index: number, patch: Partial<FeedingRangeDraft>) => {
    onChange(ranges.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeAt = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index))
  }

  const addRange = () => {
    const last = ranges[ranges.length - 1]
    let nextStart = 1
    if (last) {
      if (last.open_ended || last.end_day == null) {
        nextStart = Number(last.start_day) + 1
      } else {
        nextStart = Number(last.end_day) + 1
      }
    }
    onChange([
      ...ranges,
      {
        __localId: `new-${Date.now()}`,
        feed_type_id: feedTypes[0]?.id ?? null,
        start_day: nextStart,
        end_day: nextStart,
        open_ended: false,
        quantity: 40,
        feeding_times: [...defaultTimes],
      },
    ])
  }

  const applyWeekHelper = () => {
    const parsed = parseWeekHelper(weekHelper)
    if (!parsed) return
    onChange([
      ...ranges,
      {
        __localId: `new-${Date.now()}`,
        feed_type_id: feedTypes[0]?.id ?? null,
        start_day: parsed.start_day,
        end_day: parsed.end_day,
        open_ended: false,
        quantity: 40,
        feeding_times: [...defaultTimes],
      },
    ])
    setWeekHelper("")
  }

  const updateTime = (
    rangeIndex: number,
    timeIndex: number,
    field: "time" | "percentage",
    value: string | number
  ) => {
    const range = ranges[rangeIndex]
    const times = [...(range.feeding_times || [])]
    times[timeIndex] = { ...times[timeIndex], [field]: value }
    updateAt(rangeIndex, { feeding_times: times })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Wheat className="h-4 w-4 text-amber-600" />
            Feeding day ranges
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Each range sets grams/bird/day from a start day to an end day (or indefinitely).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Input
              placeholder="Week 1-2"
              value={weekHelper}
              onChange={(e) => setWeekHelper(e.target.value)}
              className="h-8 w-28 text-xs"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={applyWeekHelper}
              disabled={disabled || !parseWeekHelper(weekHelper)}
            >
              Add weeks
            </Button>
          </div>
          <Button type="button" size="sm" className="h-8" onClick={addRange} disabled={disabled}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add range
          </Button>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 space-y-0.5">
          {validation.errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-0.5">
          {validation.warnings.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {ranges.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No ranges yet. Add a day range or use the week helper (e.g. Week 1-2).
          </div>
        )}

        {ranges.map((range, index) => {
          const openEnded = Boolean(range.open_ended || range.end_day == null)
          const qty = Number(range.quantity) || 0
          const previewKg = plannedKgForRange(
            qty,
            flockSizePreview,
            Number(range.start_day) || 1,
            openEnded ? null : Number(range.end_day)
          )
          const timesTotal = (range.feeding_times || []).reduce(
            (s, t) => s + Number(t.percentage || 0),
            0
          )

          return (
            <div
              key={range.id ?? range.__localId ?? index}
              className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {formatFeedingDayRange(
                      Number(range.start_day) || 1,
                      openEnded ? null : Number(range.end_day)
                    )}
                  </Badge>
                  <span className="text-sm font-medium text-slate-800">{qty} g/bird/day</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">From day</Label>
                  <Input
                    type="number"
                    min={1}
                    value={range.start_day}
                    disabled={disabled}
                    onChange={(e) =>
                      updateAt(index, { start_day: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To day</Label>
                  <Input
                    type="number"
                    min={1}
                    value={openEnded ? "" : range.end_day ?? ""}
                    disabled={disabled || openEnded}
                    placeholder={openEnded ? "∞" : ""}
                    onChange={(e) =>
                      updateAt(index, {
                        end_day: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={openEnded}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        updateAt(index, {
                          open_ended: checked,
                          end_day: checked ? null : Number(range.start_day) || 1,
                        })
                      }
                    />
                    <Label className="text-xs">Open-ended</Label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">g / bird / day</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={range.quantity}
                    disabled={disabled}
                    onChange={(e) => updateAt(index, { quantity: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Feed type</Label>
                  <Select
                    value={range.feed_type_id ? String(range.feed_type_id) : ""}
                    disabled={disabled}
                    onValueChange={(v) => updateAt(index, { feed_type_id: Number(v) })}
                  >
                    <SelectTrigger className="h-9">
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
                </div>
                <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                  Preview for {flockSizePreview.toLocaleString()} birds:{" "}
                  <span className="font-semibold text-slate-900">{previewKg.toFixed(1)} kg</span>
                  {openEnded ? " (30-day estimate)" : " across this range"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Feeding times</Label>
                  <span
                    className={`text-xs ${
                      Math.abs(timesTotal - 100) < 0.01 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {timesTotal.toFixed(0)}%
                  </span>
                </div>
                {(range.feeding_times || []).map((ft, ti) => (
                  <div key={ti} className="flex gap-2 items-center">
                    <Input
                      type="time"
                      value={ft.time}
                      disabled={disabled}
                      className="h-8 w-32"
                      onChange={(e) => updateTime(index, ti, "time", e.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={ft.percentage}
                      disabled={disabled}
                      className="h-8 w-24"
                      onChange={(e) =>
                        updateTime(index, ti, "percentage", Number(e.target.value))
                      }
                    />
                    <span className="text-xs text-slate-500">%</span>
                    {(range.feeding_times || []).length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        disabled={disabled}
                        onClick={() =>
                          updateAt(index, {
                            feeding_times: (range.feeding_times || []).filter((_, i) => i !== ti),
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={disabled}
                  onClick={() =>
                    updateAt(index, {
                      feeding_times: [
                        ...(range.feeding_times || []),
                        { time: "12:00", percentage: 0 },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add time
                </Button>
              </div>

              {allowSplit && range.id && !openEnded && onSplit && (
                <div className="flex items-center gap-2 pt-1 border-t">
                  <Input
                    type="number"
                    min={(Number(range.start_day) || 1) + 1}
                    max={Number(range.end_day)}
                    placeholder="Split at day"
                    className="h-8 w-32"
                    value={splitDayByIndex[index] ?? ""}
                    onChange={(e) =>
                      setSplitDayByIndex((prev) => ({ ...prev, [index]: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const day = Number(splitDayByIndex[index])
                      if (day > (Number(range.start_day) || 1)) onSplit(index, day)
                    }}
                  >
                    <Scissors className="h-3.5 w-3.5 mr-1" />
                    Split
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { validateFeedingRanges }
