import { useState, useEffect, useRef, useMemo } from "react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  CalendarIcon,
  Loader2,
  Skull,
  Scissors,
  Wheat,
  Droplets,
  Weight,
  Thermometer,
  Sun,
  Egg,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Lock,
  Bird,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react"
import { cn, Naira, formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { getFeedingBatchItemByDate, getMortalityByFlockAndDate } from "@/lib/request"
import type { FeedInventoryType, FeedType } from "@/lib/types"
import {
  effectiveFeedAgeRange,
  flockAgeDaysOnDate,
  formatFeedAgeRange,
  isFeedTypeAgeAppropriate,
} from "@/lib/feed-age"
import type { DailyRecordFormData } from "./dailyRecordForm"
import { DailyRecordFieldInput } from "./DailyRecordFieldInput"

interface DailyRecordEntryRowProps {
  rowIndex: number
  data: DailyRecordFormData
  errors: Record<string, string>
  onChange: (patch: Partial<DailyRecordFormData>) => void
  onClearError: (field: keyof DailyRecordFormData) => void
  flockId: number
  flockQuantity: number
  farmId: number
  token: string
  poultryType: string
  flockArrivalDate?: string
  flockArrivalAgeDays?: number
  feedInventories?: FeedInventoryType[]
  feedTypes?: FeedType[]
  isActive: boolean
  expanded: boolean
  onToggleExpand: () => void
  onRemove: () => void
  canRemove: boolean
  skipAutoFill?: boolean
  submitError?: string
}

const DailyRecordEntryRow = ({
  rowIndex,
  data,
  errors,
  onChange,
  onClearError,
  flockId,
  flockQuantity,
  farmId,
  token,
  poultryType,
  flockArrivalDate,
  flockArrivalAgeDays = 0,
  feedInventories = [],
  feedTypes = [],
  isActive,
  expanded,
  onToggleExpand,
  onRemove,
  canRemove,
  skipAutoFill = false,
  submitError,
}: DailyRecordEntryRowProps) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [feedLocked, setFeedLocked] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedPerBirdGrams, setFeedPerBirdGrams] = useState(0)
  const [plannedFeedKg, setPlannedFeedKg] = useState<number | null>(null)
  const [existingMortality, setExistingMortality] = useState(0)
  const [mortalityLoading, setMortalityLoading] = useState(false)
  const [mortalityReportCount, setMortalityReportCount] = useState(0)
  const onChangeRef = useRef(onChange)
  const lastFetchedDateRef = useRef<string | null>(null)
  const lastAutoInventoryDateRef = useRef<string | null>(null)

  onChangeRef.current = onChange

  const isLayerType = poultryType.toLowerCase() !== "broiler"
  const idPrefix = `entry-${rowIndex}`

  const flockAgeOnDate = useMemo(() => {
    if (!flockArrivalDate || !data.date) return null
    return flockAgeDaysOnDate(flockArrivalDate, flockArrivalAgeDays, data.date)
  }, [flockArrivalDate, flockArrivalAgeDays, data.date])

  const feedTypeById = useMemo(() => {
    const map = new Map<number, FeedType>()
    feedTypes.forEach((ft) => map.set(ft.id, ft))
    feedInventories.forEach((inv) => {
      if (inv.feed_type) map.set(inv.poultry_feed_type_id, inv.feed_type)
    })
    return map
  }, [feedTypes, feedInventories])

  const availableInventories = useMemo(() => {
    const inStock = feedInventories.filter((inv) => {
      const status = (inv.status || "").toLowerCase()
      const qty = Number(inv.quantity)
      const isSelected = inv.id === data.poultry_feed_inventory_id
      if (isSelected) return true
      return (status === "available" || status === "in_use") && qty > 0
    })

    return [...inStock].sort((a, b) => {
      if (flockAgeOnDate == null) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      const typeA = feedTypeById.get(a.poultry_feed_type_id)
      const typeB = feedTypeById.get(b.poultry_feed_type_id)
      const okA = typeA ? isFeedTypeAgeAppropriate(typeA, flockAgeOnDate) : false
      const okB = typeB ? isFeedTypeAgeAppropriate(typeB, flockAgeOnDate) : false
      if (okA !== okB) return okA ? -1 : 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }, [feedInventories, data.poultry_feed_inventory_id, flockAgeOnDate, feedTypeById])

  const selectedInventory = availableInventories.find((inv) => inv.id === data.poultry_feed_inventory_id)
    ?? feedInventories.find((inv) => inv.id === data.poultry_feed_inventory_id)

  const selectedFeedType = selectedInventory
    ? feedTypeById.get(selectedInventory.poultry_feed_type_id)
    : undefined

  const ageWarning = useMemo(() => {
    if (!selectedFeedType || flockAgeOnDate == null) return null
    if (isFeedTypeAgeAppropriate(selectedFeedType, flockAgeOnDate)) return null
    const { start, end } = effectiveFeedAgeRange(selectedFeedType)
    const rangeLabel = formatFeedAgeRange(start, end)
    if (!rangeLabel) return null
    return `${selectedFeedType.name} is intended for day ${rangeLabel}; this flock is on day ${flockAgeOnDate}`
  }, [selectedFeedType, flockAgeOnDate])

  // Pre-select the best age-appropriate (or oldest in-stock) batch when date changes.
  useEffect(() => {
    if (!isActive || skipAutoFill || !data.date) return
    if (lastAutoInventoryDateRef.current === data.date && data.poultry_feed_inventory_id) return
    if (availableInventories.length === 0) return

    const best = availableInventories[0]
    if (!best) return

    if (data.poultry_feed_inventory_id !== best.id) {
      onChangeRef.current({ poultry_feed_inventory_id: best.id })
    }
    lastAutoInventoryDateRef.current = data.date
  }, [isActive, skipAutoFill, data.date, data.poultry_feed_inventory_id, availableInventories])

  const handleInputChange = (field: keyof DailyRecordFormData, value: string | number | null) => {
    onChange({ [field]: value })
    onClearError(field)
  }

  useEffect(() => {
    if (!isActive || !data.date || skipAutoFill) {
      if (!isActive) {
        lastFetchedDateRef.current = null
      }
      return
    }
    if (lastFetchedDateRef.current === data.date) return

    lastFetchedDateRef.current = data.date
    let cancelled = false

    const loadDateData = async () => {
      if (!token || !farmId || !flockId) return

      setFeedLoading(true)
      setMortalityLoading(true)

      try {
        const [feedResponse, mortalityResponse] = await Promise.all([
          getFeedingBatchItemByDate(token, farmId, flockId, data.date),
          getMortalityByFlockAndDate(token, farmId, flockId, data.date),
        ])

        if (cancelled) return

        if (feedResponse.success && feedResponse.data) {
          const item = feedResponse.data
          const isExecuted = Boolean(item.id)
          const perBirdGrams = isExecuted && item.actual_quantity != null
            ? parseFloat(item.actual_quantity)
            : item.planned_quantity != null
              ? parseFloat(item.planned_quantity)
              : item.schedule_item?.quantity != null
                ? parseFloat(item.schedule_item.quantity)
                : 0
          const totalFeedKg = perBirdGrams > 0
            ? parseFloat(((perBirdGrams * flockQuantity) / 1000).toFixed(2))
            : 0

          setFeedPerBirdGrams(perBirdGrams)
          setPlannedFeedKg(totalFeedKg > 0 ? totalFeedKg : null)
          setFeedLocked(isExecuted && totalFeedKg > 0)

          if (totalFeedKg > 0) {
            onChangeRef.current({ feed_consumed_kg: totalFeedKg })
          }
        } else {
          setFeedPerBirdGrams(0)
          setPlannedFeedKg(null)
          setFeedLocked(false)
        }

        if (mortalityResponse.success && mortalityResponse.data && mortalityResponse.data.total_mortality > 0) {
          onChangeRef.current({ mortality: mortalityResponse.data.total_mortality })
          setExistingMortality(mortalityResponse.data.total_mortality)
          setMortalityReportCount(mortalityResponse.data.report_count)
        } else {
          setExistingMortality(0)
          setMortalityReportCount(0)
        }
      } catch {
        if (!cancelled) {
          setFeedLocked(false)
          setExistingMortality(0)
          setMortalityReportCount(0)
        }
      } finally {
        if (!cancelled) {
          setFeedLoading(false)
          setMortalityLoading(false)
        }
      }
    }

    void loadDateData()

    return () => {
      cancelled = true
    }
  }, [isActive, data.date, skipAutoFill, token, farmId, flockId, flockQuantity])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const validDate = new Date(date)
      validDate.setHours(12, 0, 0, 0)
      const formattedDate = format(validDate, "yyyy-MM-dd")
      lastFetchedDateRef.current = null
      setFeedLocked(false)
      setFeedPerBirdGrams(0)
      setExistingMortality(0)
      setMortalityReportCount(0)
      onChange({ date: formattedDate, feed_consumed_kg: 0, mortality: 0 })
      setShowCalendar(false)
      onClearError("date")
    }
  }

  const headerLabel = data.date
    ? format(new Date(data.date + "T12:00:00"), "MMM d, yyyy")
    : "Select date"

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden",
      errors.date || submitError ? "border-red-300" : "border-gray-200"
    )}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-blue-700"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          {headerLabel}
          {data.mortality > 0 && (
            <span className="text-xs font-normal text-red-600">· {data.mortality} mortality</span>
          )}
          {data.feed_consumed_kg > 0 && (
            <span className="text-xs font-normal text-amber-700">· {data.feed_consumed_kg} kg feed</span>
          )}
        </button>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {submitError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              Record Date <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                errors.date ? "border-red-400 bg-red-50" : "border-gray-300",
                showCalendar && "border-blue-500 ring-2 ring-blue-100"
              )}
            >
              <span className={data.date ? "text-gray-900 font-medium" : "text-gray-400"}>
                {data.date
                  ? format(new Date(data.date + "T12:00:00"), "EEEE, MMMM d, yyyy")
                  : "Select a date"}
              </span>
              {showCalendar ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>
            {showCalendar && (
              <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={data.date ? new Date(data.date + "T12:00:00") : undefined}
                  onSelect={handleDateSelect}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Skull className="h-4 w-4 text-red-500" />
              Health &amp; Mortality
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-mortality`} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Skull className="h-3.5 w-3.5 text-red-400" />
                  Mortality
                </Label>
                <div className="relative">
                  <Input
                    id={`${idPrefix}-mortality`}
                    type="number"
                    min={0}
                    value={data.mortality}
                    onChange={(e) => handleInputChange("mortality", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    disabled={mortalityLoading}
                    className={cn(
                      "h-9 text-sm",
                      errors.mortality && "border-red-400 focus-visible:ring-red-300",
                      existingMortality > 0 && "border-amber-300"
                    )}
                  />
                  {mortalityLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    </div>
                  )}
                </div>
                {existingMortality > 0 && (
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 mt-1">
                    <span className="font-semibold">Existing records:</span>{" "}
                    {existingMortality} total from {mortalityReportCount} report{mortalityReportCount !== 1 ? "s" : ""} on this date
                  </div>
                )}
                {errors.mortality && <p className="text-xs text-red-500">{errors.mortality}</p>}
              </div>
              <DailyRecordFieldInput
                id={`${idPrefix}-culls`}
                label="Culls"
                icon={<Scissors className="h-3.5 w-3.5 text-orange-400" />}
                min={0}
                value={data.culls}
                onChange={(v) => handleInputChange("culls", parseInt(v) || 0)}
                error={errors.culls}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              Feed &amp; Water
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-feed`} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Wheat className="h-3.5 w-3.5 text-amber-400" />
                  Feed Consumed (kg)
                  {feedLocked && <Lock className="h-3 w-3 text-amber-600" />}
                </Label>
                <div className="relative">
                  <Input
                    id={`${idPrefix}-feed`}
                    type="number"
                    min={0}
                    step={0.1}
                    value={data.feed_consumed_kg}
                    onChange={(e) => handleInputChange("feed_consumed_kg", parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    disabled={feedLocked || feedLoading}
                    className={cn(
                      "h-9 text-sm",
                      errors.feed_consumed_kg && "border-red-400 focus-visible:ring-red-300",
                      feedLocked && "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                    )}
                  />
                  {feedLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    </div>
                  )}
                </div>
                {feedLocked && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-1">
                    <span className="font-semibold">From feeding schedule:</span>{" "}
                    {feedPerBirdGrams}g per bird × {flockQuantity.toLocaleString()} birds = {data.feed_consumed_kg} kg
                  </div>
                )}
                {!feedLocked && plannedFeedKg !== null && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1.5 mt-1">
                    <span className="font-semibold">Planned:</span>{" "}
                    {feedPerBirdGrams}g per bird × {flockQuantity.toLocaleString()} birds = {plannedFeedKg} kg — you can adjust this value.
                  </div>
                )}
                {errors.feed_consumed_kg && <p className="text-xs text-red-500">{errors.feed_consumed_kg}</p>}
              </div>
              <DailyRecordFieldInput
                id={`${idPrefix}-water`}
                label="Water Consumed (L)"
                icon={<Droplets className="h-3.5 w-3.5 text-blue-400" />}
                min={0}
                step={0.1}
                value={data.water_consumed_liters}
                onChange={(v) => handleInputChange("water_consumed_liters", parseFloat(v) || 0)}
                error={errors.water_consumed_liters}
                placeholder="0.0"
              />
            </div>

            {availableInventories.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-400" />
                  Feed inventory batch
                </Label>
                <Select
                  value={data.poultry_feed_inventory_id ? String(data.poultry_feed_inventory_id) : undefined}
                  onValueChange={(value) => handleInputChange("poultry_feed_inventory_id", parseInt(value, 10))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select inventory batch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInventories.map((inventory) => {
                      const feedType = feedTypeById.get(inventory.poultry_feed_type_id)
                      const { start, end } = feedType ? effectiveFeedAgeRange(feedType) : { start: null, end: null }
                      const rangeLabel = formatFeedAgeRange(start, end)
                      return (
                        <SelectItem key={inventory.id} value={String(inventory.id)}>
                          <div>
                            <div className="font-medium">
                              {feedType?.name ? `${feedType.name} · ` : ""}
                              Batch {inventory.batch_number} — {inventory.manufacturer}
                            </div>
                            <div className="text-sm text-gray-500">
                              Available: {inventory.quantity} kg | {Naira}{formatCurrency(Number(inventory.unit_cost))}/kg
                            </div>
                            {rangeLabel && (
                              <div className="text-xs text-gray-400">Age: {rangeLabel} days</div>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {ageWarning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{ageWarning}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-green-500" />
              Weight &amp; Environment
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <DailyRecordFieldInput
                id={`${idPrefix}-min-weight`}
                label="Min Weight (g)"
                icon={<Weight className="h-3.5 w-3.5 text-blue-400" />}
                min={0}
                value={data.min_weight_grams}
                onChange={(v) => handleInputChange("min_weight_grams", parseInt(v) || 0)}
                error={errors.min_weight_grams}
                placeholder="0"
              />
              <DailyRecordFieldInput
                id={`${idPrefix}-avg-weight`}
                label="Avg Weight (g)"
                icon={<Weight className="h-3.5 w-3.5 text-green-400" />}
                min={0}
                value={data.avg_weight_grams}
                onChange={(v) => handleInputChange("avg_weight_grams", parseInt(v) || 0)}
                error={errors.avg_weight_grams}
                placeholder="0"
              />
              <DailyRecordFieldInput
                id={`${idPrefix}-max-weight`}
                label="Max Weight (g)"
                icon={<Weight className="h-3.5 w-3.5 text-orange-400" />}
                min={0}
                value={data.max_weight_grams}
                onChange={(v) => handleInputChange("max_weight_grams", parseInt(v) || 0)}
                error={errors.max_weight_grams}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DailyRecordFieldInput
                id={`${idPrefix}-sample-size`}
                label="Sample Size"
                icon={<Bird className="h-3.5 w-3.5 text-purple-400" />}
                min={0}
                max={flockQuantity}
                value={data.sample_size}
                onChange={(v) => handleInputChange("sample_size", parseInt(v) || 0)}
                error={errors.sample_size}
                placeholder="0"
              />
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Bird className="h-3.5 w-3.5 text-green-400" />
                  Current Bird Count
                </Label>
                <Input type="number" value={flockQuantity} disabled className="h-9 text-sm bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DailyRecordFieldInput
                id={`${idPrefix}-humidity`}
                label="Humidity (%)"
                icon={<Droplets className="h-3.5 w-3.5 text-teal-400" />}
                min={0}
                max={100}
                value={data.humidity}
                onChange={(v) => handleInputChange("humidity", parseInt(v) || 0)}
                error={errors.humidity}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <DailyRecordFieldInput
                id={`${idPrefix}-min-temp`}
                label="Min Temp (°C)"
                icon={<Thermometer className="h-3.5 w-3.5 text-blue-400" />}
                step={0.1}
                value={data.min_temperature}
                onChange={(v) => handleInputChange("min_temperature", parseFloat(v) || 0)}
                error={errors.min_temperature}
                placeholder="0"
              />
              <DailyRecordFieldInput
                id={`${idPrefix}-max-temp`}
                label="Max Temp (°C)"
                icon={<Thermometer className="h-3.5 w-3.5 text-red-400" />}
                step={0.1}
                value={data.max_temperature}
                onChange={(v) => handleInputChange("max_temperature", parseFloat(v) || 0)}
                error={errors.max_temperature}
                placeholder="0"
              />
              <DailyRecordFieldInput
                id={`${idPrefix}-light-hours`}
                label="Light Hours"
                icon={<Sun className="h-3.5 w-3.5 text-yellow-400" />}
                min={0}
                max={24}
                step={0.1}
                value={data.light_hours}
                onChange={(v) => handleInputChange("light_hours", parseFloat(v) || 0)}
                error={errors.light_hours}
                placeholder="0"
              />
            </div>
          </div>

          {isLayerType && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                <Egg className="h-4 w-4 text-yellow-600" />
                Egg Production
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DailyRecordFieldInput
                  id={`${idPrefix}-eggs`}
                  label="Eggs Collected"
                  icon={<Egg className="h-3.5 w-3.5 text-yellow-500" />}
                  min={0}
                  value={data.eggs_collected}
                  onChange={(v) => handleInputChange("eggs_collected", parseInt(v) || 0)}
                  error={errors.eggs_collected}
                  placeholder="0"
                />
                <DailyRecordFieldInput
                  id={`${idPrefix}-eggs-broken`}
                  label="Eggs Broken"
                  icon={<Egg className="h-3.5 w-3.5 text-red-400" />}
                  min={0}
                  value={data.eggs_broken}
                  onChange={(v) => handleInputChange("eggs_broken", parseInt(v) || 0)}
                  error={errors.eggs_broken}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-notes`} className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-500" />
              Notes
            </Label>
            <Textarea
              id={`${idPrefix}-notes`}
              value={data.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional observations or notes..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyRecordEntryRow
