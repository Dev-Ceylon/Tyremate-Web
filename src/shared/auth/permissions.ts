import type { UserRole } from "../../features/auth/models/user"

const GOD_PERMISSION = "god"

export function hasPermission(permissions: string[], permission: string): boolean {
  if (!permissions || permissions.length === 0) return false
  if (permissions.includes(GOD_PERMISSION)) return true
  return permissions.includes(permission)
}

export function hasAnyPermission(permissions: string[], ...perms: string[]): boolean {
  if (!permissions || permissions.length === 0) return false
  if (permissions.includes(GOD_PERMISSION)) return true
  return perms.some((p) => permissions.includes(p))
}

export function hasAllPermissions(permissions: string[], ...perms: string[]): boolean {
  if (!permissions || permissions.length === 0) return false
  if (permissions.includes(GOD_PERMISSION)) return true
  return perms.every((p) => permissions.includes(p))
}

export function hasRole(roles: UserRole[], roleName: string): boolean {
  if (!roles || roles.length === 0) return false
  return roles.some((r) => r.roleName === roleName)
}

export function hasGodPermission(permissions: string[]): boolean {
  return permissions?.includes(GOD_PERMISSION) ?? false
}
