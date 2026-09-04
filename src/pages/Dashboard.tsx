import SideBarCom from "@/components/navigation/SideBarCom"
import TopBar from "@/components/navigation/TopBar"
import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SubscriptionBanner } from "@/components/general/SubscriptionBanner"
import { PageLoader } from "@/components/general/PageLoader"
import { useRouteLoading } from "@/hooks/useRouteLoading"

const Dashboard = () => {
  const { isRouteLoading, loadingLabel } = useRouteLoading()

  return (
    <SidebarProvider>
      <SideBarCom />
      <SidebarInset className="min-h-svh bg-slate-50/80">
        <TopBar>
          <SidebarTrigger className="md:hidden text-slate-700" />
        </TopBar>
        <div className="relative flex-1 p-4 md:p-6 lg:p-8">
          {isRouteLoading && <PageLoader label={loadingLabel} />}
          <SubscriptionBanner />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard
