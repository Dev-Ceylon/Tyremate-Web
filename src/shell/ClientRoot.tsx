"use client"
/**
 * Client-side application root. Mirrors the desktop renderer's main.tsx +
 * AppRoutes: ErrorBoundary > DevTempLockGate > AppProviders > routes, with the
 * login page outside the AuthGuard. Everything renders only in the browser
 * (static export), behind a gate that waits for the backend worker.
 */
import "./web/apiInstall"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { ErrorBoundary } from "../shared/errors/ErrorBoundary"
import { DevTempLockGate } from "../features/dev-temp-lock/components/DevTempLockGate"
import { AppProviders } from "./providers/AppProviders"
import { useAppInitializer } from "../shared/state/useAppInitializer"
import { useGlobalErrorHandlers } from "../shared/errors/useGlobalErrorHandlers"
import { BackendGate } from "./web/BackendGate"
import AuthGuardLayout from "./web/AuthGuardLayout"

function AppInitializer() {
  useAppInitializer()
  useGlobalErrorHandlers()
  return null
}

function normalize(pathname: string | null) {
  const p = (pathname ?? "/").replace(/\/+$/, "")
  return p === "" ? "/" : p
}

export default function ClientRoot({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const pathname = normalize(usePathname())

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="tm-boot" role="status" aria-live="polite">
        <div className="tm-boot-spinner" aria-hidden="true" />
        <p>Loading TyreMate…</p>
      </div>
    )
  }

  // Database setup must work even when the database cannot be reached.
  if (pathname === "/setup") {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  const isLogin = pathname === "/login"

  return (
    <ErrorBoundary>
      <BackendGate>
        <DevTempLockGate>
          <AppProviders>
            <AppInitializer />
            {isLogin ? children : <AuthGuardLayout>{children}</AuthGuardLayout>}
          </AppProviders>
        </DevTempLockGate>
      </BackendGate>
    </ErrorBoundary>
  )
}
