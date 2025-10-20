import type { eggProductionDataType, feedConsumptionDataType  } from '@/lib/types'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,

  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
 
} from "@/components/ui/chart"
import { getPoultryBreakDownReport } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

const ProductionOverview = () => {
  const [feedConsumptionData, setFeedConsumptionData] = useState<feedConsumptionDataType[] | null>([]);
  const [eggProductionData, setEggProductionData] = useState<eggProductionDataType[] | null>([]);
  const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);
  useEffect(() => {
    const fetchData = async () => {
      if (!statistics) return;  
      try {
        const report = await getPoultryBreakDownReport(statistics);
        setFeedConsumptionData(report.feedConsumptionData);
        setEggProductionData(report.eggProductionData);
      } catch (error) {
        console.error("Error fetching poultry breakdown report:", error);
      }
    };

    fetchData();
  }, [statistics]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Feed Consumption Chart */}
    <Card>
      <CardHeader>
        <CardTitle>Feed Consumption Trend</CardTitle>
        <CardDescription>Daily feed consumption over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            feed_kg: { label: "Feed (kg)", color: "#8884d8" },
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
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="feed_kg"
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          ) : (
            <div className="text-center text-gray-500">No feed consumption data available</div>
          )
          }
        </ChartContainer>
      </CardContent>
    </Card>

    {/* Egg Production Chart */}
    <Card>
      <CardHeader>
        <CardTitle>Egg Production</CardTitle>
        <CardDescription>Recent egg production activity</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            eggs: { label: "Eggs", color: "#82ca9d" },
          }}
          className="h-[300px]"
        >
          {eggProductionData && eggProductionData.length > 0 ? (
            <BarChart data={eggProductionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="eggs" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <div className="text-center text-gray-500">No egg production data available</div>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  </div>
  )
}

export default ProductionOverview
