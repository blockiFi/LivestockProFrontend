import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { DashboardDistribution } from "@/lib/types"
import { COLORS, formatCount } from "@/lib/utils"
import { Cell, Pie, PieChart } from "recharts"

type Props = {
  distribution: DashboardDistribution[]
}

const DistributionPanel = ({ distribution }: Props) => {
  const data = distribution.filter((d) => d.birds > 0)

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Poultry distribution</CardTitle>
        <CardDescription>Active birds by type</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No active birds.</p>
        ) : (
          <>
            <ChartContainer
              config={Object.fromEntries(
                data.map((d, i) => [
                  d.type_name,
                  { label: d.type_name, color: COLORS[i % COLORS.length] },
                ]),
              )}
              className="mx-auto h-[220px]"
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="birds"
                  nameKey="type_name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <ul className="mt-3 space-y-2">
              {data.map((d, i) => (
                <li key={d.type_id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {d.type_name}
                    <span className="text-xs text-slate-400">
                      {d.flock_count} flock{d.flock_count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="font-medium">
                    {formatCount(d.birds)}{" "}
                    <span className="text-xs font-normal text-slate-500">({d.percent}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default DistributionPanel
