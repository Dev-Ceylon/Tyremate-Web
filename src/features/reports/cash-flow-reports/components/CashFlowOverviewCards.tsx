import React from "react"
import { TrendingUp, TrendingDown, ArrowRight, Scale } from "lucide-react"
import type { CashFlowSummary } from "../models/cashFlowReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface CashFlowOverviewCardsProps {
  summary: CashFlowSummary
}

export const CashFlowOverviewCards: React.FC<CashFlowOverviewCardsProps> = ({ summary }) => {
  const comparison = summary.comparison || {
    inflowGrowth: 0,
    outflowGrowth: 0,
    netGrowth: 0,
    expectedInflowGrowth: 0,
    cashGrowth: 0,
    bankTransferGrowth: 0,
    chequeCollectedGrowth: 0,
    chequePendingGrowth: 0,
    poSpendGrowth: 0,
    refundGrowth: 0,
  }

  const renderGrowthBadge = (growthPercent: number, invertGoodBad = false) => {
    if (growthPercent === 0) {
      return (
        <span className="report-growth-badge neutral">
          <ArrowRight size={12} />
          <span>0.0% vs prior</span>
        </span>
      )
    }

    const isPositive = growthPercent > 0
    const isGood = invertGoodBad ? !isPositive : isPositive

    return (
      <span className={`report-growth-badge ${isGood ? "positive" : "negative"}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>
          {isPositive ? "+" : ""}
          {growthPercent}% vs prior
        </span>
      </span>
    )
  }

  const isNetPositive = summary.netRealizedCashFlow >= 0

  return (
    <section className="metrics-grid report-overview-metrics">
      {/* 1. Realized Cash Inflow */}
      <article className="metric-card panel panel-strong report-card-highlight">
        <div className="report-card-top">
          <span className="metric-label">Realized Cash Inflow (Liquid)</span>
          {renderGrowthBadge(comparison.inflowGrowth)}
        </div>
        <strong className="text-success">{formatLKR(summary.totalRealizedInflow)}</strong>
        <p>
          Liquid customer collections ({summary.inflow.cashCount + summary.inflow.bankTransferCount + summary.inflow.chequeCollectedCount} receipts).
        </p>
      </article>

      {/* 2. Total Cash Outflow */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Total Cash Outflow (Disbursements)</span>
          {renderGrowthBadge(comparison.outflowGrowth, true)}
        </div>
        <strong className="text-danger">{formatLKR(summary.totalOutflow)}</strong>
        <p>
          PO restocking ({formatLKR(summary.outflow.poSpend)}) + customer refunds ({formatLKR(summary.outflow.refundTotal)}).
        </p>
      </article>

      {/* 3. Net Realized Cash Position */}
      <article className="metric-card panel panel-strong">
        <div className="report-card-top">
          <span className="metric-label">Net Realized Cash Position</span>
          {renderGrowthBadge(comparison.netGrowth)}
        </div>
        <strong className={isNetPositive ? "text-success" : "text-danger"}>
          {isNetPositive ? "+" : ""}
          {formatLKR(summary.netRealizedCashFlow)}
        </strong>
        <p>
          {isNetPositive ? "Cash surplus" : "Cash deficit"} for the selected period.
        </p>
      </article>

      {/* 4. Cheques Pending Clearance */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Cheques In-Clearing</span>
          <span className="status-badge-inline status-pending">Pending</span>
        </div>
        <strong className="text-warning">{formatLKR(summary.inflow.chequePending)}</strong>
        <p>
          {summary.inflow.chequePendingCount} uncleared cheque{summary.inflow.chequePendingCount === 1 ? "" : "s"} awaiting bank clearance.
        </p>
      </article>

      {/* 5. Projected Net Position */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Projected Net Cash Position</span>
          <Scale size={14} className="report-icon-muted" />
        </div>
        <strong>{formatLKR(summary.netProjectedCashFlow)}</strong>
        <p>Total liquid cash position assuming all pending cheques clear.</p>
      </article>

      {/* 6. Cash In Register (Physical Cash) */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Physical Cash in Register</span>
          {renderGrowthBadge(comparison.cashGrowth)}
        </div>
        <strong>{formatLKR(summary.inflow.cash)}</strong>
        <p>{summary.inflow.cashCount} immediate over-the-counter cash receipts.</p>
      </article>
    </section>
  )
}
