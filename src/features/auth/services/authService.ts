// features/auth/services/authService.ts

import type { User } from "../models/user"
import { authClient } from "./authClient"

export const authService = {

  async login(username: string, password: string): Promise<User> {
    const user = await authClient.login({ username, password })

    localStorage.setItem("user", JSON.stringify(user))

    return user
  },

  async logout() {
    localStorage.removeItem("user")
    await authClient.clearUser()
  },

  // getCurrentUser(): User | null {
  //   const data = localStorage.getItem("user")
  //   return data ? JSON.parse(data) : null
  // }

  async getCurrentUser(): Promise<User | null> {
    return authClient.getUser()
  },

  onUnauthorized(callback: () => void): () => void {
    return authClient.onUnauthorized(callback)
  },
}
