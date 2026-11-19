export interface UserRole {
  roleId: number
  roleName: string
  description?: string
}

export interface User {
  id: number
  username: string
  displayName?: string
  isActive?: number
  roles: UserRole[]
  permissions: string[]
  /** Web edition: true when the user signed in with the seeded default password. */
  usingDefaultPassword?: boolean
}
