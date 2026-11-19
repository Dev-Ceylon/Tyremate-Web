import type { ReactNode } from "react"
import { useAuthorization } from "../hooks/auth/useAuthorization"

interface PermissionGateProps {
  permission?: string
  anyPermission?: string[]
  allPermissions?: string[]
  role?: string
  fallback?: ReactNode
  children: ReactNode
}

export default function PermissionGate({
  permission,
  anyPermission,
  allPermissions,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuthorization()

  let allowed = false

  if (permission) {
    allowed = hasPermission(permission)
  } else if (anyPermission && anyPermission.length > 0) {
    allowed = hasAnyPermission(...anyPermission)
  } else if (allPermissions && allPermissions.length > 0) {
    allowed = hasAllPermissions(...allPermissions)
  } else if (role) {
    allowed = hasRole(role)
  } else {
    allowed = true
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}
