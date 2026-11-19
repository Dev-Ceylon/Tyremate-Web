import { Link } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"

export default function SalesOrderHomePage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Sales Order Management</h1>
          <p className="hero-text">Select an action to manage customer sales orders and fulfillment.</p>
        </div>
      </section>

      <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Create</p>
          <h2>New Sales Order</h2>
          <p>
            Generate a new sales order for a customer. Select tyres from stock and specify quantities and pricing.
          </p>
          <div className="header-actions">
            <Link className="primary-action" to="/sales-orders/new">
              Create New Order
            </Link>
          </div>
        </article>

        <article className="info-panel panel panel-strong">
          <p className="section-label">History</p>
          <h2>View All Orders</h2>
          <p>
            Browse and manage existing sales orders. Track status and history of previous transactions.
          </p>
          <div className="header-actions">
            <Link className="secondary-action" to="/sales-orders">
              Open List
            </Link>
          </div>
        </article>

        <PermissionGate permission="reports.view">
          <article className="info-panel panel panel-strong">
            <p className="section-label">Analytics</p>
            <h2>Sales Reports</h2>
            <p>
              Analyze multi-channel revenue velocity, visual trends, customer leaderboards, and detailed ledgers.
            </p>
            <div className="header-actions">
              <Link className="primary-action" to="/reports/sales">
                View Reports
              </Link>
            </div>
          </article>
        </PermissionGate>
      </section>
    </main>
  )
}