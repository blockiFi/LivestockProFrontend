import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { DashboardKpis, DashboardSeriesPoint } from "@/lib/types"
import { formatCount, safeRatio } from "@/lib/utils"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

type Props = {
  series: DashboardSeriesPoint[]
  kpis: DashboardKpis
}

const HealthPanel = ({ series, kpis }: Props) => {
  const hasData = series.some((s) => s.mortality > 0)
  const survival = safeRatio(kpis.active_birds, kpis.active_birds + kpis.mortality)
  const survivalPct = survival === null ? null : survival * 100

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="border-slate-200 bg-white shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Mortality trend</CardTitle>
          <CardDescription>Daily mortality count and rate</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No mortality recorded in this period.
            </p>
          ) : (
            <ChartContainer
              config={{
                mortality: { label: "Mortality", color: "#f97316" },
                mortality_rate: { label: "Rate %", color: "#e11d48" },
              }}
              className="h-[280px] w-full"
            >
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  tick={{ fontSize: 10 }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mortality"
                  stroke="var(--color-mortality)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mortality_rate"
                  stroke="var(--color-mortality_rate)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Health summary</CardTitle>
          <CardDescription>Period totals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-rose-50 p-4 text-center">
            <p className="text-2xl font-semibold text-rose-700">{formatCount(kpis.mortality)}</p>
            <p className="text-xs text-rose-600">Total mortality</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-2xl font-semibold text-amber-700">
              {kpis.mortality_rate_percent.toFixed(2)}%
            </p>
            <p className="text-xs text-amber-600">Mortality rate</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-700">
              {survivalPct === null ? "—" : `${survivalPct.toFixed(1)}%`}
            </p>
            <p className="text-xs text-emerald-600">Survival (active ÷ active+deaths)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HealthPanel
