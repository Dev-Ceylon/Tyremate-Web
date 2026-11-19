import { Navigate, Outlet } from "@/lib/router"
import { useAuthorization } from "../../shared/hooks/auth/useAuthorization"

interface RequirePermissionProps {
  permission?: string
  anyPermission?: string[]
  allPermissions?: string[]
  redirect?: string
}

export default function RequirePermission({
  permission,
  anyPermission,
  allPermissions,
  redirect = "/",
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization()

  let allowed = false

  if (permission) {
    allowed = hasPermission(permission)
  } else if (anyPermission && anyPermission.length > 0) {
    allowed = hasAnyPermission(...anyPermission)
  } else if (allPermissions && allPermissions.length > 0) {
    allowed = hasAllPermissions(...allPermissions)
  } else {
    allowed = true
  }

  if (!allowed) {
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
