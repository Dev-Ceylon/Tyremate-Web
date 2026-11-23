import { useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { useInquiryList } from "../hooks/useInquiryList"
import { InquiryTable } from "../components/InquiryTable"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import type { InquiryCategory } from "../models/inquiry"

export default function InquiryListPage() {
  const navigate = useNavigate()
  const { inquiries, loading, error, deletingId, handleDelete } = useInquiryList()
  const [categoryFilter, setCategoryFilter] = useState<"all" | InquiryCategory>("all")

  const categoryTabs = useMemo(() => {
    const tyreCount = inquiries.filter((inq) => (inq.Category || "tyre") === "tyre").length
    const batteryCount = inquiries.filter((inq) => inq.Category === "battery").length

    return [
      { key: "all", label: "All Categories", badge: inquiries.length },
      { key: "tyre", label: "Tyres", badge: tyreCount },
      { key: "battery", label: "Batteries", badge: batteryCount },
    ]
  }, [inquiries])

  const filteredInquiries = useMemo(() => {
    if (categoryFilter === "all") return inquiries
    return inquiries.filter((inq) => (inq.Category || "tyre") === categoryFilter)
  }, [inquiries, categoryFilter])

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

        <div className="so-filter-tabs-wrapper">
          <FilterTabs
            tabs={categoryTabs}
            activeKey={categoryFilter}
            onChange={(key) => setCategoryFilter(key as "all" | InquiryCategory)}
          />
        </div>

        {loading ? (
          <p className="hero-text">Loading inquiries...</p>
        ) : error ? (
          <p className="hero-text error-text">{error}</p>
        ) : (
          <InquiryTable data={filteredInquiries} deletingId={deletingId} onDelete={handleDelete} />
        )}
      </section>
    </main>
  )
}