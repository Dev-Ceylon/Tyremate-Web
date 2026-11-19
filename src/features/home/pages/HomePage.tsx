import { Link } from "@/lib/router"
import { useAuthContext } from "../../auth/hooks/AuthProvider"
import { useProducts } from "../../products/hooks/useProducts"
import { useTodaySales } from "../hooks/useTodaySales"
import { usePendingPurchaseOrders } from "../hooks/usePendingPurchaseOrders"
import { useLowStock } from "../hooks/useLowStock"
import SalesTrendChart from "../components/SalesTrendChart"
import PermissionGate from "../../../shared/components/PermissionGate"

export default function HomePage() {
  const { user, logout } = useAuthContext()
  const { products } = useProducts()
  const { summary } = useTodaySales()
  const { count: pendingPOCount } = usePendingPurchaseOrders()
  const { count: lowStockCount } = useLowStock()

  const totalProducts = products.length
  const averagePrice =
    totalProducts > 0
      ? products.reduce((sum, product) => sum + product.price, 0) / totalProducts
      : 0
  const highestPrice =
    totalProducts > 0
      ? Math.max(...products.map((product) => product.price))
      : 0

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">TyreMate Control Center</p>
          <h1>Dashboard</h1>
          <p className="hero-text">
            Review inventory metrics and jump directly into products or master
            records from one workspace.
          </p>
        </div>

        <div className="header-actions">
          <Link className="primary-action" to="/products">
            Open Products
          </Link>
          <Link className="secondary-action" to="/storage-manager">
            Open Storage Manager
          </Link>
          <Link className="secondary-action" to="/sales-orders/overview">
            Sales Orders
          </Link>
          <PermissionGate permission="reports.view">
            <Link className="secondary-action" to="/reports/sales">
              Sales Reports
            </Link>
            <Link className="secondary-action" to="/reports/purchase-orders">
              PO Reports
            </Link>
          </PermissionGate>
          <Link className="secondary-action" to="/purchase-orders/overview">
            Purchase Orders
          </Link>
          <Link className="secondary-action" to="/master-data">
            Open Master Data
          </Link>
          <button className="ghost-link" onClick={logout} type="button">
            Sign Out
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card panel">
          <span className="metric-label">Today's sales</span>
          <strong>${summary.TotalSale.toFixed(2)}</strong>
          <p>{summary.OrderCount} {summary.OrderCount === 1 ? "order" : "orders"} created today.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Pending purchase orders</span>
          <strong>{pendingPOCount}</strong>
          <p>Purchase orders not yet arrived or completed.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Low / out-of-stock</span>
          <strong>{lowStockCount}</strong>
          <p>Tyres and consumables at or below their stock level.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Products in catalog</span>
          <strong>{totalProducts}</strong>
          <p>Current items available in the local database.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Average price</span>
          <strong>${averagePrice.toFixed(2)}</strong>
          <p>A quick pricing snapshot across all listed products.</p>
        </article>

        <article className="metric-card panel">
          <span className="metric-label">Highest price</span>
          <strong>${highestPrice.toFixed(2)}</strong>
          <p>The most premium item currently in your product table.</p>
        </article>
      </section>

      <section className="trend-panel panel">
        <SalesTrendChart />
      </section>

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
    </main>
  )
}
