import { Link, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import {
  Bell,
  ChevronRight,
  ClipboardList,
  FileText,
  Heart,
  Home,
  Layers,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Tractor,
  Users,
  Wheat,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Logo from "./Logo"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { canAccessNav } from "@/lib/routePermissions"

type NavLink = {
  to: string
  label: string
  isActive: (pathname: string) => boolean
}

type NavSection = {
  id: string
  label: string
  icon: React.ElementType
  isActive: (pathname: string) => boolean
  items: NavLink[]
}

const POULTRY_LINKS: NavLink[] = [
  { to: "/dashboard/poultry", label: "Overview", isActive: (p) => p === "/dashboard/poultry" },
  {
    to: "/dashboard/poultry/flock-management",
    label: "Flock Management",
    isActive: (p) => p.includes("/flock-management"),
  },
  {
    to: "/dashboard/poultry/houses",
    label: "Housing Management",
    isActive: (p) => p.includes("/poultry/houses"),
  },
  {
    to: "/dashboard/poultry/schedules",
    label: "Schedule Management",
    isActive: (p) => p.includes("/schedules"),
  },
  {
    to: "/dashboard/poultry/tasks",
    label: "Task Management",
    isActive: (p) => p.includes("/poultry/tasks"),
  },
  {
    to: "/dashboard/poultry/analytics/sales-profit-loss",
    label: "Sales P&L",
    isActive: (p) => p.includes("/analytics/sales-profit-loss"),
  },
]

const POULTRY_SECTIONS: NavSection[] = [
  {
    id: "health",
    label: "Health",
    icon: Heart,
    isActive: (p) => p.includes("/poultry/health"),
    items: [
      {
        to: "/dashboard/poultry/health/medications",
        label: "Medications",
        isActive: (p) => p.includes("/poultry/health/medications") && !p.includes("products"),
      },
      {
        to: "/dashboard/poultry/health/medication-products",
        label: "Medication Products",
        isActive: (p) => p.includes("/medication-products"),
      },
      {
        to: "/dashboard/poultry/health/vaccinations",
        label: "Vaccinations",
        isActive: (p) => p.includes("/poultry/health/vaccinations") && !p.includes("products"),
      },
      {
        to: "/dashboard/poultry/health/vaccination-products",
        label: "Vaccination Products",
        isActive: (p) => p.includes("/vaccination-products"),
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    isActive: (p) => p.includes("/poultry/inventory"),
    items: [
      {
        to: "/dashboard/poultry/inventory/medications",
        label: "Medication Inventory",
        isActive: (p) => p.includes("/poultry/inventory/medications"),
      },
      {
        to: "/dashboard/poultry/inventory/vaccination",
        label: "Vaccination Inventory",
        isActive: (p) => p.includes("/poultry/inventory/vaccination"),
      },
      {
        to: "/dashboard/poultry/inventory/feeds",
        label: "Feed Inventory",
        isActive: (p) => p.includes("/poultry/inventory/feeds"),
      },
    ],
  },
  {
    id: "feed",
    label: "Feed Management",
    icon: Wheat,
    isActive: (p) => p.includes("/poultry/feed"),
    items: [
      {
        to: "/dashboard/poultry/feed/components",
        label: "Feed Components",
        isActive: (p) => p.includes("/poultry/feed/components"),
      },
      {
        to: "/dashboard/poultry/feed/compositions",
        label: "Feed Composition",
        isActive: (p) => p.includes("/poultry/feed/compositions"),
      },
      {
        to: "/dashboard/poultry/feed/formulation",
        label: "AI Feed Formulation",
        isActive: (p) => p.includes("/poultry/feed/formulation"),
      },
    ],
  },
  {
    id: "permission",
    label: "Permissions",
    icon: Users,
    isActive: (p) => p.includes("/poultry/permission"),
    items: [
      {
        to: "/dashboard/poultry/permission/permissions",
        label: "Permissions",
        isActive: (p) => p.includes("/poultry/permission/permissions"),
      },
      {
        to: "/dashboard/poultry/permission/roles",
        label: "Roles",
        isActive: (p) => p.includes("/poultry/permission/roles"),
      },
      {
        to: "/dashboard/poultry/permission/user-roles",
        label: "Users",
        isActive: (p) => p.includes("/poultry/permission/user-roles"),
      },
    ],
  },
]

function NavSectionCollapsible({
  section,
  pathname,
  defaultOpen,
  visibleItems,
}: {
  section: NavSection
  pathname: string
  defaultOpen: boolean
  visibleItems: NavLink[]
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = section.icon

  if (visibleItems.length === 0) return null

  return (
    <SidebarMenuSubItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              section.isActive(pathname)
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">{section.label}</span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                open && "rotate-90"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-3 mt-1 space-y-0.5 border-l border-slate-200 pl-2">
            {visibleItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm transition-colors",
                  item.isActive(pathname)
                    ? "bg-emerald-50 font-medium text-emerald-800"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  )
}

const SideBarCom = () => {
  const { pathname } = useLocation()
  const { open, toggleSidebar } = useSidebar()
  const activeFarm = useSelector((state: RootState) => state.authentication.activeFarm)
  const { permissions, isLoaded } = usePermissions()

  const canSeeNav = (path: string) => !isLoaded || canAccessNav(path, permissions)

  const visiblePoultryLinks = POULTRY_LINKS.filter((item) => canSeeNav(item.to))
  const visiblePoultrySections = POULTRY_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeNav(item.to)),
  })).filter((section) => section.items.length > 0)

  const poultryActive = pathname.includes("/dashboard/poultry")
  const [poultryOpen, setPoultryOpen] = useState(poultryActive)

  useEffect(() => {
    if (poultryActive) setPoultryOpen(true)
  }, [poultryActive])

  const sectionDefaults = useMemo(
    () =>
      Object.fromEntries(
        POULTRY_SECTIONS.map((section) => [section.id, section.isActive(pathname)])
      ) as Record<string, boolean>,
    [pathname]
  )

  const systemNav = [
    {
      to: "/dashboard/equipment",
      icon: Tractor,
      label: "Equipment",
      isActive: pathname.includes("/equipment"),
    },
    {
      to: "/dashboard/notifications",
      icon: Bell,
      label: "Notifications",
      isActive:
        pathname === "/dashboard/notifications" ||
        (pathname.startsWith("/dashboard/notifications/") && !pathname.includes("/settings/")),
    },
    {
      to: "/dashboard/invoices",
      icon: FileText,
      label: "Invoices",
      isActive: pathname.includes("/dashboard/invoices"),
    },
    {
      to: "/dashboard/settings/profile",
      icon: Settings,
      label: "Settings",
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ].filter((item) => canSeeNav(item.to))

  const showPoultryNav =
    visiblePoultryLinks.length > 0 ||
    visiblePoultrySections.length > 0 ||
    canSeeNav("/dashboard/poultry/tasks")

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900 shadow-sm [&_[data-sidebar=sidebar]]:bg-transparent"
    >
      <SidebarHeader className="border-b border-slate-200/80 px-3 py-4">
        <Logo compact={!open} variant="light" />
        {open && activeFarm?.name && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Active farm
            </p>
            <p className="truncate text-sm font-medium text-slate-900">{activeFarm.name}</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-800"
                >
                  <Link to="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 bg-slate-200" />

        {showPoultryNav && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Poultry
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={poultryOpen} onOpenChange={setPoultryOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={poultryActive}
                      tooltip="Poultry"
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-800"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Poultry</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto h-4 w-4 text-slate-400 transition-transform duration-200",
                          poultryOpen && "rotate-90"
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 border-l border-slate-200 pl-3">
                      {visiblePoultryLinks.map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={item.isActive(pathname)}
                            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-800"
                          >
                            <Link to={item.to}>{item.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}

                      {visiblePoultrySections.map((section) => (
                        <NavSectionCollapsible
                          key={section.id}
                          section={section}
                          pathname={pathname}
                          defaultOpen={sectionDefaults[section.id]}
                          visibleItems={section.items}
                        />
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {canSeeNav("/dashboard/poultry/tasks") && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.includes("/poultry/tasks")}
                  tooltip="Tasks"
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-800"
                >
                  <Link to="/dashboard/poultry/tasks">
                    <ClipboardList className="h-4 w-4" />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {showPoultryNav && systemNav.length > 0 && <SidebarSeparator className="my-2 bg-slate-200" />}

        {systemNav.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.label}
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-800"
                    >
                      <Link to={item.to}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/80 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={open ? "Collapse sidebar" : "Expand sidebar"}
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              <span>{open ? "Collapse" : "Expand"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {open && (
          <p className="px-3 pb-1 text-[10px] text-slate-400">⌘B to toggle sidebar</p>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export default SideBarCom
