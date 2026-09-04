import { useCallback, useEffect, useState } from "react"
import { useLoaderData, useRevalidator } from "react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import KpiGrid from "@/components/dashboard/KpiGrid"
import AlertsPanel from "@/components/dashboard/AlertsPanel"
import ProductionPanel from "@/components/dashboard/ProductionPanel"
import HealthPanel from "@/components/dashboard/HealthPanel"
import FinancialPanel from "@/components/dashboard/FinancialPanel"
import FlockLeaderboard from "@/components/dashboard/FlockLeaderboard"
import DistributionPanel from "@/components/dashboard/DistributionPanel"
import { DashboardPageSkeleton } from "@/components/general/skeletons"
import { LoadingState } from "@/components/general/LoadingState"
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState"
import type { DashboardDatePreset, Farm, FarmAlerts, FarmDashboard } from "@/lib/types"
import { getFarmAlerts, getFarmDashboard } from "@/lib/request"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { format } from "date-fns"
import { toast } from "react-toastify"

type LoaderData = {
  currentFarm: Farm | null
  dashboard: FarmDashboard | null
  error?: string | null
}

const OverviewPage = () => {
  const loaderData = useLoaderData() as LoaderData
  const revalidator = useRevalidator()
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)

  const [dashboard, setDashboard] = useState<FarmDashboard | null>(loaderData.dashboard)
  const [alerts, setAlerts] = useState<FarmAlerts | null>(loaderData.dashboard?.alerts ?? null)
  const [loadError, setLoadError] = useState<string | null>(loaderData.error ?? null)
  const [preset, setPreset] = useState<DashboardDatePreset>("30d")
  const [loading, setLoading] = useState(false)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [tab, setTab] = useState("production")

  const farm = loaderData.currentFarm

  useEffect(() => {
    setDashboard(loaderData.dashboard)
    setAlerts(loaderData.dashboard?.alerts ?? null)
    setLoadError(loaderData.error ?? null)
  }, [loaderData.dashboard, loaderData.error])

  const refreshAlerts = useCallback(async () => {
    if (!token || !farmId) return

    setAlertsLoading(true)
    try {
      const response = await getFarmAlerts(token, farmId)
      if (response.success && response.data) {
        setAlerts(response.data)
      }
    } finally {
      setAlertsLoading(false)
    }
  }, [token, farmId])

  const refetch = useCallback(
    async (options: {
      preset?: DashboardDatePreset
      start_date?: string
      end_date?: string
    }) => {
      if (!token || !farmId) {
        toast.error("Missing farm or session")
        return
      }
      setLoading(true)
      try {
        const response = await getFarmDashboard(token, farmId, options)
        if (!response.success || !response.data) {
          const message = response.error?.join(", ") || "Failed to load dashboard"
          setLoadError(message)
          toast.error(message)
          return
        }
        setDashboard(response.data)
        setAlerts(response.data.alerts)
        setLoadError(null)
        if (options.preset) setPreset(options.preset)
        else if (options.start_date) setPreset("custom")
        void refreshAlerts()
      } finally {
        setLoading(false)
      }
    },
    [token, farmId, refreshAlerts],
  )

  useEffect(() => {
    void refreshAlerts()
  }, [refreshAlerts])

  const handlePreset = (next: DashboardDatePreset) => {
    if (next === "custom") return
    void refetch({ preset: next })
  }

  const handleCustom = (from: Date, to: Date) => {
    void refetch({
      start_date: format(from, "yyyy-MM-dd"),
      end_date: format(to, "yyyy-MM-dd"),
    })
  }

  const handleRefresh = () => {
    if (preset === "custom" && dashboard) {
      void refetch({
        start_date: dashboard.meta.start_date,
        end_date: dashboard.meta.end_date,
      })
    } else {
      void refetch({ preset: preset === "custom" ? "30d" : preset })
    }
    revalidator.revalidate()
  }

  if (!dashboard && loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <DashboardEmptyState
          title={loadError ? "Could not load dashboard" : "No dashboard data yet"}
          description={
            loadError
              ? loadError
              : "Add flocks and start recording daily feed, eggs, and sales to see your farm command center fill in."
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6 lg:p-8">
      <DashboardHeader
        farm={farm}
        startDate={dashboard.meta.start_date}
        endDate={dashboard.meta.end_date}
        periodDays={dashboard.meta.period_days}
        activeFlocks={dashboard.kpis.active_flocks}
        preset={preset}
        loading={loading}
        onPresetChange={handlePreset}
        onCustomRange={handleCustom}
        onRefresh={handleRefresh}
      />

      <KpiGrid
        kpis={dashboard.kpis}
        previous={dashboard.previous_period}
        series={dashboard.series}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DistributionPanel distribution={dashboard.flock_distribution} />
        </div>
        <LoadingState variant="section" loading={alertsLoading} label="Refreshing alerts…">
          <AlertsPanel alerts={alerts} maxItems={6} loading={false} />
        </LoadingState>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="flocks">Flocks</TabsTrigger>
          </TabsList>
          <TabsContent value="production" className="space-y-4">
            <ProductionPanel series={dashboard.series} />
          </TabsContent>
          <TabsContent value="health" className="space-y-4">
            <HealthPanel series={dashboard.series} kpis={dashboard.kpis} />
          </TabsContent>
          <TabsContent value="financial" className="space-y-4">
            <FinancialPanel
              series={dashboard.series}
              kpis={dashboard.kpis}
              costByCategory={dashboard.cost_by_category}
            />
          </TabsContent>
          <TabsContent value="flocks" className="space-y-4">
            <FlockLeaderboard flocks={dashboard.flocks} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default OverviewPage
