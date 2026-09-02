import { AlertCircle, CheckCircle2, Clock, Wheat } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import type { BatchActivitySummary } from "@/lib/request"
import { cn } from "@/lib/utils"

type Props = {
  summary: BatchActivitySummary
}

const chartConfig = {
  consumed: { label: "Consumed", color: "#f59e0b" },
  planned: { label: "Planned", color: "#6366f1" },
}

export default function FeedOverviewPanel({ summary }: Props) {
  const consumed = summary.feed_consumed_kg ?? 0
  const planned = summary.feed_planned_kg ?? 0
  const total = consumed + planned

  if (total <= 0) return null

  const consumedPct = total > 0 ? Math.round((consumed / total) * 100) : 0
  const plannedPct = total > 0 ? 100 - consumedPct : 0

  const chartData = [
    { key: "consumed", name: "Consumed", value: consumed, fill: "var(--color-consumed)" },
    { key: "planned", name: "Planned", value: planned, fill: "var(--color-planned)" },
  ].filter((d) => d.value > 0)

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-amber-50 via-white to-indigo-50 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-200/50">
            <Wheat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Feed overview</h3>
            <p className="text-xs text-muted-foreground">
              Actual consumption vs scheduled feed still to be given
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_220px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <FeedMetricCard
              kind="consumed"
              label="Feed consumed"
              value={consumed}
              unit="kg"
              subtitle="Recorded & executed"
              icon={CheckCircle2}
            />
            <FeedMetricCard
              kind="planned"
              label="Yet to consume"
              value={planned}
              unit="kg"
              subtitle="Scheduled / upcoming"
              icon={Clock}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Consumed {consumedPct}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Planned {plannedPct}%
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              {consumed > 0 && (
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                  style={{ width: `${consumedPct}%` }}
                />
              )}
              {planned > 0 && (
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
                  style={{ width: `${plannedPct}%` }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total feed in period:{" "}
              <span className="font-semibold text-foreground">{total.toLocaleString()} kg</span>
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <LegendPill
              icon={CheckCircle2}
              label="Consumed"
              description="Solid — already fed or logged"
              className="border-amber-200 bg-amber-50/60"
              iconClass="text-amber-600"
            />
            <LegendPill
              icon={Clock}
              label="Planned"
              description="Dashed — scheduled, not yet done"
              className="border-indigo-200 bg-indigo-50/60"
              iconClass="text-indigo-600"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px] w-full max-w-[200px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">Feed split</p>
        </div>
      </div>
    </section>
  )
}

function FeedMetricCard({
  kind,
  label,
  value,
  unit,
  subtitle,
  icon: Icon,
}: {
  kind: "consumed" | "planned"
  label: string
  value: number
  unit: string
  subtitle: string
  icon: typeof CheckCircle2
}) {
  const isConsumed = kind === "consumed"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4",
        isConsumed
          ? "border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50"
          : "border-indigo-200/80 border-dashed bg-gradient-to-br from-indigo-50/80 to-violet-50/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            isConsumed ? "bg-amber-500/15 text-amber-700" : "bg-indigo-500/15 text-indigo-700"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {!isConsumed && value > 0 && (
        <div className="mt-3">
          <Progress value={100} className="h-1.5 bg-indigo-100 [&>div]:bg-indigo-400/60" />
        </div>
      )}
    </div>
  )
}

function LegendPill({
  icon: Icon,
  label,
  description,
  className,
  iconClass,
}: {
  icon: typeof AlertCircle
  label: string
  description: string
  className: string
  iconClass: string
}) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5", className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <div>
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
      </div>
    </div>
  )
}
