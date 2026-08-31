import { NavLink, Outlet, useLoaderData, useLocation } from "react-router-dom"
import { Bell, Building2, CreditCard, LockKeyhole, Palette, Shield, User, Wallet, Wheat } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { viewFarmSettings } from "@/lib/permissions"

type SettingsContext = {
  permissions?: string[] | Array<{ name?: string }>
}

type SettingsSection = {
  to: string
  label: string
  icon: typeof User
  anyOf?: string[]
  group?: "account" | "farm"
}

function normalizePermissionNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "name" in item) {
        return String((item as { name: string }).name)
      }
      return ""
    })
    .filter(Boolean)
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { to: "profile", label: "Profile", icon: User, group: "account" },
  { to: "security", label: "Security", icon: LockKeyhole, group: "account" },
  { to: "preferences", label: "Preferences", icon: Palette, group: "account" },
  { to: "notifications", label: "Notifications", icon: Bell, group: "account", anyOf: [...viewFarmSettings] },
  { to: "farm", label: "Farm", icon: Building2, group: "farm", anyOf: ["view farm", "manage farm settings"] },
  { to: "invoicing", label: "Invoicing", icon: CreditCard, group: "farm", anyOf: ["manage farm settings"] },
  {
    to: "feed-ages",
    label: "Feed Ages",
    icon: Wheat,
    group: "farm",
    anyOf: ["view farm", "view feed types", "manage farm settings", "update feed types"],
  },
  {
    to: "team",
    label: "Team & Access",
    icon: Shield,
    group: "farm",
    anyOf: ["view users", "view roles", "view permissions"],
  },
  { to: "billing", label: "Billing & Plan", icon: Wallet, group: "farm", anyOf: ["manage billing"] },
]

export default function SettingsLayout() {
  const data = useLoaderData() as SettingsContext
  const location = useLocation()
  const { permissions: storePermissions, canAny } = usePermissions()

  const loaderPermissions = normalizePermissionNames(data?.permissions)
  const permissions =
    loaderPermissions.length > 0 ? loaderPermissions : normalizePermissionNames(storePermissions)

  const hasAny = (required: string[]) =>
    required.some((permission) => permissions.includes(permission) || canAny([permission]))

  const sections = SETTINGS_SECTIONS.filter((section) => {
    if (!section.anyOf?.length) return true
    return hasAny(section.anyOf)
  })

  const accountSections = sections.filter((section) => section.group === "account")
  const farmSections = sections.filter((section) => section.group === "farm")

  const renderNavItem = (section: SettingsSection) => {
    const Icon = section.icon
    return (
      <NavLink
        key={section.to}
        to={section.to}
        end
        className={({ isActive }) =>
          cn(
            "flex min-w-max items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{section.label}</span>
      </NavLink>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, workspace defaults, operational alerts, and access controls.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="flex gap-4 overflow-x-auto md:flex-col">
              {accountSections.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Account
                  </p>
                  {accountSections.map(renderNavItem)}
                </div>
              )}
              {farmSections.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Farm
                  </p>
                  {farmSections.map(renderNavItem)}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            <Outlet key={location.pathname} />
          </div>
        </div>
      </div>
    </div>
  )
}
