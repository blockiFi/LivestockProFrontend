import { Navigate, redirect } from "react-router-dom"
import { toast } from "react-toastify"

import { Authenticated, LoadBillingSettings, LoadFarmSettings, LoadFarmUsers, LoadFeedAgeRanges, LoadPermissionGroups, LoadRolesWithPermissions, LoadSettingsContext, LoadUserPreferences, requireRoutePermission } from "@/lib/loader"
import SettingsLayout from "@/pages/settings/SettingsLayout"
import ProfileSettingsPage from "@/pages/settings/ProfileSettingsPage"
import SecuritySettingsPage from "@/pages/settings/SecuritySettingsPage"
import PreferencesSettingsPage from "@/pages/settings/PreferencesSettingsPage"
import FarmSettingsPage from "@/pages/settings/FarmSettingsPage"
import InvoicingSettingsPage from "@/pages/settings/InvoicingSettingsPage"
import NotificationsSettingsPage from "@/pages/settings/NotificationsSettingsPage"
import TeamAccessSettingsPage from "@/pages/settings/TeamAccessSettingsPage"
import FeedAgeSettingsPage from "@/pages/settings/FeedAgeSettingsPage"
import BillingSettingsPage from "@/pages/settings/BillingSettingsPage"

const settingsRoutes = [
  {
    id: "settings",
    path: "settings",
    loader: async () => {
      const authenticated = await Authenticated()
      if (!authenticated) {
        toast.error("You must be logged in to access this page.")
        throw redirect("/login")
      }

      return LoadSettingsContext()
    },
    element: <SettingsLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="profile" replace />,
      },
      {
        path: "profile",
        loader: async () => LoadSettingsContext(),
        element: <ProfileSettingsPage />,
      },
      {
        path: "security",
        loader: async () => LoadSettingsContext(),
        element: <SecuritySettingsPage />,
      },
      {
        path: "preferences",
        loader: async () => LoadUserPreferences(),
        element: <PreferencesSettingsPage />,
      },
      {
        path: "farm",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          return LoadFarmSettings()
        },
        element: <FarmSettingsPage />,
      },
      {
        path: "invoicing",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          return LoadFarmSettings()
        },
        element: <InvoicingSettingsPage />,
      },
      {
        path: "notifications",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          const farmData = await LoadFarmSettings()
          const preferenceData = await LoadUserPreferences()
          return {
            ...farmData,
            userSettings: preferenceData.userSettings,
          }
        },
        element: <NotificationsSettingsPage />,
      },
      {
        path: "feed-ages",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          return LoadFeedAgeRanges()
        },
        element: <FeedAgeSettingsPage />,
      },
      {
        path: "billing",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          return LoadBillingSettings()
        },
        element: <BillingSettingsPage />,
      },
      {
        path: "team",
        loader: async ({ request }: { request: Request }) => {
          await requireRoutePermission(new URL(request.url).pathname)
          const context = await LoadSettingsContext()
          const { users } = await LoadFarmUsers()
          const { roles } = await LoadRolesWithPermissions()
          const { PermissionGroups } = await LoadPermissionGroups()

          return {
            ...context,
            users,
            roles,
            PermissionGroups,
          }
        },
        element: <TeamAccessSettingsPage />,
      },
    ],
  },
]

export default settingsRoutes
