import type { ReactNode } from "react"

import { usePermissions } from "@/hooks/usePermissions"

interface PermissionGateProps {
  permission?: string
  anyOf?: string[]
  allOf?: string[]
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions()

  let allowed = true

  if (permission) {
    allowed = can(permission)
  } else if (anyOf?.length) {
    allowed = canAny(anyOf)
  } else if (allOf?.length) {
    allowed = canAll(allOf)
  }

  return <>{allowed ? children : fallback}</>
}
