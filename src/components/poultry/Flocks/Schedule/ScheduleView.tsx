import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EditScheduleModal from "@/components/modals/EditScheduleModal"
import { formatFeedingDayRange } from "@/lib/feeding-range"
import { GetToken, getFarm } from "@/lib/request"
import type { RootState } from "@/store"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Pill,
  Shield,
  Wheat,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { useSelector } from "react-redux"

type ScheduleKind = "medication" | "vaccination" | "feeding"

const typeConfig: Record<
  ScheduleKind,
  {
    label: string
    accent: string
    iconWrap: string
    icon: ReactNode
  }
> = {
  medication: {
    label: "Medication",
    accent: "border-l-violet-500",
    iconWrap: "bg-violet-50 text-violet-600",
    icon: <Pill className="h-4 w-4" />,
  },
  vaccination: {
    label: "Vaccination",
    accent: "border-l-sky-500",
    iconWrap: "bg-sky-50 text-sky-600",
    icon: <Shield className="h-4 w-4" />,
  },
  feeding: {
    label: "Feeding",
    accent: "border-l-amber-500",
    iconWrap: "bg-amber-50 text-amber-700",
    icon: <Wheat className="h-4 w-4" />,
  },
}

function feedingSpanLabel(items: any[]): string | null {
  if (!items?.length) return null
  let minStart = Infinity
  let maxEnd: number | null = 0
  let hasOpen = false
  for (const item of items) {
    const start = Number(item.start_day ?? item.feeding_day ?? 1)
    minStart = Math.min(minStart, start)
    if (item.end_day === null || item.is_open_ended || item.open_ended) {
      hasOpen = true
    } else {
      const end = Number(item.end_day ?? item.feeding_day ?? start)
      if (maxEnd !== null) maxEnd = Math.max(maxEnd, end)
    }
  }
  if (!Number.isFinite(minStart)) return null
  return formatFeedingDayRange(minStart, hasOpen ? null : maxEnd)
}

function FeedingItemRow({ item }: { item: any }) {
  const totalQty = Number(item.quantity) || 0
  const feedingTimes = Array.isArray(item.feeding_times) ? item.feeding_times : []
  const feedName =
    item.feed_type?.name || item.feedType?.name || `Feed Type #${item.feed_type_id ?? "—"}`
  const dayLabel = formatFeedingDayRange(
    item.start_day ?? item.feeding_day ?? 1,
    item.end_day === undefined
      ? (item.feeding_day ?? item.start_day ?? 1)
      : item.end_day
  )

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-lg bg-amber-50 p-2 text-amber-700">
            <Wheat className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{feedName}</p>
            <p className="text-sm text-slate-500 mt-0.5">{dayLabel}</p>
          </div>
        </div>
        <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            g / bird / day
          </p>
          <p className="text-base font-semibold text-slate-900 tabular-nums">
            {totalQty.toFixed(1)}
          </p>
        </div>
      </div>

      {feedingTimes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-11 sm:pl-0">
          {feedingTimes.map((t: any, idx: number) => {
            const pct = Number(t.percentage) || 0
            const grams = (totalQty * pct) / 100
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="font-medium">{t.time}</span>
                <span className="text-slate-300">·</span>
                <span>{pct}%</span>
                <span className="text-slate-300">·</span>
                <span className="tabular-nums">{grams.toFixed(1)}g</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MedVacItemRow({
  item,
  kind,
}: {
  item: any
  kind: "medication" | "vaccination"
}) {
  const icon =
    kind === "medication" ? (
      <Pill className="h-3.5 w-3.5" />
    ) : (
      <Shield className="h-3.5 w-3.5" />
    )
  const iconWrap =
    kind === "medication" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0 rounded-lg p-2", iconWrap)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{item.name || "Untitled item"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-slate-200 bg-white text-slate-600 font-normal"
            >
              Age {item.age_days ?? 0} days
            </Badge>
            {item.dose != null && (
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600 font-normal"
              >
                Dose {item.dose}
                {item.dose_unit ? ` ${item.dose_unit}` : ""}
              </Badge>
            )}
            {Number(item.withdrawal_period_days) > 0 && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-800 font-normal"
              >
                Withdrawal {item.withdrawal_period_days}d
              </Badge>
            )}
          </div>
          {item.storage_instructions ? (
            <p className="mt-2 text-xs text-slate-500 line-clamp-2">
              Storage: {item.storage_instructions}
            </p>
          ) : null}
          {item.description ? (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const ScheduleView = ({
  type,
  schedule,
  onUpdated,
}: {
  type: string
  schedule: any | undefined
  onUpdated?: () => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const reduxToken = useSelector((state: RootState) => state.authentication.token)
  const reduxFarmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const token = reduxToken || GetToken() || ""
  const farmId = reduxFarmId || getFarm()?.id

  const kind = (type === "feeding" || type === "vaccination" || type === "medication"
    ? type
    : "medication") as ScheduleKind
  const config = typeConfig[kind]
  const displayName = schedule?.name ?? schedule?.title ?? "Untitled"
  const items = schedule?.items ?? []
  const itemCount = items.length
  const isDefault = schedule?.type === "default"
  const poultryTypeName =
    schedule?.poultry_type?.name ??
    schedule?.poultryType?.name ??
    schedule?.poultry_type_name ??
    null

  const spanLabel = useMemo(
    () => (kind === "feeding" ? feedingSpanLabel(items) : null),
    [kind, items]
  )

  if (!schedule) return null

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md border-l-4",
        config.accent
      )}
    >
      <CardHeader className="pb-3 pt-4 sm:pt-5">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 shrink-0 rounded-lg p-2", config.iconWrap)}>
            {config.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  {displayName}
                </CardTitle>
                {schedule.description ? (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                    {schedule.description}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {token && farmId && !isDefault ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-slate-200 text-slate-700"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                  aria-expanded={expanded}
                  aria-label={expanded ? "Collapse schedule" : "Expand schedule"}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-slate-600 font-normal"
              >
                {config.label}
              </Badge>
              {poultryTypeName ? (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-600 font-normal"
                >
                  {poultryTypeName}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600 font-normal tabular-nums"
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "font-normal",
                  isDefault
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                )}
              >
                {isDefault ? "Default" : "Custom"}
              </Badge>
              {spanLabel ? (
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-800 font-normal"
                >
                  {spanLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 sm:pb-5">
          <div className="border-t border-slate-100 pt-3 space-y-2">
            {itemCount === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No items in this schedule.
              </p>
            ) : kind === "feeding" ? (
              items.map((item: any, index: number) => (
                <FeedingItemRow key={item.id ?? index} item={item} />
              ))
            ) : (
              items.map((item: any, index: number) => (
                <MedVacItemRow
                  key={item.id ?? index}
                  item={item}
                  kind={kind === "vaccination" ? "vaccination" : "medication"}
                />
              ))
            )}
          </div>
        </CardContent>
      )}

      {token && farmId ? (
        <EditScheduleModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          token={token}
          farmId={farmId}
          type={kind}
          poultryTypeId={schedule?.poultry_type_id ?? schedule?.poultryType?.id ?? null}
          schedule={schedule}
          onSaved={onUpdated}
        />
      ) : null}
    </Card>
  )
}

export default ScheduleView
