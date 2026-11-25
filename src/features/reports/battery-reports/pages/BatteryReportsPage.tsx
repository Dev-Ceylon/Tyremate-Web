import React, { useState } from "react"
import { useBatteryReportOverview } from "../hooks/useBatteryReportOverview"
import { useBatteryTransactions } from "../hooks/useBatteryTransactions"
import { useBatteryReportExport } from "../hooks/useBatteryReportExport"
import { BatteryReportHeader } from "../components/BatteryReportHeader"
import { BatteryOverviewCards } from "../components/BatteryOverviewCards"
import { BatteryTimeSeriesChart } from "../components/BatteryTimeSeriesChart"
import { BatteryBrandSplitCard } from "../components/BatteryBrandSplitCard"
import { TopBatteriesTable } from "../components/TopBatteriesTable"
import { BatteryHealthCard } from "../components/BatteryHealthCard"
import { BatteryTransactionsTable } from "../components/BatteryTransactionsTable"

export default function BatteryReportsPage() {
  const [activeView, setActiveView] = useState<"overview" | "transactions">("overview")

  // Overview Hook
  const {
    preset,
    customFrom,
    customTo,
    interval,
    brand,
    overview,
    loading: overviewLoading,
    error: overviewError,
    setPreset,
    setCustomRange,
    setInterval,
    setBrand,
    refresh: refreshOverview,
  } = useBatteryReportOverview()

  // Transactions Hook
  const {
    items: transactions,
    totalCount,
    summary: transactionSummary,
    pagination,
    type: activeType,
    searchTerm,
    sortBy,
    sortOrder,
    loading: txLoading,
    error: txError,
    setType: setActiveType,
    setSearchTerm,
    setPage,
    handleSort,
    refetch: refetchTransactions,
  } = useBatteryTransactions({
    preset,
    fromDate: preset === "custom" ? customFrom : undefined,
    toDate: preset === "custom" ? customTo : undefined,
    brand,
  })

  // Export Hook
  const { isExporting, exportReport } = useBatteryReportExport()

  const handleExport = (exportType: "transactions" | "summary") => {
    exportReport(exportType, {
      preset,
      fromDate: preset === "custom" ? customFrom : undefined,
      toDate: preset === "custom" ? customTo : undefined,
      brand,
      type: activeType,
      searchTerm,
    })
  }

  const handleRefreshAll = () => {
    refreshOverview()
    refetchTransactions()
  }

  return (
    <main className="app-shell report-page-shell">
      {/* 1. Header with Controls, Preset Selector, Brand Filter, and CSV Export */}
      <BatteryReportHeader
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        brand={brand}
        onPresetChange={setPreset}
        onCustomRangeApply={setCustomRange}
        onBrandChange={setBrand}
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
            <p className="hero-text text-muted">Calculating battery performance and aggregation metrics...</p>
          </section>
        ) : overviewError ? (
          <section className="panel report-error-panel">
            <p className="hero-text text-danger">{overviewError}</p>
          </section>
        ) : overview ? (
          <div className="report-overview-content">
            {/* KPI Overview Metric Cards */}
            <BatteryOverviewCards
              summary={overview.summary}
              growth={overview.growth}
            />

            {/* Time-Series Trend Chart */}
            <BatteryTimeSeriesChart
              points={overview.timeSeries}
              interval={interval}
              onIntervalChange={setInterval}
              dateRangeLabel={overview.meta.label}
            />

            {/* Manufacturer & Vehicle Segment Split */}
            <BatteryBrandSplitCard
              brands={overview.brandBreakdown}
              applications={overview.applicationBreakdown}
            />

            {/* Top Selling Batteries Table */}
            <TopBatteriesTable
              batteries={overview.topBatteries}
            />

            {/* Battery Health, Shelf-Life & Expiry Control */}
            <BatteryHealthCard
              alerts={overview.healthAlerts}
            />
          </div>
        ) : null
      ) : (
        /* Detailed Transactions Ledger View */
        <BatteryTransactionsTable
          items={transactions}
          totalCount={totalCount}
          summary={transactionSummary}
          pagination={pagination}
          activeType={activeType}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={txLoading}
          onTypeChange={setActiveType}
          onSearchChange={setSearchTerm}
          onPageChange={setPage}
          onSort={handleSort}
        />
      )}
    </main>
  )
}
