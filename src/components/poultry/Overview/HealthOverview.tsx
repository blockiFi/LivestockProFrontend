import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {

  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import {AlertTriangle, Activity } from "lucide-react"
import type { mortalityDataType } from "@/lib/types"
import {  useEffect, useState } from "react"
import { formatCurrency, getPoultryBreakDownReport } from "@/lib/utils"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

const HealthOverview = () => {
    const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);
    const [mortalityData, setMortalityData] = useState<mortalityDataType[]>([]);
    useEffect(() => {
        const fetchData = async () => {
              if (!statistics) return;
              try {
                const report = await getPoultryBreakDownReport(statistics);
                setMortalityData(report.mortalityData);
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
           <div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mortality Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Mortality Trend</CardTitle>
                  <CardDescription>Daily mortality count and rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      mortality: { label: "Mortality Count", color: "#ff7300" },
                      rate: { label: "Mortality Rate (%)", color: "#ff0000" },
                    }}
                    className="h-[300px]"
                  >
                    <LineChart data={mortalityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        }
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="mortality"
                        stroke="#ff7300"
                        strokeWidth={2}
                        dot={{ fill: "#ff7300" }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rate"
                        stroke="#ff0000"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#ff0000" }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Health Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Summary</CardTitle>
                  <CardDescription>Overall health metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">
                        {formatCurrency(statistics.mortality.total_mortality)}
                      </div>
                      <div className="text-sm text-red-600">Total Mortality</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">
                        {statistics.mortality.average_daily_mortality.toFixed(1)}
                      </div>
                      <div className="text-sm text-orange-600">Daily Average</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Mortality Reports</span>
                      </div>
                      <Badge variant="outline">{statistics.mortality.mortality_reports_count}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Survival Rate</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {(
                          ((statistics.summary.total_birds - statistics.mortality.total_mortality) /
                            statistics.summary.total_birds) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
    </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Activity className="w-8 h-8 text-gray-500" />
            <span className="ml-2">Loading health statistics...</span>
          </div>
        )
   }
   </>
  )
}

export default HealthOverview
