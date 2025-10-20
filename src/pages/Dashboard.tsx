import SideBarCom from "@/components/navigation/SideBarCom"
import TopBar from "@/components/navigation/TopBar"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"


const Dashboard = () => {
  return (

    <SidebarProvider>
    <SideBarCom />
    <main className="w-full">
      
      <TopBar >
        <SidebarTrigger />
        </TopBar>

      <div className="m-5">
        <Outlet />
        </div>
    </main>
  </SidebarProvider>


   
  )
}

export default Dashboard
