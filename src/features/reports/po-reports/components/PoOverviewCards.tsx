import React from "react"
import { TrendingUp, TrendingDown, ArrowRight, Percent } from "lucide-react"
import type { PoSummary, PoPeriodGrowth } from "../models/poReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface PoOverviewCardsProps {
  summary: PoSummary
  growth: PoPeriodGrowth
}

export const PoOverviewCards: React.FC<PoOverviewCardsProps> = ({ summary, growth }) => {
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

  const discountPercent =
    summary.grossSpend > 0 ? ((summary.totalDiscounts / summary.grossSpend) * 100).toFixed(1) : "0.0"

  return (
    <section className="metrics-grid report-overview-metrics">
      {/* 1. Net Spend */}
      <article className="metric-card panel panel-strong report-card-highlight">
        <div className="report-card-top">
          <span className="metric-label">Net Procurement Spend</span>
          {renderGrowthBadge(growth.netSpendGrowth)}
        </div>
        <strong>{formatLKR(summary.netSpend)}</strong>
        <p>Actual procurement expenditure after supplier discounts.</p>
      </article>

      {/* 2. Gross Spend */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Gross Order Value</span>
          {renderGrowthBadge(growth.grossSpendGrowth)}
        </div>
        <strong>{formatLKR(summary.grossSpend)}</strong>
        <p>Total pre-discount value of purchase orders issued.</p>
      </article>

      {/* 3. Trade Discounts */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Discounts Saved</span>
          <Percent size={14} className="report-icon-muted" />
        </div>
        <strong>{formatLKR(summary.totalDiscounts)}</strong>
        <p>
          {summary.grossSpend > 0
            ? `${discountPercent}% saved on gross procurement`
            : "No supplier discounts recorded"}
        </p>
      </article>

      {/* 4. Total Purchase Orders */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Purchase Orders</span>
          {renderGrowthBadge(growth.poCountGrowth)}
        </div>
        <strong>{summary.totalPOs}</strong>
        <p>
          {summary.approvalStats.adminApprovedCount} admin approved, {summary.approvalStats.supplierApprovedCount} supplier confirmed.
        </p>
      </article>

      {/* 5. Tyre Units Procured */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Tyres Procured</span>
          {renderGrowthBadge(growth.tyreCountGrowth)}
        </div>
        <strong>{summary.totalTyresOrdered.toLocaleString()} units</strong>
        <p>Total physical tyre units ordered for warehouse stock.</p>
      </article>

      {/* 6. Average PO Value */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Average PO Value</span>
          {renderGrowthBadge(growth.averagePoValueGrowth)}
        </div>
        <strong>{formatLKR(summary.averagePoValue)}</strong>
        <p>Average net procurement spend per purchase order.</p>
      </article>
    </section>
  )
}
