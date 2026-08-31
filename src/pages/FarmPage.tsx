import { useLoaderData, Link } from "react-router"
import type { Farm, FarmDashboard, FarmStatsDataType } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { ArrowRight, Bird, Bell, Scale, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import FarmStat from "@/components/Farm/FarmStat"
import AlertsPanel from "@/components/dashboard/AlertsPanel"
import KpiCard from "@/components/dashboard/KpiCard"
import { formatCount, formatMoney } from "@/lib/utils"
import type { getFarmStatsResponseData } from "@/lib/interfaces"

const FarmPage = () => {
  const { currentFarm, farmStats, dashboard } = useLoaderData() as {
    currentFarm?: Farm
    farmStats: getFarmStatsResponseData
    dashboard: FarmDashboard | null
  }
  const currentUser = useSelector((state: RootState) => state.authentication.user)

  const kpis = dashboard?.kpis

  return (
    <main className="flex-1 space-y-6 bg-slate-50 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            Good day, {currentUser?.name}!
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            High-level snapshot of {currentFarm?.name ?? "your farm"}. Open the poultry
            dashboard for full production, health, and financial detail.
          </p>
        </div>
        <Button asChild className="gap-2 self-start md:self-auto">
          <Link to="/dashboard/poultry">
            Open poultry dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {farmStats.success && (
        <FarmStat
          statistics={(farmStats.data as FarmStatsDataType) ?? null}
          farmName={currentFarm?.name}
        />
      )}

      {kpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Active birds"
            value={formatCount(kpis.active_birds)}
            footer={`${formatCount(kpis.active_flocks)} active flocks`}
            icon={<Bird className="h-4 w-4" />}
            iconStyles="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            title="Feed consumed"
            value={formatCount(kpis.feed_kg)}
            unit="kg"
            footer={`${formatMoney(kpis.feed_cost)} total feed cost`}
            icon={<Scale className="h-4 w-4" />}
            iconStyles="bg-sky-50 text-sky-600"
          />
          <KpiCard
            title="Mortality"
            value={formatCount(kpis.mortality)}
            footer={`${kpis.mortality_rate_percent.toFixed(2)}% rate`}
            icon={<ShieldAlert className="h-4 w-4" />}
            iconStyles="bg-rose-50 text-rose-600"
          />
          <KpiCard
            title="Net profit"
            value={formatMoney(kpis.net_profit)}
            footer={`${formatMoney(kpis.revenue)} revenue`}
            icon={<Bell className="h-4 w-4" />}
            iconStyles="bg-teal-50 text-teal-600"
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AlertsPanel alerts={dashboard?.alerts ?? null} compact maxItems={5} />
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-none">
          <h2 className="text-base font-semibold text-slate-900">Need the full picture?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Production trends, flock leaderboard, cost breakdowns, and date-filtered KPIs live on
            the poultry dashboard.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full gap-2">
            <Link to="/dashboard/poultry">
              Go to poultry dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

export default FarmPage
