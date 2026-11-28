import { useInvoices, type InvoiceListFilter, type InvoiceSourceFilter } from "../hooks/useInvoices"
import { InvoiceTable } from "../components/InvoiceTable"
import { LoadingState } from "../../../shared/ui/progress"

const STATUS_FILTERS: { key: InvoiceListFilter; label: string }[] = [
  { key: "all", label: "All Invoices" },
  { key: "outstanding", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
]

const SOURCE_FILTERS: { key: InvoiceSourceFilter; label: string }[] = [
  { key: "all", label: "All Sources" },
  { key: "dag", label: "DAG Retreading" },
  { key: "so", label: "Sales Orders" },
  { key: "other_service", label: "Other Services" },
  { key: "delivery", label: "Deliveries" },
  { key: "direct", label: "Direct" },
]

export default function InvoiceListPage() {
  const {
    invoices,
    visibleInvoices,
    loading,
    error,
    filter,
    setFilter,
    sourceFilter,
    setSourceFilter,
    searchQuery,
    setSearchQuery,
    isFiltering,
  } = useInvoices()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Finance</p>
          <h1>Invoices</h1>
          <p className="hero-text">View customer invoices, outstanding balances, and overdue accounts.</p>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Invoice List</h2>
          <div className="header-actions">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={filter === f.key ? "primary-action table-action" : "secondary-action table-action"}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="invoice-filter-bar">
          <div className="invoice-search-wrapper">
            <input
              type="text"
              className="text-input invoice-search-input"
              placeholder="Search by invoice #, customer, DAG / SO #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="invoice-filter-group">
            {SOURCE_FILTERS.map((sf) => (
              <button
                key={sf.key}
                type="button"
                className={sourceFilter === sf.key ? "primary-action table-action" : "secondary-action table-action"}
                onClick={() => setSourceFilter(sf.key)}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        {isFiltering && (
          <div className="search-results-info">
            <p className="hero-text">
              Showing {visibleInvoices.length} of {invoices.length} invoices
            </p>
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading invoices…" />
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <InvoiceTable data={visibleInvoices} />
        )}
      </section>
    </main>
  )
}

