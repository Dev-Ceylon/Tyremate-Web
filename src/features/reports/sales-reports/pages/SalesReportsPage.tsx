import { useState } from "react"
import { useSalesReportOverview } from "../hooks/useSalesReportOverview"
import { useSalesTransactions } from "../hooks/useSalesTransactions"
import { useReportExport } from "../hooks/useReportExport"
import { SalesReportHeader } from "../components/SalesReportHeader"
import { SalesOverviewCards } from "../components/SalesOverviewCards"
import { SalesTimeSeriesChart } from "../components/SalesTimeSeriesChart"
import { ChannelSplitCard } from "../components/ChannelSplitCard"
import { PaymentBreakdownCard } from "../components/PaymentBreakdownCard"
import { TopProductsTable } from "../components/TopProductsTable"
import { TopCustomersTable } from "../components/TopCustomersTable"
import { SalesTransactionsTable } from "../components/SalesTransactionsTable"

export default function SalesReportsPage() {
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
  } = useSalesReportOverview()

  // Transactions Hook
  const {
    transactions,
    totalCount,
    pageSummary,
    pagination,
    category,
    searchTerm,
    sortBy,
    sortOrder,
    loading: txLoading,
    error: txError,
    setCategory,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: refetchTransactions,
  } = useSalesTransactions({
    preset,
    fromDate: preset === "custom" ? customFrom : undefined,
    toDate: preset === "custom" ? customTo : undefined,
  })

  // Export Hook
  const { isExporting, exportReport } = useReportExport()

  const handleExport = (type: "transactions" | "summary" | "top_products") => {
    exportReport(type, {
      preset,
      fromDate: preset === "custom" ? customFrom : undefined,
      toDate: preset === "custom" ? customTo : undefined,
      category,
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
      <SalesReportHeader
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
            <p className="hero-text text-muted">Calculating financial metrics and aggregation...</p>
          </section>
        ) : overviewError ? (
          <section className="panel report-error-panel">
            <p className="hero-text text-danger">{overviewError}</p>
          </section>
        ) : overview ? (
          <>
            {/* 2a. Executive KPI Metrics */}
            <SalesOverviewCards
              summary={overview.summary}
              growth={overview.growth}
            />

            {/* 2b. Time-Series Stacked Velocity Chart */}
            <SalesTimeSeriesChart
              points={overview.timeSeries}
              interval={interval}
              onIntervalChange={setInterval}
              dateRangeLabel={overview.dateRange.label}
            />

            {/* 2c. Sales Channel Distribution */}
            <ChannelSplitCard summary={overview.summary} />

            {/* 2d. Payment Tender Methods */}
            <PaymentBreakdownCard payments={overview.paymentBreakdown} />

            {/* 2e. Top Performing Products & Services */}
            <TopProductsTable products={overview.topProducts} />

            {/* 2f. Top Accounts by Revenue */}
            <TopCustomersTable
              customers={overview.topCustomers}
              totalNetRevenue={overview.summary.netRevenue}
            />
          </>
        ) : null
      ) : (
        /* 3. Detailed Transaction Ledger View */
        <SalesTransactionsTable
          transactions={transactions}
          totalCount={totalCount}
          pageSummary={pageSummary}
          pagination={pagination}
          category={category}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={txLoading}
          error={txError}
          onCategoryChange={setCategory}
          onSearchChange={setSearchTerm}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onSort={handleSort}
        />
      )}
    </main>
  )
}
