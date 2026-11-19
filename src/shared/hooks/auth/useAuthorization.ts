import { useAuthContext } from "../../../features/auth/hooks/AuthProvider"
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasGodPermission,
} from "../../auth/permissions"

export function useAuthorization() {
  const { user } = useAuthContext()

  const permissions = user?.permissions ?? []
  const roles = user?.roles ?? []

  return {
    user,
    permissions,
    roles,
    hasPermission: (perm: string) => hasPermission(permissions, perm),
    hasAnyPermission: (...perms: string[]) => hasAnyPermission(permissions, ...perms),
    hasAllPermissions: (...perms: string[]) => hasAllPermissions(permissions, ...perms),
    hasRole: (roleName: string) => hasRole(roles, roleName),
    hasGodPermission: () => hasGodPermission(permissions),
  }
}
