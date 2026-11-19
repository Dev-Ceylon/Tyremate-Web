"use client"
import type { ReactNode } from "react"
import { Navigate, OutletProvider } from "@/lib/router"
import { useAuthContext } from "../../features/auth/hooks/AuthProvider"
import AppLayout from "../layouts/AppLayout"

/** AuthGuard + AppLayout from the desktop routes, with the Next page as the outlet. */
export default function AuthGuardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="tm-boot" role="status">
        <div className="tm-boot-spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <OutletProvider outlet={children} base="/">
      <AppLayout />
    </OutletProvider>
  )
}
