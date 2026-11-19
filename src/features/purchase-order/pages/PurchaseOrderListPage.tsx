import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import { STATUS_METADATA } from "../../../shared/constants/statusConstants"
import { usePurchaseOrderList } from "../hooks/usePurchaseOrderList"
import { PurchaseOrderTable } from "../components/PurchaseOrderTable"

export default function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { purchaseOrders, loading, error } = usePurchaseOrderList()

  const statusTabs = useMemo(() => {
    const countByStatus: Record<string, number> = {}
    purchaseOrders.forEach((po) => {
      const code = po.StatusCode ?? "unknown"
      countByStatus[code] = (countByStatus[code] ?? 0) + 1
    })

    return [
      { key: "all", label: "All", badge: purchaseOrders.length },
      ...Object.entries(STATUS_METADATA).map(([code, meta]) => ({
        key: code,
        label: meta.name,
        badge: countByStatus[code] ?? 0,
      })),
    ]
  }, [purchaseOrders])

  const filteredPurchaseOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return purchaseOrders.filter((po) => {
      if (statusFilter !== "all" && po.StatusCode !== statusFilter) return false
      if (dateFilter && po.Date !== dateFilter) return false

      if (query) {
        const searchable = [
          String(po.ID),
          po.SoID ? `SO ${po.SoID}` : "",
          po.Date,
          po.SupplierName ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!searchable.includes(query)) return false
      }

      return true
    })
  }, [purchaseOrders, statusFilter, dateFilter, searchQuery])

  const isFiltering = statusFilter !== "all" || !!dateFilter || !!searchQuery.trim()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Purchasing</p>
          <h1>Purchase Order History</h1>
          <p className="hero-text">View and manage all supplier purchase orders and procurement logs.</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("/purchase-orders/new")}>
            Create New PO
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Purchase Order List</h2>
        </div>

        <FilterTabs tabs={statusTabs} activeKey={statusFilter} onChange={setStatusFilter} />

        <div className="table-filter-controls">
          <label className="table-filter-field">
            <span className="filter-field-label">Date</span>
            <input
              type="date"
              className="text-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button
                type="button"
                className="text-link"
                onClick={() => setDateFilter("")}
              >
                Clear
              </button>
            )}
          </label>

          <div className="search-input-wrapper">
            <input
              type="text"
              className="text-input search-input"
              placeholder="Search by ID, SO, date, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isFiltering && (
          <div className="search-results-info">
            <p className="hero-text">
              Showing {filteredPurchaseOrders.length} of {purchaseOrders.length} purchase orders
            </p>
          </div>
        )}

        {loading ? (
          <p className="hero-text">Loading purchase orders...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <PurchaseOrderTable data={filteredPurchaseOrders} />
        )}
      </section>
    </main>
  )
}