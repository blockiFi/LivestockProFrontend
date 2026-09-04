import { useMemo, useState } from "react"
import {
  formatDateRangeLabel,
  resolveRecordsDateRange,
  type RecordsDateRangePreset,
} from "@/lib/dateRange"

export function useRecordsDateRange(defaultPreset: RecordsDateRangePreset = "this_month") {
  const [preset, setPreset] = useState<RecordsDateRangePreset>(defaultPreset)
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const { dateFrom, dateTo } = useMemo(
    () => resolveRecordsDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  )

  const rangeLabel = useMemo(() => formatDateRangeLabel(dateFrom, dateTo), [dateFrom, dateTo])

  const handlePresetChange = (next: RecordsDateRangePreset) => {
    setPreset(next)
    if (next !== "custom") {
      setCustomFrom("")
      setCustomTo("")
    } else if (!customFrom && !customTo) {
      const month = resolveRecordsDateRange("this_month", "", "")
      setCustomFrom(month.dateFrom)
      setCustomTo(month.dateTo)
    }
  }

  return {
    preset,
    setPreset: handlePresetChange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
    rangeLabel,
  }
}
