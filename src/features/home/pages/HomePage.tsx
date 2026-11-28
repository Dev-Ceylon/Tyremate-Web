import React from "react"
import { useAuthContext } from "../../auth/hooks/AuthProvider"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import TyreMateControlCenter from "../components/TyreMateControlCenter"
import SalesRepWorkspace from "../components/SalesRepWorkspace"
import { SalesRepHomeTargets } from "../../sales-target/components/SalesRepHomeTargets"

export default function HomePage() {
  const { user, logout } = useAuthContext()
  const { hasAnyPermission, hasPermission } = useAuthorization()

  const isAdminOrSuperAdmin = Boolean(
    user?.roles?.some(
      (r) =>
        Number(r.roleId) === 0 ||
        Number(r.roleId) === 1 ||
        r.roleName === "Admin" ||
        r.roleName === "Super Admin"
    )
  )

  const isEligibleSalesRep = !isAdminOrSuperAdmin && hasPermission("targets.view_own")

  const canViewControlCenter = hasAnyPermission(
    "inventory.manage",
    "inventory.view",
    "so.view",
    "po.view",
  )

  return (
    <main className="app-shell">
      {canViewControlCenter ? (
        <>
          <TyreMateControlCenter onSignOut={logout} />

          {/* Sales Target Progress for Eligible Sales Representatives */}
          {isEligibleSalesRep && (
            <div className="target-section-mb">
              <SalesRepHomeTargets />
            </div>
          )}

          <section className="content-grid">
            <article className="info-panel panel panel-strong">
              <p className="section-label">Session</p>
              <h2>Signed in as {user?.username ?? "Team member"}</h2>
              <p>
                Your dashboard is connected and ready. Use products for inventory
                operations, sales and purchase order management, and master data reference records.
              </p>
            </article>

            <article className="info-panel panel panel-strong">
              <p className="section-label">Quick Start</p>
              <h2>Recommended next actions</h2>
              <ul className="feature-list">
                <li>Review current inventory in the products table.</li>
                <li>Open Storage Manager to review branch storage locations.</li>
                <li>Manage sales and customer orders.</li>
                <li>Manage purchase orders and supplier procurement.</li>
                <li>Update suppliers, customers, or tyres in master data.</li>
                <li>Use the top navigation to switch modules quickly.</li>
              </ul>
            </article>
          </section>
        </>
      ) : (
        <SalesRepWorkspace />
      )}
    </main>
  )
}
