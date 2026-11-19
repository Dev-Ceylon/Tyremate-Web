import type { ReactNode } from "react"
import { useDevTempLockStatus } from "../hooks/useDevTempLockStatus"

export function DevTempLockGate({ children }: { children: ReactNode }) {
  const { status, error, refresh } = useDevTempLockStatus()

  if (!status && !error) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div>
            <p className="eyebrow">TyreMate</p>
            <h1>Checking application access</h1>
            <p className="hero-text">Please wait while this installation is checked.</p>
          </div>
        </section>
      </main>
    )
  }

  if (error || !status) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div>
            <p className="eyebrow">Access check</p>
            <h1>TyreMate is unavailable</h1>
            <p className="hero-text">The application could not verify its access status. Your database has been kept.</p>
            {error ? <p className="error-text">{error}</p> : null}
          </div>
          <div className="header-actions">
            <button type="button" className="primary-action" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (status.locked) {
    const expiresAt = status.expiresAtUtc
      ? new Date(status.expiresAtUtc).toLocaleString()
      : "Unavailable"

    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div>
            <p className="eyebrow">Development access</p>
            <h1>TyreMate is locked</h1>
            <p className="hero-text">The temporary development access period has ended.</p>
            <p className="secondary-text">Expired: {expiresAt}</p>
            <p className="secondary-text">Your database has not been deleted. Contact your administrator for access.</p>
          </div>
        </section>
      </main>
    )
  }

  return <>{children}</>
}
