import { useNavigate } from "@/lib/router"
import { useOtherServiceList } from "../hooks/useOtherServiceList"
import { OtherServiceTable } from "../components/OtherServiceTable"

export default function OtherServicePage() {
  const navigate = useNavigate()
  const { otherServices, loading, error, deletingId, handleDelete } = useOtherServiceList()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Other Service History</h1>
          <p className="hero-text">View and manage all other service records, payments, and status.</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("/other-service/new")}>
            Create New Service
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Service List</h2>
        </div>

        {loading ? (
          <p className="hero-text">Loading other services...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <OtherServiceTable data={otherServices} deletingId={deletingId} onDelete={handleDelete} />
        )}
      </section>
    </main>
  )
}
