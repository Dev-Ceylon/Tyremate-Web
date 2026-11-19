import { useState } from "react"
import { useCashFlowOverview } from "../hooks/useCashFlowOverview"
import { useCashFlowLedger } from "../hooks/useCashFlowLedger"
import { useCashFlowExport } from "../hooks/useCashFlowExport"
import { CashFlowHeader } from "../components/CashFlowHeader"
import { CashFlowOverviewCards } from "../components/CashFlowOverviewCards"
import { CashFlowTrendChart } from "../components/CashFlowTrendChart"
import { CashFlowMethodSplitCard } from "../components/CashFlowMethodSplitCard"
import { CashFlowLedgerTable } from "../components/CashFlowLedgerTable"

export default function CashFlowReportsPage() {
  const [activeView, setActiveView] = useState<"overview" | "ledger">("overview")

  // Overview Hook
  const {
    preset,
    customFrom,
    customTo,
    interval,
    overview,
    loading: overviewLoading,
    error: overviewError,
    setPreset,
    setCustomRange,
    setInterval,
    refresh: refreshOverview,
  } = useCashFlowOverview()

  // Ledger Hook
  const {
    items,
    totalCount,
    pageSummary,
    pagination,
    flowType,
    paymentMethod,
    searchTerm,
    sortBy,
    sortOrder,
    loading: txLoading,
    error: txError,
    setFlowType,
    setPaymentMethod,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: refetchLedger,
  } = useCashFlowLedger({
    preset,
    fromDate: preset === "custom" ? customFrom : undefined,
    toDate: preset === "custom" ? customTo : undefined,
  })

  // Export Hook
  const { isExporting, exportReport } = useCashFlowExport()

  const handleExport = (type: "ledger" | "summary") => {
    exportReport(type, {
      preset,
      fromDate: preset === "custom" ? customFrom : undefined,
      toDate: preset === "custom" ? customTo : undefined,
      flowType,
      paymentMethod,
      searchTerm,
    })
  }

  const handleRefreshAll = () => {
    refreshOverview()
    refetchLedger()
  }

  return (
    <main className="app-shell report-page-shell">
      {/* 1. Header with Controls, Preset Selector, and Export */}
      <CashFlowHeader
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPresetChange={setPreset}
        onCustomRangeApply={setCustomRange}
        onRefresh={handleRefreshAll}
        isRefreshing={overviewLoading || txLoading}
        onExport={handleExport}
        isExporting={isExporting}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* 2. Main Content Views */}
      {activeView === "overview" ? (
        overviewLoading && !overview ? (
          <section className="panel report-loading-panel">
            <p className="hero-text text-muted">Calculating daily cash flow and treasury liquidity...</p>
          </section>
        ) : overviewError ? (
          <section className="panel report-error-panel">
            <p className="hero-text text-danger">{overviewError}</p>
          </section>
        ) : overview ? (
          <>
            {/* 2a. Executive Treasury KPI Cards */}
            <CashFlowOverviewCards summary={overview.summary} />

            {/* 2b. Time-Series Trend Velocity Chart */}
            <CashFlowTrendChart
              points={overview.timeSeries}
              interval={interval}
              onIntervalChange={setInterval}
              dateRangeLabel={overview.dateRange.label}
            />

            {/* 2c. Instrument & Disbursement Source Distribution */}
            <CashFlowMethodSplitCard
              breakdown={overview.methodBreakdown}
              totalRealizedInflow={overview.summary.totalRealizedInflow}
              totalOutflow={overview.summary.totalOutflow}
            />
          </>
        ) : null
      ) : (
        /* 3. Detailed Cash Flow Movement Ledger View */
        <CashFlowLedgerTable
          items={items}
          totalCount={totalCount}
          pageSummary={pageSummary}
          pagination={pagination || { limit: 25, offset: 0, page: 1, totalPages: 1 }}
          flowType={flowType}
          paymentMethod={paymentMethod}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={txLoading}
          error={txError}
          onFlowTypeChange={setFlowType}
          onPaymentMethodChange={setPaymentMethod}
          onSearchChange={setSearchTerm}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onSort={handleSort}
        />
      )}
    </main>
  )
}
