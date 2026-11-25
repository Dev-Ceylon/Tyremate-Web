import React from "react"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import type {
  BatteryTransactionRecord,
  BatteryTransactionType,
} from "../models/batteryReport"
import { TRANSACTION_TYPE_TABS } from "../constants/batteryReportConstants"
import { formatLKR } from "../../../../shared/utils/formatters"

interface BatteryTransactionsTableProps {
  items: BatteryTransactionRecord[]
  totalCount: number
  summary: { totalQty: number; totalAmount: number }
  pagination: { page: number; limit: number; totalCount: number; totalPages: number }
  activeType: BatteryTransactionType
  searchTerm: string
  sortBy: string
  sortOrder: "ASC" | "DESC"
  loading: boolean
  onTypeChange: (type: BatteryTransactionType) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onSort: (column: string) => void
}

export const BatteryTransactionsTable: React.FC<BatteryTransactionsTableProps> = ({
  items,
  totalCount,
  summary,
  pagination,
  activeType,
  searchTerm,
  sortBy,
  sortOrder,
  loading,
  onTypeChange,
  onSearchChange,
  onPageChange,
  onSort,
}) => {
  const getTypeBadgeClass = (type: BatteryTransactionRecord["type"]) => {
    switch (type) {
      case "SALE":
        return "status-badge-inline status-completed"
      case "PROCUREMENT":
        return "status-badge-inline status-approved"
      case "RETURN":
        return "status-badge-inline status-danger"
      default:
        return "status-badge-inline status-draft"
    }
  }

  return (
    <section className="table-panel panel panel-strong report-transactions-panel">
      {/* 1. Header with Type Tabs and Search Bar */}
      <div className="report-tx-controls">
        {/* Type Filter Tabs */}
        <div className="filter-tabs" role="tablist">
          {TRANSACTION_TYPE_TABS.map((tab) => {
            const isActive = activeType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-tab ${isActive ? "filter-tab-active" : ""}`}
                onClick={() => onTypeChange(tab.key)}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="report-search-wrap">
          <Search size={15} className="report-search-icon" />
          <input
            type="text"
            className="report-search-input"
            placeholder="Search ref #, brand, customer..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="report-search-clear"
              onClick={() => onSearchChange("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 2. Financial Summary Banner for Current Filter */}
      <div className="report-selection-banner panel">
        <div className="selection-metric">
          <span className="metric-label-sm">Matching Movements</span>
          <strong className="metric-value-bold">{items.length} of {totalCount}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Total Quantity</span>
          <strong className="metric-value-bold">{summary.totalQty} units</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Net Value Realized</span>
          <strong className="metric-value-bold text-success">{formatLKR(summary.totalAmount)}</strong>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Ref No</th>
              <th onClick={() => onSort("date")} className="cursor-pointer">
                <span className="th-content">
                  Date {sortBy === "date" && <ArrowUpDown size={12} />}
                </span>
              </th>
              <th>Battery Item</th>
              <th>Specification</th>
              <th>Partner / Account</th>
              <th onClick={() => onSort("qty")} className="text-right cursor-pointer">
                <span className="th-content justify-end">
                  Qty {sortBy === "qty" && <ArrowUpDown size={12} />}
                </span>
              </th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Disc %</th>
              <th onClick={() => onSort("amount")} className="text-right cursor-pointer">
                <span className="th-content justify-end">
                  Net Amount {sortBy === "amount" && <ArrowUpDown size={12} />}
                </span>
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center report-empty-message">
                  <p className="text-muted">Loading battery movements...</p>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center report-empty-message">
                  <p className="text-muted">No battery movements match the selected criteria.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.type}-${item.orderId}-${item.lineId}`}>
                  <td>
                    <span className={getTypeBadgeClass(item.type)}>
                      {item.type}
                    </span>
                  </td>
                  <td><strong>{item.refNo}</strong></td>
                  <td>{item.date}</td>
                  <td><strong>{item.brand}</strong> {item.model}</td>
                  <td><span className="stat-badge">{item.spec}</span></td>
                  <td>{item.partnerName}</td>
                  <td className="text-right font-semibold">{item.qty}</td>
                  <td className="text-right">{formatLKR(item.unitPrice)}</td>
                  <td className="text-right">{item.discount > 0 ? `${item.discount}%` : "-"}</td>
                  <td
                    className={`text-right font-semibold ${
                      item.netAmount < 0 ? "text-danger" : "text-brand-primary"
                    }`}
                  >
                    {formatLKR(item.netAmount)}
                  </td>
                  <td><span className="stat-badge">{item.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="report-pagination-bar">
          <span className="text-muted text-sm">Page {pagination.page} of {pagination.totalPages}</span>
          <div className="tm-inline">
            <button
              type="button"
              className="secondary-action"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
