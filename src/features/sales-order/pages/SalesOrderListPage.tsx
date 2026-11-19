import { useNavigate } from "@/lib/router"
import { useSalesOrderList } from "../hooks/useSalesOrderList"
import { SalesOrderTable } from "../components/SalesOrderTable"
import { useSalesOrderDeliveryProgresses } from "../hooks/useSalesOrderDeliveryProgresses"

export default function SalesOrderListPage() {
  const navigate = useNavigate()
  const { salesOrders, loading, error, deletingId, handleDelete } = useSalesOrderList()
  const { deliveryMap } = useSalesOrderDeliveryProgresses(salesOrders)

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Sales Order History</h1>
          <p className="hero-text">View and manage all customer sales records and financial summaries.</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("/sales-orders/new")}>
            Create New Order
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Order List</h2>
        </div>

        {loading ? (
          <p className="hero-text">Loading sales orders...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <SalesOrderTable data={salesOrders} deletingId={deletingId} onDelete={handleDelete} deliveryProgressMap={deliveryMap} />
        )}
      </section>
    </main>
  )
}