import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency, getPoultryBreakDownReport } from "@/lib/utils"
import type { feedConsumptionDataType } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

const FinancialOverview = () => {
   const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);    
    const [feedConsumptionData, setFeedConsumptionData] = useState<feedConsumptionDataType[] | null>([]);
    useEffect(() => {
      const fetchData = async () => {
        if (!statistics) return;
        try {
          const report = await getPoultryBreakDownReport(statistics);
          setFeedConsumptionData(report.feedConsumptionData);
        } catch (error) {
          console.error("Error fetching poultry breakdown report:", error);
        }
      };
  
      fetchData();
    }, [statistics]);
  return (
    <> 
    {
      statistics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Feed Cost Analysis */}
    <Card>
      <CardHeader>
        <CardTitle>Feed Cost Analysis</CardTitle>
        <CardDescription>Cost breakdown and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            cost: { label: "Cost ($)", color: "#8884d8" },
          }}
          className="h-[300px]"
        >
          {
          feedConsumptionData && feedConsumptionData.length > 0 ? (
            <AreaChart data={feedConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis yAxisId="left" />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#8884d8"
                fill="#8884d8"
                yAxisId="left"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => new Date(value).toLocaleDateString("en-US")}
                    formatter={(value) => `$${(value as number).toFixed(2)}`}
                  />
                }
              />
            </AreaChart>
          ) : (
            <div className="text-center text-gray-500">No data available</div>
          )
          }
        </ChartContainer>
      </CardContent>
    </Card>

    {/* Financial Summary */}
    <Card>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Key financial metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(statistics.financial.total_feed_cost)}
            </div>
            <div className="text-sm text-blue-600">Total Feed Cost</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(statistics.financial.average_daily_feed_cost)}
            </div>
            <div className="text-sm text-green-600">Daily Average Cost</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(statistics.financial.cost_per_bird)}
            </div>
            <div className="text-sm text-purple-600">Cost Per Bird</div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Feed Conversion Ratio:</span>
            <span className="font-medium">
              {statistics.feed_consumption.feed_conversion_ratio.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cost per kg Feed:</span>
            <span className="font-medium">
              {formatCurrency(
                statistics.financial.total_feed_cost /
                  statistics.feed_consumption.total_feed_consumed_kg,
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
      ) : (
        <div className="text-center p-4">No feed consumption data available</div>
      )
    }
    </>

  )
}

export default FinancialOverview
