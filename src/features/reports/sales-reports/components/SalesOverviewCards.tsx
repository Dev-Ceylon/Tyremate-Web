import React from "react"
import { TrendingUp, TrendingDown, ArrowRight, Percent, RotateCcw } from "lucide-react"
import type { SalesSummary, PeriodGrowth } from "../models/salesReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface SalesOverviewCardsProps {
  summary: SalesSummary
  growth: PeriodGrowth
}

export const SalesOverviewCards: React.FC<SalesOverviewCardsProps> = ({ summary, growth }) => {
  const renderGrowthBadge = (growthPercent: number) => {
    if (growthPercent === 0) {
      return (
        <span className="report-growth-badge neutral">
          <ArrowRight size={12} />
          <span>0.0% vs prior</span>
        </span>
      )
    }

    const isPositive = growthPercent > 0
    return (
      <span className={`report-growth-badge ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>
          {isPositive ? "+" : ""}
          {growthPercent}% vs prior
        </span>
      </span>
    )
  }

  return (
    <section className="metrics-grid report-overview-metrics">
      {/* 1. Net Revenue */}
      <article className="metric-card panel panel-strong report-card-highlight">
        <div className="report-card-top">
          <span className="metric-label">Net Sales Revenue</span>
          {renderGrowthBadge(growth.netRevenueGrowth)}
        </div>
        <strong>{formatLKR(summary.netRevenue)}</strong>
        <p>Actual realized revenue after trade discounts and returns.</p>
      </article>

      {/* 2. Gross Revenue */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Gross Sales</span>
          {renderGrowthBadge(growth.grossRevenueGrowth)}
        </div>
        <strong>{formatLKR(summary.grossRevenue)}</strong>
        <p>Total pre-discount transaction volume across all channels.</p>
      </article>

      {/* 3. Total Discounts */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Discounts Granted</span>
          <Percent size={14} className="report-icon-muted" />
        </div>
        <strong>{formatLKR(summary.totalDiscounts)}</strong>
        <p>
          {summary.grossRevenue > 0
            ? `${((summary.totalDiscounts / summary.grossRevenue) * 100).toFixed(1)}% of gross sales value`
            : "No discounts given"}
        </p>
      </article>

      {/* 4. Deductions / Returns */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Returns &amp; Deductions</span>
          <RotateCcw size={14} className="report-icon-muted" />
        </div>
        <strong>{formatLKR(summary.totalReturns)}</strong>
        <p>
          {summary.channels.returns.count} approved credit note
          {summary.channels.returns.count === 1 ? "" : "s"} / refunds.
        </p>
      </article>

      {/* 5. Total Transactions */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Total Transactions</span>
          {renderGrowthBadge(growth.transactionsGrowth)}
        </div>
        <strong>{summary.totalTransactions}</strong>
        <p>
          {summary.channels.tyres.orderCount || 0} SOs, {summary.channels.dag.takeCount || 0} DAG takes,{" "}
          {summary.channels.otherServices.serviceCount || 0} services.
        </p>
      </article>

      {/* 6. Average Order Value */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Average Order Value</span>
          {renderGrowthBadge(growth.averageOrderValueGrowth)}
        </div>
        <strong>{formatLKR(summary.averageOrderValue)}</strong>
        <p>Average net revenue generated per order / service take.</p>
      </article>
    </section>
  )
}
