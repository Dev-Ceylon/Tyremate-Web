import { useNavigate } from "@/lib/router"
import { useExpandedRow } from "../../../../shared/hooks/useExpandedRow"
import { SOGatePassTable } from "../components/SOGatePassTable"
import { useSOGatePassList } from "../hooks/useSOGatePassList"

export default function SOGatePassListPage() {
  const navigate = useNavigate()
  const expandedRow = useExpandedRow()
  const { gatePasses, pendingGatePasses, loading, error, refresh } = useSOGatePassList()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales Order</p>
          <h1>SO Gate Pass List</h1>
          <p className="hero-text">Review gate passes issued for tyres collected from sales orders.</p>
        </div>
        <div className="header-actions">
          <span className="table-count">{gatePasses.length} issued</span>
          <span className="table-count">{pendingGatePasses.length} withheld</span>
          <button className="secondary-action" onClick={() => void refresh()} type="button">Refresh</button>
          <button className="secondary-action" onClick={() => navigate("/gatepass")} type="button">Back to Gate Pass</button>
        </div>
      </section>

      {error ? <p className="hero-text error-text">{error}</p> : null}

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Released</p>
            <h2>Issued Gate Passes</h2>
          </div>
        </div>
        {loading ? <p className="hero-text">Loading SO gate pass records...</p> : null}
        {!loading && !error ? (
          <div className="table-scroll table-scroll-wide">
            <SOGatePassTable
              records={gatePasses}
              expandedRowKey={expandedRow.expandedRowKey}
              onToggleExpand={expandedRow.toggle}
            />
          </div>
        ) : null}
      </section>

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Withheld</p>
            <h2>Deliveries Awaiting Payment</h2>
          </div>
          <span className="stat-badge">{pendingGatePasses.length}</span>
        </div>
        {loading ? <p className="hero-text">Loading withheld gate passes...</p> : null}
        {!loading && !error && pendingGatePasses.length === 0 ? (
          <p className="secondary-text">Every recorded delivery has a gate pass.</p>
        ) : null}
        {!loading && !error && pendingGatePasses.length > 0 ? (
          <div className="table-scroll table-scroll-wide">
            <SOGatePassTable
              records={pendingGatePasses}
              expandedRowKey={expandedRow.expandedRowKey}
              onToggleExpand={expandedRow.toggle}
            />
          </div>
        ) : null}
      </section>
    </main>
  )
}
