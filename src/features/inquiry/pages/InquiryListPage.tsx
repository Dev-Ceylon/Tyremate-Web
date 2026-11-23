import { useMemo, useState } from "react"
import { Navigate, useNavigate } from "@/lib/router"
import { useInquiryList } from "../hooks/useInquiryList"
import { InquiryTable } from "../components/InquiryTable"
import { FilterTabs } from "../../../shared/ui/filterTabs/FilterTabs"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import PermissionGate from "../../../shared/components/PermissionGate"
import type { InquiryCategory } from "../models/inquiry"

export type InquiryConversionFilter = "all" | "converted" | "unconverted"
export type InquiryStatusFilter = "all" | "approved" | "draft"

export default function InquiryListPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuthorization()
  const { inquiries, loading, error, deletingId, handleDelete } = useInquiryList()

  const [categoryFilter, setCategoryFilter] = useState<"all" | InquiryCategory>("all")
  const [conversionFilter, setConversionFilter] = useState<InquiryConversionFilter>("all")
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

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
    const query = searchQuery.trim().toLowerCase()

    return inquiries.filter((inquiry) => {
      // 1. Category Filter
      if (categoryFilter !== "all") {
        const itemCategory = (inquiry.Category || "tyre").toLowerCase()
        if (itemCategory !== categoryFilter) return false
      }

      // 2. Conversion Filter (Has SO vs Open)
      if (conversionFilter === "converted") {
        if (!inquiry.ConvertedSOID) return false
      } else if (conversionFilter === "unconverted") {
        if (inquiry.ConvertedSOID) return false
      }

      // 3. Approval Status Filter
      if (statusFilter === "approved") {
        if (Number(inquiry.IsAdminApproved) !== 1) return false
      } else if (statusFilter === "draft") {
        if (Number(inquiry.IsAdminApproved) === 1) return false
      }

      // 4. Date Filter
      if (dateFilter) {
        if (inquiry.Date !== dateFilter && !inquiry.Date?.startsWith(dateFilter)) {
          return false
        }
      }

      // 5. Search Query
      if (query) {
        const customerName =
          inquiry.Customer?.CustomerName ||
          inquiry.CustomerName ||
          ""
        const customerCode =
          (inquiry.Customer && !inquiry.Customer.IsWalkinCustomer
            ? inquiry.Customer.CustomerCode
            : "") ||
          inquiry.CustomerCode ||
          ""
        const isWalkin = inquiry.Customer?.IsWalkinCustomer ? "walkin walk-in" : ""
        const customerIdStr = inquiry.CustomerID ? `customer #${inquiry.CustomerID}` : ""

        const tyreSpecs = (inquiry.tyres || [])
          .map((t) => [t.Brand, t.Size, t.Pattern].filter(Boolean).join(" "))
          .join(" ")
        const batterySpecs = (inquiry.batteries || [])
          .map((b) => [b.Brand, b.Model, b.Capacity, b.PartNumber].filter(Boolean).join(" "))
          .join(" ")

        const searchable = [
          inquiry.InquiryID,
          `#${inquiry.InquiryID}`,
          `inq-${inquiry.InquiryID}`,
          inquiry.ConvertedSOID ? `so ${inquiry.ConvertedSOID} so #${inquiry.ConvertedSOID} #${inquiry.ConvertedSOID}` : "",
          inquiry.Date,
          inquiry.Category || "tyre",
          customerName,
          customerCode,
          isWalkin,
          customerIdStr,
          inquiry.Notes,
          inquiry.IsAdminApproved ? "approved" : "draft pending",
          inquiry.ConvertedSOID ? "converted has so" : "open unconverted not converted",
          tyreSpecs,
          batterySpecs,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        if (!searchable.includes(query)) return false
      }

      return true
    })
  }, [inquiries, categoryFilter, conversionFilter, statusFilter, dateFilter, searchQuery])

  const isFiltering =
    categoryFilter !== "all" ||
    conversionFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(dateFilter) ||
    Boolean(searchQuery.trim())

  const handleResetFilters = () => {
    setCategoryFilter("all")
    setConversionFilter("all")
    setStatusFilter("all")
    setDateFilter("")
    setSearchQuery("")
  }

  if (!hasPermission("inquiry.view")) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Inquiry Management</h1>
          <p className="hero-text">View and manage customer inquiries, track approval status, and convert to sales orders.</p>
        </div>
        <div className="header-actions">
          <PermissionGate permission="inquiry.create">
            <button className="primary-action" onClick={() => navigate("/inquiries/new")}>
              Create New Inquiry
            </button>
          </PermissionGate>
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

        <div className="table-filter-controls">
          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="inquiry-conversion-filter">
              Conversion
            </label>
            <select
              id="inquiry-conversion-filter"
              className="text-input"
              value={conversionFilter}
              onChange={(e) => setConversionFilter(e.target.value as InquiryConversionFilter)}
            >
              <option value="all">All Inquiries</option>
              <option value="converted">Converted (Has SO)</option>
              <option value="unconverted">Not Converted (Open)</option>
            </select>
          </div>

          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="inquiry-status-filter">
              Status
            </label>
            <select
              id="inquiry-status-filter"
              className="text-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InquiryStatusFilter)}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft / Pending</option>
            </select>
          </div>

          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="inquiry-date-filter">
              Date
            </label>
            <input
              id="inquiry-date-filter"
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
          </div>

          <div className="search-input-wrapper">
            <input
              type="text"
              className="text-input search-input"
              placeholder="Search by ID, customer, notes, SO..."
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
                ✕
              </button>
            )}
          </div>

          {isFiltering && (
            <button
              type="button"
              className="secondary-action"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>

        {isFiltering && (
          <div className="search-results-info">
            <p className="hero-text">
              Showing {filteredInquiries.length} of {inquiries.length} inquiries
            </p>
          </div>
        )}

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
