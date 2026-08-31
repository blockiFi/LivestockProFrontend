import { useMemo } from "react"
import { useSelector } from "react-redux"

import type { RootState } from "@/store"
import { can, canAll, canAny } from "@/lib/permissions"

export function usePermissions() {
  const permissions = useSelector((state: RootState) => state.authentication.permissions)
  const permissionsLoaded = useSelector((state: RootState) => state.authentication.permissionsLoaded)
  const permissionsLoading = useSelector((state: RootState) => state.authentication.permissionsLoading)
  const permissionsFarmId = useSelector((state: RootState) => state.authentication.permissionsFarmId)
  const activeFarmId = useSelector((state: RootState) => state.authentication.activeFarm?.id ?? null)

  return useMemo(() => {
    const isLoaded = permissionsLoaded && permissionsFarmId === activeFarmId
    const isLoading = permissionsLoading || (activeFarmId != null && !isLoaded)

    return {
      permissions,
      isLoaded,
      isLoading,
      can: (permission: string) => can(permissions, permission),
      canAny: (requiredPermissions: string[]) => canAny(permissions, requiredPermissions),
      canAll: (requiredPermissions: string[]) => canAll(permissions, requiredPermissions),
    }
  }, [permissions, permissionsLoaded, permissionsLoading, permissionsFarmId, activeFarmId])
}
