// import {
//     Home,
//     BarChart3,
//     Bird,
//     PiggyBankIcon as Pig,
//     Fish,
//     Package,
//     Heart,
//     Wheat,
//     Building,
//     TrendingUp,
//     DollarSign,
//     Activity,
//   } from "lucide-react"
import { useLocation } from "react-router-dom";

  import {
    BarChart3,
    Calendar,
    ChevronDown,
    ChevronLeft,
    Clipboard,
    CloudSun,
    Droplet,
    Fish,
    Home,
    Layers,
    Leaf,
    Menu,
    PiggyBank,
    Settings,
    ShoppingCart,
    Tractor,
    Truck,
    Users,
    X,
    Heart,
    Package,
  } from "lucide-react"
  import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    useSidebar,
  } from "@/components/ui/sidebar"
import Logo from "./Logo"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { useState } from "react";
interface NavItemProps {
    to: string
    icon: React.ElementType
    active?: boolean
    children: React.ReactNode
  }

  interface SubNavItemProps {
    to: string
    active?: boolean
    children: React.ReactNode
  }
  
  function SubNavItem({ to, active, children }: SubNavItemProps) {
    return (
      <Link
        to={to}
        className={cn(
          "block px-3 py-2 text-sm rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {children}
      </Link>
    )
  }
  // Menu data organized by sections
  function NavItem({ to, icon: Icon, active, children }: NavItemProps) {
    const { open } = useSidebar()
  
    return (
      <Link to={to} className={cn("sidebar-item", active ? "sidebar-item-active" : "sidebar-item-inactive")}>
        <Icon className="h-5 w-5" />
        {open && <span>{children}</span>}
      </Link>
    )
  }
//   const menuData = {
//     dashboard: [
//       {
//         title: "Overview",
//         url: "#",
//         icon: Home,
//       },
//       {
//         title: "Analytics",
//         url: "#",
//         icon: BarChart3,
//       },
//     ],
//     livestockManagement: [
//       {
//         title: "Poultry",
//         url: "#",
//         icon: Bird,
//       },
//       {
//         title: "Piggery",
//         url: "#",
//         icon: Pig,
//       },
//       {
//         title: "Fishery",
//         url: "#",
//         icon: Fish,
//       },
//     ],
//     farmOperations: [
//       {
//         title: "Inventory",
//         url: "#",
//         icon: Package,
//       },
//       {
//         title: "Health Records",
//         url: "#",
//         icon: Heart,
//       },
//       {
//         title: "Feed Management",
//         url: "#",
//         icon: Wheat,
//       },
//       {
//         title: "Housing",
//         url: "#",
//         icon: Building,
//       },
//     ],
//     reportsAnalytics: [
//       {
//         title: "Production Reports",
//         url: "#",
//         icon: TrendingUp,
//       },
//       {
//         title: "Financial Reports",
//         url: "#",
//         icon: DollarSign,
//       },
//       {
//         title: "Health Reports",
//         url: "#",
//         icon: Activity,
//       },
//     ],
//   }
const SideBarCom = () => {
    // Get the current pathname using React Router's useLocation hook
    const { open } = useSidebar()
    const { pathname } = useLocation();
    const [poultryOpen, setPoultryOpen] = useState(pathname?.includes("/poultry"))
    const [healthOpen, setHealthOpen] = useState(pathname?.includes("/poultry/health"))
    const [inventoryOpen, setInventoryOpen] = useState(pathname?.includes("/poultry/inventory"))
    const [permissionOpen, setPermissionOpen] = useState(pathname?.includes("/poultry/permission"))

    return (
        <Sidebar>
          <SidebarContent>
        {/* Dashboard Section */}
        <SidebarMenu>
            <Logo style=" mt-7 gap-2 ml-2 mb-10" />
        </SidebarMenu>
        <aside
        
      >
       
        <div className="px-3 py-4">
          <nav className="space-y-1">
            <NavItem to="/" icon={Home} active={pathname === "/dashboard"}>
              Dashboard
            </NavItem>
            <div>
              <button
                onClick={() => setPoultryOpen(!poultryOpen)}
                className={cn(
                  "sidebar-item w-full justify-between",
                  pathname?.includes("/livestock/poultry") ? "sidebar-item-active" : "sidebar-item-inactive",
                )}
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5" />
                  {open && <span>Poultry</span>}
                </div>
                {open && <ChevronDown className={cn("h-4 w-4 transition-transform", poultryOpen && "rotate-180")} />}
              </button>

              {open && poultryOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <SubNavItem to="/dashboard/poultry" active={pathname === "/livestock/poultry"}>
                    Overview
                  </SubNavItem>
                  <SubNavItem
                    to="/dashboard/poultry/flock-management"
                    active={pathname?.includes("/flock-management")}
                  >
                    Flock Management
                  </SubNavItem>
               
                  <SubNavItem
                    to="/dashboard/poultry/schedules"
                    active={pathname?.includes("/schedules")}
                  >
                   Schedule Management
                  </SubNavItem>

                  {/* Health dropdown */}
                  <div className="pt-1">
                    <button
                      onClick={() => setHealthOpen(!healthOpen)}
                      className={cn(
                        "w-full flex items-center justify-between text-sm px-3 py-2 rounded-md",
                        pathname?.includes("/poultry/health")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2"><Heart className="h-4 w-4" /> Health</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", healthOpen && "rotate-180")} />
                    </button>
                    {healthOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <SubNavItem
                          to="/dashboard/poultry/health/medications"
                          active={pathname?.includes("/poultry/health/medications")}
                        >
                          Medications
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/health/medication-products"
                          active={pathname?.includes("/poultry/health/medication-products")}
                        >
                          Medication Products
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/health/vaccinations"
                          active={pathname?.includes("/poultry/health/vaccinations")}
                        >
                          Vaccinations
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/health/vaccination-products"
                          active={pathname?.includes("/poultry/health/vaccination-products")}
                        >
                          Vaccination Products
                        </SubNavItem>
                      </div>
                    )}
                  </div>

                  {/* Inventory Management dropdown */}
                  <div className="pt-1">
                    <button
                      onClick={() => setInventoryOpen(!inventoryOpen)}
                      className={cn(
                        "w-full flex items-center justify-between text-sm px-3 py-2 rounded-md",
                        pathname?.includes("/poultry/inventory")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2 "><Package className="h-4 w-4" /> Inventory </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", inventoryOpen && "rotate-180")} />
                    </button>
                    {inventoryOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <SubNavItem
                          to="/dashboard/poultry/inventory/medications"
                          active={pathname?.includes("/poultry/inventory/medications")}
                        >
                          Medication Inventory
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/inventory/vaccination"
                          active={pathname?.includes("/poultry/inventory/vaccination")}
                        >
                          Vaccination Inventory
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/inventory/feeds"
                          active={pathname?.includes("/poultry/inventory/feeds")}
                        >
                          Feed Inventory
                        </SubNavItem>
                      </div>
                    )}
                  </div>
                    {/* //Permission  Management */}
                      <div className="pt-1">
                    <button
                      onClick={() => setPermissionOpen(!permissionOpen)}
                      className={cn(
                        "w-full flex items-center justify-between text-sm px-3 py-2 rounded-md",
                        pathname?.includes("/poultry/permission")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2 "><Users className="h-4 w-4" /> Permissions </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", permissionOpen && "rotate-180")} />
                    </button>
                    {permissionOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <SubNavItem
                          to="/dashboard/poultry/permission/permissions"
                          active={pathname?.includes("/poultry/permission/permissions")}
                        >
                          Permission
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/permission/roles"
                          active={pathname?.includes("/poultry/permission/roles")}
                        >
                          Roles
                        </SubNavItem>
                        <SubNavItem
                          to="/dashboard/poultry/permission/user-roles"
                          active={pathname?.includes("/poultry/permission/user-roles")}
                        >
                          Users
                        </SubNavItem>

                        
                      </div>
                    )}
                  </div>
                  <SubNavItem
                    to="/livestock/poultry/housing-management"
                    active={pathname?.includes("/housing-management")}
                  >
                    Housing & Environment
                  </SubNavItem>
                </div>
              )}
            </div>
            <NavItem to="/livestock/piggery" icon={PiggyBank} active={pathname?.includes("/livestock/piggery")}>
              Piggery
            </NavItem>
            <NavItem to="/livestock/fishery" icon={Fish} active={pathname?.includes("/livestock/fishery")}>
              Fishery
            </NavItem>


            <NavItem to="/soil-water" icon={Droplet} active={pathname?.includes("/soil-water")}>
              Soil & Water
            </NavItem>
            <NavItem to="/weather" icon={CloudSun} active={pathname?.includes("/weather")}>
              Weather
            </NavItem>
            <NavItem to="/equipment" icon={Tractor} active={pathname?.includes("/equipment")}>
              Equipment
            </NavItem>
            <NavItem to="/tasks" icon={Clipboard} active={pathname?.includes("/tasks")}>
              Tasks
            </NavItem>
            <NavItem to="/inventory" icon={ShoppingCart} active={pathname?.includes("/inventory")}>
              Inventory
            </NavItem>
            <NavItem to="/suppliers" icon={Truck} active={pathname?.includes("/suppliers")}>
              Suppliers
            </NavItem>
            <NavItem to="/staff" icon={Users} active={pathname?.includes("/staff")}>
              Staff
            </NavItem>
            <NavItem to="/calendar" icon={Calendar} active={pathname?.includes("/calendar")}>
              Calendar
            </NavItem>
            <NavItem to="/reports" icon={BarChart3} active={pathname?.includes("/reports")}>
              Reports
            </NavItem>
            <NavItem to="/settings" icon={Settings} active={pathname?.includes("/settings")}>
              Settings
            </NavItem>
            <NavItem to="/dashboard/invoices" icon={Layers} active={pathname?.includes("/dashboard/invoices")}>
              Invoices
            </NavItem>
          </nav>
        </div>
      </aside>
        {/* <SidebarGroup> */}
          {/* <SidebarGroupLabel className="text-lg font-semibold text-slate-700">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.dashboard.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Livestock Management Section */}
        {/* <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-slate-700">Livestock Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.livestockManagement.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Farm Operations Section */}
        {/* <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-slate-700">Farm Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.farmOperations.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Reports & Analytics Section */}
        {/* <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-slate-700">Reports & Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.reportsAnalytics.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>  */}
        
      </SidebarContent>
          
        </Sidebar>
      )
    }
    

export default SideBarCom
