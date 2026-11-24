import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import { STATUS_METADATA } from "../../../shared/constants/statusConstants"
import { usePurchaseOrderList } from "../hooks/usePurchaseOrderList"
import { PurchaseOrderTable } from "../components/PurchaseOrderTable"
import { LoadingState } from "../../../shared/ui/progress"

export default function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<"all" | "tyre" | "battery">("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { purchaseOrders, loading, error } = usePurchaseOrderList()

  const categoryTabs = useMemo(() => {
    const tyreCount = purchaseOrders.filter((po) => (po.Category || "tyre") === "tyre").length
    const batteryCount = purchaseOrders.filter((po) => po.Category === "battery").length

    return [
      { key: "all", label: "All Categories", badge: purchaseOrders.length },
      { key: "tyre", label: "Tyres", badge: tyreCount },
      { key: "battery", label: "Batteries", badge: batteryCount },
    ]
  }, [purchaseOrders])

  const poInCategory = useMemo(() => {
    if (categoryFilter === "all") return purchaseOrders
    return purchaseOrders.filter((po) => (po.Category || "tyre") === categoryFilter)
  }, [purchaseOrders, categoryFilter])

  const statusTabs = useMemo(() => {
    const countByStatus: Record<string, number> = {}
    poInCategory.forEach((po) => {
      const code = po.StatusCode ?? "unknown"
      countByStatus[code] = (countByStatus[code] ?? 0) + 1
    })

    return [
      { key: "all", label: "All Statuses", badge: poInCategory.length },
      ...Object.entries(STATUS_METADATA).map(([code, meta]) => ({
        key: code,
        label: meta.name,
        badge: countByStatus[code] ?? 0,
      })),
    ]
  }, [poInCategory])

  const filteredPurchaseOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return poInCategory.filter((po) => {
      if (statusFilter !== "all" && po.StatusCode !== statusFilter) return false
      if (dateFilter && po.Date !== dateFilter) return false

      if (query) {
        const searchable = [
          String(po.ID),
          po.Category ?? "tyre",
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
  }, [poInCategory, statusFilter, dateFilter, searchQuery])

  const isFiltering = categoryFilter !== "all" || statusFilter !== "all" || !!dateFilter || !!searchQuery.trim()

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
            New PO
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Purchase Order List</h2>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <FilterTabs tabs={categoryTabs} activeKey={categoryFilter} onChange={(key) => setCategoryFilter(key as any)} />
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
          <LoadingState message="Loading purchase orders…" />
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <PurchaseOrderTable data={filteredPurchaseOrders} />
        )}
      </section>
    </main>
  )
}