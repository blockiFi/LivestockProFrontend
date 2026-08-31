import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { DashboardKpis, DashboardSeriesPoint } from "@/lib/types"
import { COLORS, formatMoney } from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

type Props = {
  series: DashboardSeriesPoint[]
  kpis: DashboardKpis
  costByCategory: { category: string; total_cost: number }[]
}

const FinancialPanel = ({ series, kpis, costByCategory }: Props) => {
  const hasSeries = series.some((s) => s.revenue > 0 || s.cost > 0)
  const hasCats = costByCategory.some((c) => c.total_cost > 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="border-slate-200 bg-white shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Revenue vs cost</CardTitle>
          <CardDescription>Daily financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSeries ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No sales or expenditure in this period.
            </p>
          ) : (
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#10b981" },
                cost: { label: "Cost", color: "#f43f5e" },
                net_profit: { label: "Net profit", color: "#0f766e" },
              }}
              className="h-[280px] w-full"
            >
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  fill="var(--color-cost)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net_profit"
                  stroke="var(--color-net_profit)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{formatMoney(kpis.revenue)}</p>
              <p className="text-xs text-slate-500">Revenue</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-700">{formatMoney(kpis.cost)}</p>
              <p className="text-xs text-slate-500">Cost</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-800">{formatMoney(kpis.net_profit)}</p>
              <p className="text-xs text-slate-500">Net profit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Cost by category</CardTitle>
          <CardDescription>Expenditure breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasCats ? (
            <p className="py-12 text-center text-sm text-slate-500">No cost categories.</p>
          ) : (
            <>
              <ChartContainer
                config={Object.fromEntries(
                  costByCategory.map((c, i) => [
                    c.category,
                    { label: c.category, color: COLORS[i % COLORS.length] },
                  ]),
                )}
                className="mx-auto h-[200px]"
              >
                <PieChart>
                  <Pie
                    data={costByCategory}
                    dataKey="total_cost"
                    nameKey="category"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {costByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
              <ul className="mt-2 space-y-1">
                {costByCategory.map((c, i) => (
                  <li key={c.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {c.category}
                    </span>
                    <span className="font-medium">{formatMoney(c.total_cost)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialPanel
