import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { useSalesOrderList } from "../hooks/useSalesOrderList"
import { SalesOrderTable } from "../components/SalesOrderTable"
import { useSalesOrderDeliveryProgresses } from "../hooks/useSalesOrderDeliveryProgresses"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import type { SOCategory } from "../../../shared/constants/soCategoryConstants"

export default function SalesOrderListPage() {
  const navigate = useNavigate()
  const { salesOrders, loading, error, deletingId, handleDelete } = useSalesOrderList()
  const { deliveryMap } = useSalesOrderDeliveryProgresses(salesOrders)
  const [categoryFilter, setCategoryFilter] = useState<"all" | SOCategory>("all")

  const categoryTabs = useMemo(() => {
    const tyreCount = salesOrders.filter((so) => (so.Category || "tyre") === "tyre").length
    const batteryCount = salesOrders.filter((so) => so.Category === "battery").length

    return [
      { key: "all", label: "All Categories", badge: salesOrders.length },
      { key: "tyre", label: "Tyres", badge: tyreCount },
      { key: "battery", label: "Batteries", badge: batteryCount },
    ]
  }, [salesOrders])

  const filteredSalesOrders = useMemo(() => {
    if (categoryFilter === "all") return salesOrders
    return salesOrders.filter((so) => (so.Category || "tyre") === categoryFilter)
  }, [salesOrders, categoryFilter])

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

        <div className="so-filter-tabs-wrapper">
          <FilterTabs
            tabs={categoryTabs}
            activeKey={categoryFilter}
            onChange={(key) => setCategoryFilter(key as "all" | SOCategory)}
          />
        </div>

        {loading ? (
          <p className="hero-text">Loading sales orders...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <SalesOrderTable data={filteredSalesOrders} deletingId={deletingId} onDelete={handleDelete} deliveryProgressMap={deliveryMap} />
        )}
      </section>
    </main>
  )
}