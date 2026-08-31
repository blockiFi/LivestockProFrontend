import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { DashboardDatePreset, Farm } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, LoaderCircle, RefreshCw } from "lucide-react"
import { useState } from "react"
import type { DateRange } from "react-day-picker"

const PRESETS: { id: DashboardDatePreset; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "ytd", label: "YTD" },
  { id: "lifetime", label: "All" },
]

type Props = {
  title?: string
  farm: Farm | null
  startDate: string
  endDate: string
  periodDays: number
  activeFlocks: number
  preset: DashboardDatePreset
  loading?: boolean
  onPresetChange: (preset: DashboardDatePreset) => void
  onCustomRange: (from: Date, to: Date) => void
  onRefresh: () => void
}

const DashboardHeader = ({
  title = "Poultry Farm Dashboard",
  farm,
  startDate,
  endDate,
  periodDays,
  activeFlocks,
  preset,
  loading,
  onPresetChange,
  onCustomRange,
  onRefresh,
}: Props) => {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(startDate),
    to: new Date(endDate),
  })

  const applyCustom = () => {
    if (!range?.from || !range?.to) return
    onCustomRange(range.from, range.to)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {farm ? (
            <>
              {farm.name} ·{" "}
              {format(new Date(startDate), "MMM d, yyyy")} –{" "}
              {format(new Date(endDate), "MMM d, yyyy")}
            </>
          ) : (
            "Farm overview"
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {activeFlocks} active flock{activeFlocks === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {periodDays} day period
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={loading}
              onClick={() => onPresetChange(p.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                preset === p.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                preset === "custom" && "border-slate-900",
              )}
              disabled={loading}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={setRange}
              disabled={(date) => date > new Date()}
              initialFocus
            />
            <div className="mt-3 flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!range?.from || !range?.to}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  )
}

export default DashboardHeader
