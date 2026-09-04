import { CalendarDays } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RECORDS_DATE_PRESET_OPTIONS, type RecordsDateRangePreset } from "@/lib/dateRange"
import { cn } from "@/lib/utils"

type Props = {
  preset: RecordsDateRangePreset
  onPresetChange: (preset: RecordsDateRangePreset) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
  rangeLabel: string
  className?: string
}

export default function RecordsDateRangeFilter({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  rangeLabel,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end", className)}>
      <div className="space-y-1.5 min-w-[160px]">
        <Label className="text-xs text-slate-500">Date range</Label>
        <Select value={preset} onValueChange={(v) => onPresetChange(v as RecordsDateRangePreset)}>
          <SelectTrigger className="h-9 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECORDS_DATE_PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">From</Label>
            <Input
              type="date"
              className="h-9 w-full sm:w-[150px] bg-white"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">To</Label>
            <Input
              type="date"
              className="h-9 w-full sm:w-[150px] bg-white"
              value={customTo}
              max={undefined}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
            />
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:pb-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>{rangeLabel}</span>
      </div>
    </div>
  )
}
