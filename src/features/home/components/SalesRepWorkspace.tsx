import { Link } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"
import { useInquiryList } from "../../inquiry/hooks/useInquiryList"

type SalesRepWorkspaceProps = {
  onSignOut?: () => void
}

export function SalesRepWorkspace(_props: SalesRepWorkspaceProps = {}) {
  const { inquiries, loading } = useInquiryList()

  const totalInquiries = inquiries.length
  const convertedInquiries = inquiries.filter((i) => i.ConvertedSOID != null).length
  const openInquiries = totalInquiries - convertedInquiries

  return (
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
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card panel">
          <span className="metric-label">Active / Open Inquiries</span>
          <strong>{loading ? "..." : openInquiries}</strong>
          <p>Pending quotation or order conversion.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Converted to Orders</span>
          <strong>{loading ? "..." : convertedInquiries}</strong>
          <p>Inquiries successfully turned into Sales Orders.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Total Inquiries</span>
          <strong>{loading ? "..." : totalInquiries}</strong>
          <p>Total customer inquiries logged in system.</p>
        </article>
      </section>
    </>
  )
}

export default SalesRepWorkspace
