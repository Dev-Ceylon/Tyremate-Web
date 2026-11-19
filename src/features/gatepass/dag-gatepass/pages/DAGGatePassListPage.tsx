import { useNavigate } from "@/lib/router"
import { DAGGatePassTable } from "../components/DAGGatePassTable"
import { useDAGGatePassActions } from "../hooks/useDAGGatePassActions"
import { useExpandedRow } from "../../../../shared/hooks/useExpandedRow"

export default function DAGGatePassListPage() {
  const navigate = useNavigate()
  const expandedRow = useExpandedRow()

  const {
    dagGatePasses,
    loading,
    error,
    deletingId,
    sendingId,
    arrivedId,
    refresh,
    confirmDelete,
    confirmSend,
    confirmArrived,
  } = useDAGGatePassActions()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">DAG Gate Pass</p>
          <h1>DAG Gate Pass List</h1>
          <p className="hero-text">Review and manage DAG gate pass records.</p>
        </div>
        <div className="header-actions">
          <span className="table-count">{dagGatePasses.length} items</span>
          <button className="secondary-action" onClick={() => navigate("/gatepass/dag/new")} type="button">
            Create DAG Gate Pass
          </button>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
          <button className="secondary-action" onClick={() => navigate("/gatepass")} type="button">
            Back to Gate Pass
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        {loading ? <p className="hero-text">Loading DAG gate pass records...</p> : null}
        {error ? <p className="hero-text">{error}</p> : null}
        {!loading && !error ? (
          <div className="table-scroll table-scroll-wide">
            <DAGGatePassTable
              dagGatePasses={dagGatePasses}
              expandedRowKey={expandedRow.expandedRowKey}
              onToggleExpand={expandedRow.toggle}
              deletingId={deletingId}
              onDelete={(dagGatePass) => void confirmDelete(dagGatePass)}
              sendingId={sendingId}
              onSend={(dagGatePass) => void confirmSend(dagGatePass)}
              arrivedId={arrivedId}
              onArrived={(dagGatePass) => void confirmArrived(dagGatePass)}
            />
          </div>
        ) : null}
      </section>
    </main>
  )
}
