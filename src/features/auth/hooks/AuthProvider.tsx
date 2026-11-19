
import { createContext, useContext } from "react"
import { useAuth } from "./useAuth"
import type { AuthContextType } from "../models/auth.types"


const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider")
  }

  return context
}