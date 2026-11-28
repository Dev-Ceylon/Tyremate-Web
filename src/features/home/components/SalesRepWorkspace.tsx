import React from "react"
import { Link } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"
import { useInquiryList } from "../../inquiry/hooks/useInquiryList"
import { SalesRepHomeTargets } from "../../sales-target/components/SalesRepHomeTargets"

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
      <section className="page-header panel target-section-mb">
        <div>
          <p className="eyebrow">Sales Representative</p>
          <h1>Sales Dashboard</h1>
          <p className="hero-text">
            Welcome to TyreMate. Monitor your real-time target quotas, create and track customer
            inquiries, and follow up on quotes.
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
          <PermissionGate permission="targets.view_own">
            <Link className="secondary-action" to="/my-targets">
              My Targets
            </Link>
          </PermissionGate>
        </div>
      </section>

      {/* Target Quota & Performance Section */}
      <PermissionGate permission="targets.view_own">
        <SalesRepHomeTargets />
      </PermissionGate>

      {/* Inquiry Pipeline Section */}
      <section className="panel target-section-mb">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Inquiry Pipeline</p>
            <h2>Customer Inquiries</h2>
          </div>
          <div className="header-actions">
            <Link className="secondary-action" to="/inquiries">
              All Inquiries
            </Link>
          </div>
        </div>

        <div className="metrics-grid">
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
        </div>
      </section>
    </>
  )
}

export default SalesRepWorkspace
