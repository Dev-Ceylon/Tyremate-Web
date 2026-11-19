"use client"
import Link from "next/link"
import { useEffect, type ReactNode } from "react"
import { getBackendStatus, restartBackend, startBackend } from "../../../web/bridge/backendClient"
import { describeDatabase, useBackendStatus } from "./useBackendStatus"
import { BrandLogo } from "./BrandLogo"

/**
 * Starts the backend worker and blocks the UI until the database is ready.
 * When the database cannot be opened, explains why and links to setup.
 */
export function BackendGate({ children }: { children: ReactNode }) {
  const status = useBackendStatus()

  useEffect(() => {
    if (getBackendStatus().state === "idle") void startBackend().catch(() => {})
  }, [])

  if (status.state === "ready") return <>{children}</>

  if (status.state === "error") {
    return (
      <main className="app-shell tm-gate">
        <section className="panel panel-strong tm-gate-card">
          <BrandLogo size={48} />
          <p className="eyebrow">Database</p>
          <h1>Cannot open the database</h1>
          <p className="hero-text">{describeDatabase(status)}</p>
          <p className="error-text" role="alert">
            {status.error}
          </p>
          <div className="header-actions">
            <button type="button" className="primary-action" onClick={() => void restartBackend().catch(() => {})}>
              Retry
            </button>
            {status.code !== "LOCKED" ? (
              <Link className="secondary-action" href="/setup">
                Database settings
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="tm-boot" role="status" aria-live="polite">
      <BrandLogo size={56} />
      <div className="tm-boot-spinner" aria-hidden="true" />
      <p>Connecting to {status.state === "starting" ? describeDatabase(status).toLowerCase() : "the database"}…</p>
      <p className="tm-boot-hint">First start on a new database creates the schema; this can take a few seconds.</p>
    </div>
  )
}
