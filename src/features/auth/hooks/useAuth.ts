// features/auth/hooks/useAuth.ts

import { useState, useEffect } from "react"
import { authService } from "../services/authService"
import type { User } from "../models/user"


export function useAuth() {

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const existingUser = await authService.getCurrentUser()
        setUser(existingUser)
      } catch (error) {
        console.error("Failed to initialize auth state:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    return authService.onUnauthorized(async () => {
      try {
        await authService.logout()
      } catch (error) {
        console.error("Failed to clear session on unauthorized:", error)
      }
      setUser(null)
    })
  }, [])

  const login = async (username: string, password: string) => {
    const u = await authService.login(username, password)
    setUser(u)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    setUser(await authService.getCurrentUser())
  }

  return { user, login, logout, loading, refreshUser }
}
