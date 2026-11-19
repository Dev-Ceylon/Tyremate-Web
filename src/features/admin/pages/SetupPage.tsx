"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getBackendStatus, startBackend } from "../../../../web/bridge/backendClient"
import { ToastProvider } from "../../../shared/ui/toast/ToastProvider"
import { ConfirmProvider } from "../../../shared/ui/confirm/ConfirmProvider"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { BrandLogo } from "../../../shell/web/BrandLogo"
import { useBackendStatus } from "../../../shell/web/useBackendStatus"
import { DatabaseConnectionCard } from "../components/DatabaseConnectionCard"
import { databaseMaintenance } from "../services/adminClient"

/**
 * Pre-login database setup. Reachable from the login screen and whenever the
 * configured database cannot be opened, so a broken configuration can always
 * be fixed. Destructive/administrative operations live in the admin panel.
 */
function SetupContent() {
  const status = useBackendStatus()
  const confirm = useConfirm()
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  // Connect with the saved settings straight away so the real status is shown.
  useEffect(() => {
    if (getBackendStatus().state === "idle") void startBackend().catch(() => {})
  }, [])

  const resetLocal = async () => {
    const ok = await confirm({
      title: "Erase the local database?",
      message: "All TyreMate data stored in this browser will be deleted. Remote databases are not affected.",
      confirmLabel: "Erase local data",
      danger: true,
    })
    if (!ok) return
    try {
      await databaseMaintenance.resetLocal()
      await databaseMaintenance.restart()
      setResetMessage("The local database was erased and recreated.")
    } catch (error) {
      setResetMessage(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <main className="app-shell tm-admin" style={{ maxWidth: "64rem", margin: "0 auto" }}>
      <section className="page-header panel">
        <div className="tm-inline" style={{ gap: "1rem" }}>
          <BrandLogo size={52} />
          <div>
            <p className="eyebrow">TyreMate setup</p>
            <h1>Database settings</h1>
            <p className="hero-text">Connect this browser to your TyreMate database.</p>
          </div>
        </div>
        <div className="header-actions">
          <Link className={status.state === "ready" ? "primary-action" : "secondary-action"} href="/login">
            Continue to sign in
          </Link>
        </div>
      </section>

      <DatabaseConnectionCard />

      {status.state !== "idle" && status.config.driver === "local" ? (
        <section className="panel tm-card">
          <div className="tm-danger-zone">
            <h3>Start over</h3>
            <p className="tm-note">If the local database is damaged you can erase it here. Sign in and use Admin → Database to back up first.</p>
            <div className="tm-inline">
              <button type="button" className="danger-action" onClick={resetLocal}>
                Erase local database
              </button>
            </div>
            {resetMessage ? <p className="tm-message tm-message-ok">{resetMessage}</p> : null}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default function SetupPage() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SetupContent />
      </ConfirmProvider>
    </ToastProvider>
  )
}
