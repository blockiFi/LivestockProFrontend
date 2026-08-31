import type { ReactNode } from "react"
import { PermissionGate } from "./PermissionGate"

type ActionGateProps = {
  anyOf: readonly string[]
  children: ReactNode
  fallback?: ReactNode
}

/** Shorthand for PermissionGate with action permission arrays from actionPermissions.ts */
export function ActionGate({ anyOf, children, fallback = null }: ActionGateProps) {
  return (
    <PermissionGate anyOf={[...anyOf]} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
