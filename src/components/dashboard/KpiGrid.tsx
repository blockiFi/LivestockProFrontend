import KpiCard from "./KpiCard"
import type { DashboardKpis, DashboardSeriesPoint } from "@/lib/types"
import { formatCount, formatMoney, safeRatio } from "@/lib/utils"
import { Bird, DollarSign, Egg, Scale, Skull, TrendingUp } from "lucide-react"

type Props = {
  kpis: DashboardKpis
  previous: DashboardKpis
  series: DashboardSeriesPoint[]
}

function delta(current: number, previous: number): number | null {
  const ratio = safeRatio(current - previous, Math.abs(previous))
  return ratio === null ? null : ratio * 100
}

const KpiGrid = ({ kpis, previous, series }: Props) => {
  const feedSpark = series.map((s) => ({ value: s.feed_kg }))
  const eggSpark = series.map((s) => ({ value: s.eggs }))
  const mortSpark = series.map((s) => ({ value: s.mortality }))
  const profitSpark = series.map((s) => ({ value: s.net_profit }))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        title="Active birds"
        value={formatCount(kpis.active_birds)}
        footer={`${formatCount(kpis.active_flocks)} flocks`}
        icon={<Bird className="h-4 w-4" />}
        iconStyles="bg-emerald-50 text-emerald-600"
        deltaPercent={delta(kpis.active_birds, previous.active_birds)}
      />
      <KpiCard
        title="Feed consumed"
        value={formatCount(kpis.feed_kg)}
        unit="kg"
        footer={`${formatMoney(kpis.feed_cost)} cost`}
        icon={<Scale className="h-4 w-4" />}
        iconStyles="bg-sky-50 text-sky-600"
        sparkline={feedSpark}
        deltaPercent={delta(kpis.feed_kg, previous.feed_kg)}
      />
      <KpiCard
        title="Eggs collected"
        value={formatCount(kpis.eggs)}
        icon={<Egg className="h-4 w-4" />}
        iconStyles="bg-amber-50 text-amber-600"
        sparkline={eggSpark}
        deltaPercent={delta(kpis.eggs, previous.eggs)}
      />
      <KpiCard
        title="Mortality"
        value={formatCount(kpis.mortality)}
        footer={`${kpis.mortality_rate_percent.toFixed(2)}% rate`}
        icon={<Skull className="h-4 w-4" />}
        iconStyles="bg-rose-50 text-rose-600"
        sparkline={mortSpark}
        deltaPercent={delta(kpis.mortality, previous.mortality)}
        invertDelta
      />
      <KpiCard
        title="Net profit"
        value={formatMoney(kpis.net_profit)}
        footer={`${kpis.margin_percent.toFixed(1)}% margin`}
        icon={<TrendingUp className="h-4 w-4" />}
        iconStyles="bg-teal-50 text-teal-600"
        sparkline={profitSpark}
        deltaPercent={delta(kpis.net_profit, previous.net_profit)}
      />
      <KpiCard
        title="Revenue"
        value={formatMoney(kpis.revenue)}
        footer={`${formatMoney(kpis.cost)} costs`}
        icon={<DollarSign className="h-4 w-4" />}
        iconStyles="bg-violet-50 text-violet-600"
        deltaPercent={delta(kpis.revenue, previous.revenue)}
      />
    </div>
  )
}

export default KpiGrid
