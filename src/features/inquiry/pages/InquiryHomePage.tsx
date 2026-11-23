import { Link, Navigate } from "@/lib/router"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import PermissionGate from "../../../shared/components/PermissionGate"

export default function InquiryHomePage() {
  const { hasPermission } = useAuthorization()

  if (!hasPermission("inquiry.view")) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Inquiry Management</h1>
          <p className="hero-text">
            Select an action to manage customer inquiries, track approval status, and prepare orders for conversion.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <PermissionGate permission="inquiry.create">
          <article className="info-panel panel panel-strong">
            <p className="section-label">Create</p>
            <h2>New Inquiry</h2>
            <p>
              Generate a new customer inquiry. Capture tyre specifications, target pricing, and quantities for review.
            </p>
            <div className="header-actions">
              <Link className="primary-action" to="/inquiries/new">
                Create New Inquiry
              </Link>
            </div>
          </article>
        </PermissionGate>

        <article className="info-panel panel panel-strong">
          <p className="section-label">History</p>
          <h2>View All Inquiries</h2>
          <p>
            Browse existing inquiries. Track reminders, administrative approvals, and monitor the conversion progress to Sales Orders.
          </p>
          <div className="header-actions">
            <Link className="secondary-action" to="/inquiries">
              Open List
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}