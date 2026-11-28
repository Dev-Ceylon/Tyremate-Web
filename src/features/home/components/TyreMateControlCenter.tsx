import { Link } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"
import { useProducts } from "../../products/hooks/useProducts"
import { useTodaySales } from "../hooks/useTodaySales"
import { usePendingPurchaseOrders } from "../hooks/usePendingPurchaseOrders"
import { useLowStock } from "../hooks/useLowStock"
import { usePendingViolations } from "../hooks/usePendingViolations"
import SalesTrendChart from "./SalesTrendChart"

type TyreMateControlCenterProps = {
  onSignOut: () => void
}

const formatCurrency = (val: number) =>
  `Rs. ${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function TyreMateControlCenter({ onSignOut }: TyreMateControlCenterProps) {
  const { products } = useProducts()
  const { summary } = useTodaySales()
  const { count: pendingPOCount } = usePendingPurchaseOrders()
  const { count: lowStockCount } = useLowStock()
  const { count: pendingViolationsCount } = usePendingViolations()

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
    <>
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
          <PermissionGate permission="inventory.view">
            <Link className="primary-action" to="/products">
              Open Products
            </Link>
          </PermissionGate>
          <PermissionGate permission="so.view">
            <Link className="secondary-action" to="/sales-orders/overview">
              Sales Orders
            </Link>
          </PermissionGate>
          <PermissionGate permission="invoice.view">
            <Link className="secondary-action" to="/invoices">
              Invoices
            </Link>
          </PermissionGate>
          <PermissionGate permission="so.view">
            <Link className="secondary-action" to="/gatepass">
              Gate Pass
            </Link>
          </PermissionGate>
          <PermissionGate permission="dag.view">
            <Link className="secondary-action" to="/dag">
              DAG Retreading
            </Link>
          </PermissionGate>
          <PermissionGate permission="inventory.manage">
            <Link className="secondary-action" to="/storage-manager">
              Open Storage Manager
            </Link>
          </PermissionGate>
          <PermissionGate permission="reports.view">
            <Link className="secondary-action" to="/reports/sales">
              Sales Reports
            </Link>
            <Link className="secondary-action" to="/reports/purchase-orders">
              PO Reports
            </Link>
            <Link className="secondary-action" to="/reports/batteries">
              Battery Reports
            </Link>
          </PermissionGate>
          <PermissionGate permission="po.view">
            <Link className="secondary-action" to="/purchase-orders/overview">
              Purchase Orders
            </Link>
          </PermissionGate>
          <PermissionGate anyPermission={["inventory.manage", "suppliers.view", "customers.manage"]}>
            <Link className="secondary-action" to="/master-data">
              Open Master Data
            </Link>
          </PermissionGate>
          <button className="ghost-link" onClick={onSignOut} type="button">
            Sign Out
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <PermissionGate permission="so.view">
          <article className="metric-card panel">
            <span className="metric-label">Today's sales</span>
            <strong>{formatCurrency(summary.TotalSale)}</strong>
            <p>{summary.OrderCount} {summary.OrderCount === 1 ? "order" : "orders"} created today.</p>
          </article>
        </PermissionGate>

        <PermissionGate permission="po.view">
          <article className="metric-card panel">
            <span className="metric-label">Pending purchase orders</span>
            <strong>{pendingPOCount}</strong>
            <p>Purchase orders not yet arrived or completed.</p>
          </article>
        </PermissionGate>

        <PermissionGate permission="inventory.manage">
          <article className="metric-card panel">
            <span className="metric-label">Low / out-of-stock</span>
            <strong>{lowStockCount}</strong>
            <p>Tyres, batteries and consumables at or below low stock level.</p>
          </article>
        </PermissionGate>

        <PermissionGate permission="violations.view">
          <article className="metric-card panel">
            <span className="metric-label">Policy violations pending</span>
            <strong>{pendingViolationsCount}</strong>
            <p>Sales orders awaiting discount or credit approval.</p>
          </article>
        </PermissionGate>

        <PermissionGate permission="inventory.view">
          <article className="metric-card panel">
            <span className="metric-label">Products in catalog</span>
            <strong>{totalProducts}</strong>
            <p>Current items available in the local database.</p>
          </article>

          <article className="metric-card panel">
            <span className="metric-label">Average price</span>
            <strong>{formatCurrency(averagePrice)}</strong>
            <p>A quick pricing snapshot across all listed products.</p>
          </article>

          <article className="metric-card panel">
            <span className="metric-label">Highest price</span>
            <strong>{formatCurrency(highestPrice)}</strong>
            <p>The most premium item currently in your product table.</p>
          </article>
        </PermissionGate>
      </section>

      <PermissionGate permission="so.view">
        <section className="trend-panel panel">
          <SalesTrendChart />
        </section>
      </PermissionGate>
    </>
  )
}

export default TyreMateControlCenter
