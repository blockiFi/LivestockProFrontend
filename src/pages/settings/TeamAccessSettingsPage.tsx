import { useEffect, useMemo, useState } from "react"
import { useLoaderData } from "react-router-dom"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PermissionManagementPage from "@/pages/poultry/permission/permissionManagementPage"
import RoleManagementPage from "@/pages/poultry/permission/roleManagementPage"
import UserRoleManagementPage from "@/pages/poultry/permission/userRoleManagementPage"
import { usePermissions } from "@/hooks/usePermissions"
import { ACTIONS } from "@/lib/actionPermissions"
import type { Farm, FarmUserRoleSummary, PermissionGroup, Role } from "@/lib/types"

type LoaderData = {
  users: FarmUserRoleSummary[] | null
  roles: Role[] | null
  currentFarm: Farm | null
  PermissionGroups: PermissionGroup[] | null
}

export default function TeamAccessSettingsPage() {
  const { users, roles, currentFarm, PermissionGroups } = useLoaderData() as LoaderData
  const { canAny } = usePermissions()

  const canViewUsers = canAny([...ACTIONS.users.view])
  const canViewRoles = canAny([...ACTIONS.roles.view])
  const canViewPermissions = canAny([...ACTIONS.permissions.view])

  const tabs = useMemo(
    () =>
      [
        canViewUsers ? "members" : null,
        canViewRoles ? "roles" : null,
        canViewPermissions ? "permissions" : null,
      ].filter(Boolean) as string[],
    [canViewUsers, canViewRoles, canViewPermissions]
  )

  const defaultTab = tabs[0] ?? "members"
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    setActiveTab((current) => (tabs.includes(current) ? current : defaultTab))
  }, [defaultTab, tabs])

  if (tabs.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        You do not have permission to view team access settings.
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        {canViewUsers && <TabsTrigger value="members">Members</TabsTrigger>}
        {canViewRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
        {canViewPermissions && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
      </TabsList>

      {canViewUsers && (
        <TabsContent value="members">
          <UserRoleManagementPage embedded usersData={users} rolesData={roles} currentFarmData={currentFarm} />
        </TabsContent>
      )}
      {canViewRoles && (
        <TabsContent value="roles">
          <RoleManagementPage embedded rolesData={roles} permissionGroupsData={PermissionGroups} />
        </TabsContent>
      )}
      {canViewPermissions && (
        <TabsContent value="permissions">
          <PermissionManagementPage embedded permissionGroups={PermissionGroups} />
        </TabsContent>
      )}
    </Tabs>
  )
}
