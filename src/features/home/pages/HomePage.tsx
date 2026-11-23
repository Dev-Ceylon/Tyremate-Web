import { Link } from "@/lib/router"
import { useAuthContext } from "../../auth/hooks/AuthProvider"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import PermissionGate from "../../../shared/components/PermissionGate"
import TyreMateControlCenter from "../components/TyreMateControlCenter"

export default function HomePage() {
  const { user, logout } = useAuthContext()
  const { hasAnyPermission } = useAuthorization()

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
        <>
          <section className="page-header panel">
            <div>
              <p className="eyebrow">Sales Representative</p>
              <h1>Inquiry Workspace</h1>
              <p className="hero-text">
                Welcome to TyreMate. Create new customer inquiries, track quotes and requested
                quantities, and manage follow-ups.
              </p>
            </div>

            <div className="header-actions">
              <PermissionGate permission="inquiry.create">
                <Link className="primary-action" to="/inquiries/new">
                  + New Inquiry
                </Link>
              </PermissionGate>
              <Link className="secondary-action" to="/inquiries">
                View Inquiries
              </Link>
              <button className="ghost-link" onClick={logout} type="button">
                Sign Out
              </button>
            </div>
          </section>

          <section className="content-grid">
            <PermissionGate permission="inquiry.create">
              <article className="info-panel panel panel-strong">
                <p className="section-label">Quick Action</p>
                <h2>New Customer Inquiry</h2>
                <p>
                  Generate a new inquiry for tyres or batteries. Capture customer preferences,
                  target quantities, and pricing for review.
                </p>
                <div className="header-actions">
                  <Link className="primary-action" to="/inquiries/new">
                    Create New Inquiry
                  </Link>
                </div>
              </article>
            </PermissionGate>

            <article className="info-panel panel panel-strong">
              <p className="section-label">Inquiry History</p>
              <h2>View All Inquiries</h2>
              <p>
                Browse existing inquiries, monitor follow-up dates and notifications, and
                track progress toward order conversion.
              </p>
              <div className="header-actions">
                <Link className="secondary-action" to="/inquiries">
                  Open Inquiries
                </Link>
              </div>
            </article>

            <article className="info-panel panel panel-strong">
              <p className="section-label">Session</p>
              <h2>Signed in as {user?.username ?? "Sales Representative"}</h2>
              <p>
                Your sales representative workspace is active. You have permissions to create,
                view, edit, and follow up on customer inquiries.
              </p>
            </article>

            <article className="info-panel panel panel-strong">
              <p className="section-label">Quick Start</p>
              <h2>Recommended actions</h2>
              <ul className="feature-list">
                <li>Create a new inquiry from the top header or quick action card.</li>
                <li>Select existing customers or enter walk-in customer details.</li>
                <li>Add tyre or battery lines with required quantities and pricing.</li>
                <li>Check follow-ups and notifications for pending customer inquiries.</li>
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  )
}
