import React from "react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type {
  SalesTransaction,
  TransactionCategory,
} from "../models/salesReport"
import { TRANSACTION_CATEGORY_TABS } from "../constants/salesReportConstants"
import { formatLKR } from "../../../../shared/utils/formatters"

interface SalesTransactionsTableProps {
  transactions: SalesTransaction[]
  totalCount: number
  pageSummary: {
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
  category: TransactionCategory
  searchTerm: string
  sortBy: string
  sortOrder: "ASC" | "DESC"
  loading: boolean
  error: string | null
  onCategoryChange: (category: TransactionCategory) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSort: (column: string) => void
}

export const SalesTransactionsTable: React.FC<SalesTransactionsTableProps> = ({
  transactions,
  totalCount,
  pageSummary,
  pagination,
  category,
  searchTerm,
  sortBy,
  sortOrder,
  loading,
  error,
  onCategoryChange,
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

  const renderCategoryBadge = (tx: SalesTransaction) => {
    let toneClass = "status-approved"
    if (tx.category === "DAG_RETREAD") toneClass = "status-completed"
    if (tx.category === "OTHER_SERVICE") toneClass = "status-arrived"

    return <span className={`status-badge-inline ${toneClass}`}>{tx.categoryLabel}</span>
  }

  return (
    <section className="table-panel panel panel-strong report-transactions-panel">
      {/* Top Filter and Search Bar */}
      <div className="report-tx-controls">
        {/* Category Tabs */}
        <div className="filter-tabs" role="tablist">
          {TRANSACTION_CATEGORY_TABS.map((tab) => {
            const isActive = tab.key === category
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-tab ${isActive ? "filter-tab-active" : ""}`}
                onClick={() => onCategoryChange(tab.key)}
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
            placeholder="Search by reference #, customer name, code..."
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
          <span className="metric-label-sm">Matching Transactions</span>
          <strong className="metric-value-bold">{totalCount}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Gross Volume</span>
          <strong className="metric-value-bold">{formatLKR(pageSummary.totalGross)}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Discounts Given</span>
          <strong className="metric-value-bold text-muted">{formatLKR(pageSummary.totalDiscount)}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Net Sales Realized</span>
          <strong className="metric-value-bold text-success">{formatLKR(pageSummary.totalNet)}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="product-table report-ledger-table">
          <thead>
            <tr>
              <th onClick={() => onSort("referenceNo")} className="cursor-pointer">
                <div className="th-content">
                  <span>Reference</span>
                  {renderSortIcon("referenceNo")}
                </div>
              </th>
              <th onClick={() => onSort("transactionDate")} className="cursor-pointer">
                <div className="th-content">
                  <span>Date &amp; Time</span>
                  {renderSortIcon("transactionDate")}
                </div>
              </th>
              <th>Channel</th>
              <th onClick={() => onSort("customerName")} className="cursor-pointer">
                <div className="th-content">
                  <span>Customer</span>
                  {renderSortIcon("customerName")}
                </div>
              </th>
              <th onClick={() => onSort("grossAmount")} className="text-right cursor-pointer">
                <div className="th-content justify-end">
                  <span>Gross</span>
                  {renderSortIcon("grossAmount")}
                </div>
              </th>
              <th className="text-right">Discount</th>
              <th onClick={() => onSort("netAmount")} className="text-right cursor-pointer">
                <div className="th-content justify-end">
                  <span>Net Amount</span>
                  {renderSortIcon("netAmount")}
                </div>
              </th>
              <th className="text-center">Payment</th>
              <th className="text-center">Order Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted">
                  Loading transaction ledger...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-danger">
                  {error}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted">
                  No transactions match the selected filters or search query.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className="report-ref-badge">{tx.referenceNo}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{tx.transactionDate}</strong>
                      <small className="text-muted d-block">{tx.fullDateTime.slice(11, 16)}</small>
                    </div>
                  </td>
                  <td>{renderCategoryBadge(tx)}</td>
                  <td>
                    <div>
                      <strong>{tx.customerName}</strong>
                      {tx.customerCode && (
                        <small className="text-muted d-block">{tx.customerCode}</small>
                      )}
                    </div>
                  </td>
                  <td className="text-right text-muted">{tx.formattedGross}</td>
                  <td className="text-right text-muted">
                    {tx.discountAmount > 0 ? tx.formattedDiscount : "—"}
                  </td>
                  <td className="text-right text-success">
                    <strong>{tx.formattedNet}</strong>
                  </td>
                  <td className="text-center">
                    <span
                      className={`status-badge-inline ${
                        tx.isPaymentCompleted ? "status-approved" : "status-pending"
                      }`}
                    >
                      {tx.isPaymentCompleted ? "PAID" : "PENDING"}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`status-badge-inline ${
                        tx.isCompleted ? "status-completed" : "status-pending"
                      }`}
                    >
                      {tx.isCompleted ? "COMPLETED" : "IN-PROGRESS"}
                    </span>
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
            of <strong>{totalCount}</strong> transactions
          </span>
          <div className="limit-selector">
            <label htmlFor="tx-limit">Per page:</label>
            <select
              id="tx-limit"
              value={pagination.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={15}>15</option>
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
            disabled={pagination.page <= 1}
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
            disabled={pagination.page >= pagination.totalPages}
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
