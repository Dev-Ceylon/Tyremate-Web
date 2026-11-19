import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import { SalesReturnQueue } from "../components/SalesReturnQueue"
import { SALES_RETURN_STATUS_OPTIONS } from "../constants/salesReturnStatusConstants"
import { useSalesReturnList } from "../hooks/useSalesReturnList"

export default function SalesReturnListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const salesReturns = useSalesReturnList()

  const statusTabs = useMemo(() => {
    const countByStatus: Record<string, number> = {}
    salesReturns.returns.forEach((item) => {
      const code = item.StatusCode ?? "unknown"
      countByStatus[code] = (countByStatus[code] ?? 0) + 1
    })

    return [
      { key: "all", label: "All", badge: salesReturns.returns.length },
      ...SALES_RETURN_STATUS_OPTIONS.map((status) => ({
        key: status.code,
        label: status.label,
        badge: countByStatus[status.code] ?? 0,
      })),
    ]
  }, [salesReturns.returns])

  const filteredReturns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return salesReturns.returns.filter((item) => {
      const requestedDate = item.RequestedDate?.slice(0, 10) ?? ""
      if (statusFilter !== "all" && item.StatusCode !== statusFilter) return false
      if (dateFilter && requestedDate !== dateFilter) return false

      if (query) {
        const searchable = [
          item.ReturnNo,
          String(item.SalesReturnID),
          `SO ${item.SoID}`,
          item.InvoiceID ? `invoice ${item.InvoiceID}` : "",
          requestedDate,
          item.ReturnTypeName ?? "",
          item.ReturnTypeCode ?? "",
          item.StatusName ?? "",
          item.StatusCode ?? "",
        ].join(" ").toLowerCase()
        if (!searchable.includes(query)) return false
      }
      return true
    })
  }, [salesReturns.returns, statusFilter, dateFilter, searchQuery])

  const isFiltering = statusFilter !== "all" || Boolean(dateFilter) || Boolean(searchQuery.trim())

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Customer Sales</p>
          <h1>Sales Returns</h1>
          <p className="hero-text">Review customer returns, track inspection status, and open a return to manage its details.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-action" onClick={() => void salesReturns.refresh()} disabled={salesReturns.loading}>
            {salesReturns.loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {salesReturns.error && <p className="error-text" role="alert">{salesReturns.error}</p>}

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header"><h2>Sales Return List</h2><span className="stat-badge">{salesReturns.returns.length} returns</span></div>
        <FilterTabs tabs={statusTabs} activeKey={statusFilter} onChange={setStatusFilter} />

        <div className="table-filter-controls">
          <label className="table-filter-field">
            <span className="filter-field-label">Date</span>
            <input type="date" className="text-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            {dateFilter && <button type="button" className="text-link" onClick={() => setDateFilter("")}>Clear</button>}
          </label>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="text-input search-input"
              placeholder="Search return, SO, invoice, type, status..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && <button type="button" className="search-clear-button" onClick={() => setSearchQuery("")} aria-label="Clear search">x</button>}
          </div>
        </div>

        {isFiltering && <div className="search-results-info"><p className="hero-text">Showing {filteredReturns.length} of {salesReturns.returns.length} sales returns</p></div>}

        {salesReturns.loading ? <p className="hero-text">Loading sales returns...</p> : salesReturns.error ? (
          <p className="hero-text error-text">{salesReturns.error}</p>
        ) : (
          <SalesReturnQueue returns={filteredReturns} onSelect={(id) => navigate(`/sales-returns/${id}`)} />
        )}
      </section>
    </main>
  )
}
