import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  
  Pie,
  PieChart,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,

} from "@/components/ui/chart"
import { COLORS, formatCurrency } from "@/lib/utils"
import type { RootState } from "@/store"
import { useSelector } from "react-redux"

const Overview = () => {
  const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);
  return (
   <>
   {
      statistics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Poultry Types Distribution */}
    <Card>
      <CardHeader>
        <CardTitle>Poultry Distribution</CardTitle>
        <CardDescription>Birds by type across all flocks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            broiler: { label: "Broiler", color: "#0088FE" },
            pullet: { label: "Pullet", color: "#00C49F" },
            layer: { label: "Layer", color: "#FFBB28" },
            cockerel: { label: "Cockerel", color: "#FF8042" },
          }}
          className="h-[300px]"
        >
          <PieChart>
            <Pie
              data={statistics.poultry_types.filter((type) => type.total_birds > 0)}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="total_birds"
              nameKey="type_name"
            >
              {statistics.poultry_types
                .filter((type) => type.total_birds > 0)
                .map((entry, index) => (
                  console.log(entry),
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent payload={<></>} />} />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {statistics.poultry_types
            .filter((type) => type.total_birds > 0)
            .map((type, index) => (
              <div key={type.type_name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{type.type_name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{formatCurrency(type.total_birds)}</div>
                  <div className="text-xs text-muted-foreground">{type.percentage_of_total}%</div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>

    {/* Weight Metrics */}
    <Card>
      <CardHeader>
        <CardTitle>Weight Metrics</CardTitle>
        <CardDescription>Current weight statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {(statistics.weight_metrics.average_weight_grams / 1000).toFixed(1)} kg
            </div>
            <div className="text-sm text-blue-600">Average Weight</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {(statistics.weight_metrics.weight_gain_grams / 1000).toFixed(1)} kg
            </div>
            <div className="text-sm text-green-600">Total Gain</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Min Weight:</span>
            <span className="font-medium">{statistics.weight_metrics.min_weight_grams}g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Max Weight:</span>
            <span className="font-medium">{statistics.weight_metrics.max_weight_grams}g</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Weight Range Progress</span>
              <span>
                {(
                  ((statistics.weight_metrics.average_weight_grams -
                    statistics.weight_metrics.min_weight_grams) /
                    (statistics.weight_metrics.max_weight_grams -
                      statistics.weight_metrics.min_weight_grams)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <Progress
              value={
                ((statistics.weight_metrics.average_weight_grams -
                  statistics.weight_metrics.min_weight_grams) /
                  (statistics.weight_metrics.max_weight_grams -
                    statistics.weight_metrics.min_weight_grams)) *
                100
              }
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
      ) : (
        <div className="text-center text-gray-500">Loading statistics...</div>
      )
   }
   </>
  )
}

export default Overview
