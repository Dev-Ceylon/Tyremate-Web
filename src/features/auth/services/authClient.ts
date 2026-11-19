import type { User } from "../models/user"

export const authClient = {
  login(data: { username: string; password: string }): Promise<User> {
    return window.api.auth.login(data)
  },

  clearUser(): Promise<void> {
    return window.api.auth.clearUser()
  },

  getUser(): Promise<User | null> {
    return window.api.auth.getUser()
  },

  onUnauthorized(callback: () => void): () => void {
    return window.api.auth.onUnauthorized(callback)
  },
}
