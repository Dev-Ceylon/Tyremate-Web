"use client"
import { useState } from "react"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import { Navigate, useSearchParams } from "@/lib/router"
import { DatabaseConnectionCard } from "../components/DatabaseConnectionCard"
import { DatabaseMaintenanceCard } from "../components/DatabaseMaintenanceCard"
import { SchemaStatusCard } from "../components/SchemaStatusCard"
import { CloudinarySettingsCard } from "../components/CloudinarySettingsCard"
import { UsersCard } from "../components/UsersCard"

const TABS = [
  { id: "database", label: "Database", permission: "settings.manage" },
  { id: "storage", label: "File storage", permission: "settings.manage" },
  { id: "users", label: "Users", permission: "user.manage" },
] as const

type TabId = (typeof TABS)[number]["id"]

/** Web edition admin panel: database, Cloudinary and user administration. */
export default function AdminPage() {
  const { hasPermission } = useAuthorization()
  const [searchParams, setSearchParams] = useSearchParams()
  const visible = TABS.filter((t) => hasPermission(t.permission))
  const requested = searchParams.get("tab") as TabId | null
  const [active, setActive] = useState<TabId | undefined>(
    visible.find((t) => t.id === requested)?.id ?? visible[0]?.id,
  )

  if (visible.length === 0) return <Navigate to="/" replace />

  const select = (id: TabId) => {
    setActive(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  return (
    <main className="app-shell tm-admin">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Admin panel</h1>
          <p className="hero-text">Configure the database, file storage and user access for this TyreMate installation.</p>
        </div>
      </section>

      <div className="tm-tabs" role="tablist" aria-label="Admin sections">
        {visible.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`admin-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`admin-panel-${tab.id}`}
            className="tm-tab"
            onClick={() => select(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`admin-panel-${active}`} aria-labelledby={`admin-tab-${active}`} className="tm-admin">
        {active === "database" ? (
          <>
            <DatabaseConnectionCard />
            <SchemaStatusCard />
            <DatabaseMaintenanceCard />
          </>
        ) : null}
        {active === "storage" ? <CloudinarySettingsCard /> : null}
        {active === "users" ? <UsersCard /> : null}
      </div>
    </main>
  )
}
