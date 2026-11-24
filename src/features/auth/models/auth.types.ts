import type { User } from "./user"

export type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User | void>
  logout: () => void
  /** Web edition: re-reads the signed-in user (e.g. after a password change). */
  refreshUser: () => Promise<void>
}