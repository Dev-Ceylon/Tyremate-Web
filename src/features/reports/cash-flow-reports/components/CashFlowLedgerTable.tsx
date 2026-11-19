import React from "react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import type { CashFlowLedgerItem, FlowType, PaymentFilter } from "../models/cashFlowReport"
import { FLOW_TYPE_TABS, PAYMENT_METHOD_OPTIONS } from "../constants/cashFlowReportConstants"
import { formatLKR } from "../../../../shared/utils/formatters"

interface CashFlowLedgerTableProps {
  items: CashFlowLedgerItem[]
  totalCount: number
  pageSummary: {
    totalInflow: number
    totalOutflow: number
    netAmount: number
  }
  pagination: {
    limit: number
    offset: number
    page: number
    totalPages: number
  }
  flowType: FlowType
  paymentMethod: PaymentFilter
  searchTerm: string
  sortBy: string
  sortOrder: "ASC" | "DESC"
  loading: boolean
  error: string | null
  onFlowTypeChange: (type: FlowType) => void
  onPaymentMethodChange: (method: PaymentFilter) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSort: (column: string) => void
}

export const CashFlowLedgerTable: React.FC<CashFlowLedgerTableProps> = ({
  items,
  totalCount,
  pageSummary,
  pagination,
  flowType,
  paymentMethod,
  searchTerm,
  sortBy,
  sortOrder,
  loading,
  error,
  onFlowTypeChange,
  onPaymentMethodChange,
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

  const renderStatusBadge = (item: CashFlowLedgerItem) => {
    switch (item.status) {
      case "REALIZED":
        return <span className="status-badge-inline status-completed">Realized</span>
      case "SETTLED":
        return <span className="status-badge-inline status-approved">Settled</span>
      case "PROCESSED":
        return <span className="status-badge-inline status-draft">Processed</span>
      case "PENDING_CLEARANCE":
        return <span className="status-badge-inline status-pending">Cheque Pending</span>
      default:
        return <span className="status-badge-inline status-secondary">{item.statusLabel || item.status}</span>
    }
  }

  const isNetPositive = pageSummary.netAmount >= 0

  return (
    <section className="table-panel panel panel-strong report-transactions-panel">
      {/* Top Filter and Search Bar */}
      <div className="report-tx-controls">
        {/* Flow Type Tabs */}
        <div className="filter-tabs" role="tablist">
          {FLOW_TYPE_TABS.map((tab) => {
            const isActive = tab.key === flowType
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-tab ${isActive ? "filter-tab-active" : ""}`}
                onClick={() => onFlowTypeChange(tab.key)}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Payment Instrument Filter Dropdown */}
        <div className="select-wrapper report-select-instrument">
          <select
            className="form-control form-control-sm"
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentFilter)}
            aria-label="Filter by payment instrument"
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="report-search-wrap">
          <Search size={16} className="report-search-icon" />
          <input
            type="text"
            className="report-search-input"
            placeholder="Search by ref #, customer, supplier, cheque #..."
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
          <span className="metric-label-sm">Matching Movements</span>
          <strong className="metric-value-bold">{totalCount}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Total Cash In (Inflow)</span>
          <strong className="text-success">{formatLKR(pageSummary.totalInflow)}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Total Cash Out (Outflow)</span>
          <strong className="text-danger">{formatLKR(pageSummary.totalOutflow)}</strong>
        </div>
        <div className="selection-metric">
          <span className="metric-label-sm">Net Cash Movement</span>
          <strong className={isNetPositive ? "text-success" : "text-danger"}>
            {isNetPositive ? "+" : ""}
            {formatLKR(pageSummary.netAmount)}
          </strong>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th className="col-row-number">#</th>
              <th onClick={() => onSort("referenceNo")} className="cursor-pointer">
                <span>Reference #</span>
                {renderSortIcon("referenceNo")}
              </th>
              <th onClick={() => onSort("date")} className="cursor-pointer">
                <span>Date &amp; Time</span>
                {renderSortIcon("date")}
              </th>
              <th>Movement</th>
              <th onClick={() => onSort("paymentMethod")} className="cursor-pointer">
                <span>Instrument</span>
                {renderSortIcon("paymentMethod")}
              </th>
              <th onClick={() => onSort("category")} className="cursor-pointer">
                <span>Category</span>
                {renderSortIcon("category")}
              </th>
              <th onClick={() => onSort("partyName")} className="cursor-pointer">
                <span>Counterparty</span>
                {renderSortIcon("partyName")}
              </th>
              <th>Instrument Ref</th>
              <th>Status</th>
              <th onClick={() => onSort("amount")} className="text-right cursor-pointer">
                <span>Amount (LKR)</span>
                {renderSortIcon("amount")}
              </th>
              <th className="text-right">Net Impact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-4 text-muted">
                  Loading cash movements...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={11} className="text-center py-4 text-danger">
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-4 text-muted">
                  No cash flow transactions found for the selected filter criteria.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isInflow = item.flowType === "INFLOW"
                const rowNumber = pagination.offset + index + 1

                return (
                  <tr key={item.id} className={isInflow ? "inflow-row" : "outflow-row"}>
                    <td className="text-muted text-sm">{rowNumber}</td>
                    <td>
                      <strong className="code-text">{item.referenceNo}</strong>
                    </td>
                    <td>
                      <div>
                        <span>{item.txDate}</span>
                        <div className="text-muted text-xs">
                          {item.fullDateTime.length > 10 ? item.fullDateTime.slice(11, 16) : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-inline status-badge-flow ${isInflow ? "status-approved" : "status-draft"}`}>
                        {isInflow ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {item.flowTypeLabel}
                      </span>
                    </td>
                    <td>
                      <span>{item.paymentMethodLabel}</span>
                    </td>
                    <td>
                      <span>{item.category}</span>
                    </td>
                    <td>
                      <span>{item.partyName}</span>
                    </td>
                    <td>
                      <span className="code-text text-sm">{item.instrumentReference}</span>
                    </td>
                    <td>{renderStatusBadge(item)}</td>
                    <td className="text-right font-weight-medium">
                      {formatLKR(item.amount)}
                    </td>
                    <td className={`text-right font-weight-bold ${isInflow ? "text-success" : "text-danger"}`}>
                      {isInflow ? "+" : "-"}
                      {formatLKR(item.amount)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="report-pagination-bar">
        <div className="pagination-info">
          <span>
            Showing <strong>{totalCount > 0 ? pagination.offset + 1 : 0}</strong> to{" "}
            <strong>{Math.min(pagination.offset + pagination.limit, totalCount)}</strong> of{" "}
            <strong>{totalCount}</strong> movements
          </span>

          <div className="limit-selector">
            <label htmlFor="cashflow-tx-limit">Per page:</label>
            <select
              id="cashflow-tx-limit"
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
