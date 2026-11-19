import { useState } from "react"
import { usePoReportOverview } from "../hooks/usePoReportOverview"
import { usePoTransactions } from "../hooks/usePoTransactions"
import { usePoReportExport } from "../hooks/usePoReportExport"
import { PoReportHeader } from "../components/PoReportHeader"
import { PoOverviewCards } from "../components/PoOverviewCards"
import { PoTimeSeriesChart } from "../components/PoTimeSeriesChart"
import { PoStatusPipelineCard } from "../components/PoStatusPipelineCard"
import { TopSuppliersTable } from "../components/TopSuppliersTable"
import { TopProcuredTyresTable } from "../components/TopProcuredTyresTable"
import { PoTransactionsTable } from "../components/PoTransactionsTable"

export default function PoReportsPage() {
  const [activeView, setActiveView] = useState<"overview" | "transactions">("overview")

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
  } = usePoReportOverview()

  // Transactions Hook
  const {
    transactions,
    totalCount,
    pageSummary,
    pagination,
    statusCode,
    searchTerm,
    sortBy,
    sortOrder,
    loading: txLoading,
    error: txError,
    setStatusCode,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: refetchTransactions,
  } = usePoTransactions({
    preset,
    fromDate: preset === "custom" ? customFrom : undefined,
    toDate: preset === "custom" ? customTo : undefined,
  })

  // Export Hook
  const { isExporting, exportReport } = usePoReportExport()

  const handleExport = (type: "transactions" | "summary") => {
    exportReport(type, {
      preset,
      fromDate: preset === "custom" ? customFrom : undefined,
      toDate: preset === "custom" ? customTo : undefined,
      statusCode,
      searchTerm,
    })
  }

  const handleRefreshAll = () => {
    refreshOverview()
    refetchTransactions()
  }

  return (
    <main className="app-shell report-page-shell">
      {/* 1. Header with Controls, Preset Selector, and Export */}
      <PoReportHeader
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
            <p className="hero-text text-muted">Calculating procurement metrics and aggregation...</p>
          </section>
        ) : overviewError ? (
          <section className="panel report-error-panel">
            <p className="hero-text text-danger">{overviewError}</p>
          </section>
        ) : overview ? (
          <>
            {/* 2a. Executive Procurement KPI Cards */}
            <PoOverviewCards
              summary={overview.summary}
              growth={overview.growth}
            />

            {/* 2b. Time-Series Procurement Velocity Chart */}
            <PoTimeSeriesChart
              points={overview.timeSeries}
              interval={interval}
              onIntervalChange={setInterval}
              dateRangeLabel={overview.dateRange.label}
            />

            {/* 2c. Purchase Order Lifecycle Status Pipeline */}
            <PoStatusPipelineCard
              pipeline={overview.statusPipeline}
              totalNetSpend={overview.summary.netSpend}
            />

            {/* 2d. Top Suppliers Leaderboard by Spend & Volume */}
            <TopSuppliersTable
              suppliers={overview.topSuppliers}
              totalNetSpend={overview.summary.netSpend}
            />

            {/* 2e. Top Procured Tyres & Specifications */}
            <TopProcuredTyresTable tyres={overview.topTyres} />
          </>
        ) : null
      ) : (
        /* 3. Detailed PO Transaction Ledger View */
        <PoTransactionsTable
          transactions={transactions}
          totalCount={totalCount}
          pageSummary={pageSummary}
          pagination={pagination || { limit: 25, offset: 0, page: 1, totalPages: 1 }}
          statusCode={statusCode}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={txLoading}
          error={txError}
          onStatusChange={setStatusCode}
          onSearchChange={setSearchTerm}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onSort={handleSort}
        />
      )}
    </main>
  )
}
