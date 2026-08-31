import SideBarCom from "@/components/navigation/SideBarCom"
import TopBar from "@/components/navigation/TopBar"
import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { usePermissions } from "@/hooks/usePermissions"
import { SubscriptionBanner } from "@/components/general/SubscriptionBanner"
import { Loader2 } from "lucide-react"

const Dashboard = () => {
  const { isLoading } = usePermissions()

  return (
    <SidebarProvider>
      <SideBarCom />
      <SidebarInset className="min-h-svh bg-slate-50/80">
        <TopBar>
          <SidebarTrigger className="md:hidden text-slate-700" />
        </TopBar>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading permissions...
            </div>
          ) : (
            <>
              <SubscriptionBanner />
              <Outlet />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard
