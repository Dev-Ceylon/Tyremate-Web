import { useInvoices, type InvoiceListFilter } from "../hooks/useInvoices"
import { InvoiceTable } from "../components/InvoiceTable"

const FILTERS: { key: InvoiceListFilter; label: string }[] = [
  { key: "all", label: "All Invoices" },
  { key: "outstanding", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
]

export default function InvoiceListPage() {
  const { visibleInvoices, loading, error, filter, setFilter } = useInvoices()

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
            {FILTERS.map((f) => (
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

        {loading ? (
          <p className="hero-text">Loading invoices...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <InvoiceTable data={visibleInvoices} />
        )}
      </section>
    </main>
  )
}
