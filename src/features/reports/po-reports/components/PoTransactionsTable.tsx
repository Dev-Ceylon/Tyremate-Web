import React from "react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type {
  PoTransaction,
  PoStatusCode,
} from "../models/poReport"
import { PO_STATUS_FILTER_TABS } from "../constants/poReportConstants"
import { formatLKR } from "../../../../shared/utils/formatters"
import { getStatusColorClass, getStatusName } from "../../../../shared/constants/statusConstants"

interface PoTransactionsTableProps {
  transactions: PoTransaction[]
  totalCount: number
  pageSummary: {
    totalQty: number
    totalGross: number
    totalDiscount: number
    totalNet: number
  }
  pagination: {
    limit: number
    offset: number
    page: number
    totalPages: number
  }
  statusCode: PoStatusCode
  searchTerm: string
  sortBy: string
  sortOrder: "ASC" | "DESC"
  loading: boolean
  error: string | null
  onStatusChange: (status: PoStatusCode) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSort: (column: string) => void
}

export const PoTransactionsTable: React.FC<PoTransactionsTableProps> = ({
  transactions,
  totalCount,
  pageSummary,
  pagination,
  statusCode,
  searchTerm,
  sortBy,
  sortOrder,
  loading,
  error,
  onStatusChange,
  onSearchChange,
  onPageChange,
  onLimitChange,
  onSort,
}) => {
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={12} className="text-muted ml-1" />
    }
    return sortOrder === "ASC" ? (
      <ArrowUp size={12} className="text-primary ml-1" />
    ) : (
      <ArrowDown size={12} className="text-primary ml-1" />
    )
  }

  const renderStatusBadge = (tx: PoTransaction) => {
    const toneClass = getStatusColorClass(tx.statusCode) || "status-pending"
    const label = tx.statusLabel || tx.statusName || getStatusName(tx.statusCode)

    return <span className={`status-badge-inline ${toneClass}`}>{label}</span>
  }

  return (
    <section className="table-panel panel panel-strong report-transactions-panel">
      {/* Top Filter and Search Bar */}
      <div className="report-tx-controls">
        {/* Status Tabs */}
        <div className="filter-tabs" role="tablist">
          {PO_STATUS_FILTER_TABS.map((tab) => {
            const isActive = tab.key === statusCode
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-tab ${isActive ? "filter-tab-active" : ""}`}
                onClick={() => onStatusChange(tab.key)}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="report-search-wrap">
          <Search size={16} className="report-search-icon" />
          <input
            type="text"
            className="report-search-input"
            placeholder="Search by PO #, supplier name, tyre brand/size..."
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

      {/* Matching Selection Financial Summary Banner */}
      <div className="report-selection-banner panel">
        <div className="selection-metric">
          <span className="metric-label-sm">Matching Purchase Orders</span>
          <strong className="metric-value-bold">{totalCount}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Total Tyres Procured</span>
          <strong className="metric-value-bold">{pageSummary.totalQty.toLocaleString()}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Total Gross Spend</span>
          <span>{formatLKR(pageSummary.totalGross)}</span>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Discounts Saved</span>
          <span className="text-warning">-{formatLKR(pageSummary.totalDiscount)}</span>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Net Procurement Spend</span>
          <strong className="text-success">{formatLKR(pageSummary.totalNet)}</strong>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "45px" }}>#</th>
              <th onClick={() => onSort("ID")} className="cursor-pointer">
                <span>PO Ref</span>
                {renderSortIcon("ID")}
              </th>
              <th>Linked SO</th>
              <th onClick={() => onSort("Date")} className="cursor-pointer">
                <span>Order Date</span>
                {renderSortIcon("Date")}
              </th>
              <th>Supplier(s)</th>
              <th>Status</th>
              <th>Approval</th>
              <th className="text-right">Lines</th>
              <th onClick={() => onSort("totalQty")} className="text-right cursor-pointer">
                <span>Units</span>
                {renderSortIcon("totalQty")}
              </th>
              <th onClick={() => onSort("grossAmount")} className="text-right cursor-pointer">
                <span>Gross (LKR)</span>
                {renderSortIcon("grossAmount")}
              </th>
              <th className="text-right">Discount</th>
              <th onClick={() => onSort("netAmount")} className="text-right cursor-pointer">
                <span>Net Spend (LKR)</span>
                {renderSortIcon("netAmount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center py-6">
                  <div className="report-loading-state">
                    <span className="spin-icon inline-block">⏳</span>
                    <span>Loading purchase orders...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={12} className="text-center text-danger py-6">
                  {error}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center text-muted py-6">
                  No purchase orders found matching the selected criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={`${tx.poId}-${idx}`}>
                  <td>{pagination.offset + idx + 1}</td>
                  <td>
                    <span className="code-tag font-bold">{tx.referenceNo}</span>
                  </td>
                  <td>
                    {tx.soReferenceNo ? (
                      <span className="badge-count text-xs">{tx.soReferenceNo}</span>
                    ) : (
                      <span className="text-muted text-xs">Standalone</span>
                    )}
                  </td>
                  <td>
                    <span>{tx.orderDate}</span>
                  </td>
                  <td>
                    <span title={tx.supplierNames} className="truncate-text max-w-xs block font-medium">
                      {tx.supplierNames}
                    </span>
                  </td>
                  <td>{renderStatusBadge(tx)}</td>
                  <td>
                    <div className="approval-badges">
                      <span
                        className={`approval-dot ${tx.isAdminApproved ? "approved" : "pending"}`}
                        title={tx.isAdminApproved ? "Admin Approved" : "Awaiting Admin Approval"}
                      >
                        Admin
                      </span>
                      <span
                        className={`approval-dot ${tx.isSupplierApproved ? "approved" : "pending"}`}
                        title={tx.isSupplierApproved ? "Supplier Approved" : "Awaiting Supplier Approval"}
                      >
                        Supplier
                      </span>
                    </div>
                  </td>
                  <td className="text-right">{tx.lineCount}</td>
                  <td className="text-right">
                    <strong>{tx.totalQty.toLocaleString()}</strong>
                  </td>
                  <td className="text-right">{tx.formattedGross}</td>
                  <td className="text-right text-warning">
                    {tx.discountAmount > 0 ? `-${tx.formattedDiscount}` : "—"}
                  </td>
                  <td className="text-right text-success">
                    <strong>{tx.formattedNet}</strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="report-pagination-bar">
        <div className="pagination-info">
          <span>
            Showing{" "}
            <strong>
              {totalCount === 0 ? 0 : pagination.offset + 1}-
              {Math.min(pagination.offset + pagination.limit, totalCount)}
            </strong>{" "}
            of <strong>{totalCount}</strong> purchase orders
          </span>
          <div className="limit-selector">
            <label htmlFor="po-tx-limit">Per page:</label>
            <select
              id="po-tx-limit"
              value={pagination.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="pagination-actions">
          <button
            type="button"
            className="secondary-action pagination-btn"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <span className="page-indicator">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
          </span>
          <button
            type="button"
            className="secondary-action pagination-btn"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
