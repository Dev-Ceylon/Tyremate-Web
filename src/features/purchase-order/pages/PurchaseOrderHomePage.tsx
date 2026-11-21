import { Link } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"

export default function PurchaseOrderHomePage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Purchasing</p>
          <h1>Purchase Order Management</h1>
          <p className="hero-text">Select an action to manage supplier purchase orders and stock arrivals.</p>
        </div>
      </section>

      <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Create</p>
          <h2>New Purchase Order</h2>
          <p>
            Generate a new purchase order for tyres or batteries. Specify line items, quantities, and agreed pricing to restock inventory.
          </p>
          <div className="header-actions">
            <Link className="primary-action" to="/purchase-orders/new">
              New Tyre PO
            </Link>
            <Link className="secondary-action" to="/purchase-orders/new?category=battery">
              New Battery PO
            </Link>
          </div>
        </article>

        <article className="info-panel panel panel-strong">
          <p className="section-label">History</p>
          <h2>View All POs</h2>
          <p>
            Browse and manage existing purchase orders. Track fulfillment status and history of supplier transactions.
          </p>
          <div className="header-actions">
            <Link className="secondary-action" to="/purchase-orders">
              Open List
            </Link>
          </div>
        </article>

        <PermissionGate permission="reports.view">
          <article className="info-panel panel panel-strong">
            <p className="section-label">Analytics</p>
            <h2>PO Reports</h2>
            <p>
              Analyze procurement expenditure, supplier lead times, tyre order trends, and export detailed transaction ledgers.
            </p>
            <div className="header-actions">
              <Link className="primary-action" to="/reports/purchase-orders">
                View Reports
              </Link>
            </div>
          </article>
        </PermissionGate>
      </section>
    </main>
  )
}