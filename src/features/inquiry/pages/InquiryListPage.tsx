import { useNavigate } from "@/lib/router"
import { useInquiryList } from "../hooks/useInquiryList"
import { InquiryTable } from "../components/InquiryTable"

export default function InquiryListPage() {
  const navigate = useNavigate()
  const { inquiries, loading, error, deletingId, handleDelete } = useInquiryList()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Inquiry Management</h1>
          <p className="hero-text">View and manage customer inquiries, track approval status, and convert to sales orders.</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("/inquiries/new")}>
            Create New Inquiry
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Inquiry List</h2>
        </div>

        {loading ? (
          <p className="hero-text">Loading inquiries...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <InquiryTable data={inquiries} deletingId={deletingId} onDelete={handleDelete} />
        )}
      </section>
    </main>
  )
}