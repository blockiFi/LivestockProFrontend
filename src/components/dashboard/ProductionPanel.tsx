import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { DashboardSeriesPoint } from "@/lib/types"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

type Props = {
  series: DashboardSeriesPoint[]
}

const ProductionPanel = ({ series }: Props) => {
  const hasData = series.some((s) => s.feed_kg > 0 || s.eggs > 0)

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Production</CardTitle>
        <CardDescription>Daily feed consumption and egg collection</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No production data in this period.
          </p>
        ) : (
          <ChartContainer
            config={{
              feed_kg: { label: "Feed (kg)", color: "#0ea5e9" },
              eggs: { label: "Eggs", color: "#f59e0b" },
            }}
            className="h-[300px] w-full"
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
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="feed_kg"
                stroke="var(--color-feed_kg)"
                fill="var(--color-feed_kg)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="eggs"
                stroke="var(--color-eggs)"
                fill="var(--color-eggs)"
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductionPanel
