import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { ReactNode } from "react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts"

type Props = {
  title: string
  value: string
  unit?: string
  footer?: string
  icon?: ReactNode
  iconStyles?: string
  sparkline?: { value: number }[]
  deltaPercent?: number | null
  invertDelta?: boolean
}

const KpiCard = ({
  title,
  value,
  unit,
  footer,
  icon,
  iconStyles = "bg-slate-100 text-slate-600",
  sparkline,
  deltaPercent,
  invertDelta = false,
}: Props) => {
  const hasDelta = deltaPercent !== null && deltaPercent !== undefined && Number.isFinite(deltaPercent)
  const positive = hasDelta && deltaPercent! > 0
  const negative = hasDelta && deltaPercent! < 0
  const good = invertDelta ? negative : positive
  const bad = invertDelta ? positive : negative

  return (
    <Card className="border-slate-200 bg-white px-4 py-4 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <h2 className="truncate text-2xl font-semibold text-slate-900">{value}</h2>
            {unit ? <span className="text-xs text-slate-500">{unit}</span> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {hasDelta ? (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium",
                  good && "text-emerald-600",
                  bad && "text-rose-600",
                  !good && !bad && "text-slate-500",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                ) : negative ? (
                  <ArrowDownRight className="mr-0.5 h-3 w-3" />
                ) : (
                  <Minus className="mr-0.5 h-3 w-3" />
                )}
                {Math.abs(deltaPercent!).toFixed(1)}% vs prior
              </span>
            ) : null}
            {footer ? <span className="text-xs text-slate-500">{footer}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon ? (
            <div className={cn("rounded-lg p-2", iconStyles)}>{icon}</div>
          ) : null}
          {sparkline && sparkline.length > 1 ? (
            <div className="h-8 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0f766e"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export default KpiCard
