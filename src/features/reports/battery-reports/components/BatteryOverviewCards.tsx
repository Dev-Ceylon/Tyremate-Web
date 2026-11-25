import React from "react"
import { TrendingUp, TrendingDown, ArrowRight, BatteryCharging, AlertTriangle, ShieldCheck } from "lucide-react"
import type { BatteryReportSummary, BatteryPeriodGrowth } from "../models/batteryReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface BatteryOverviewCardsProps {
  summary: BatteryReportSummary
  growth: BatteryPeriodGrowth
}

export const BatteryOverviewCards: React.FC<BatteryOverviewCardsProps> = ({ summary, growth }) => {
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
      {/* 1. Net Sales Revenue */}
      <article className="metric-card panel panel-strong report-card-highlight">
        <div className="report-card-top">
          <span className="metric-label">Battery Sales Revenue</span>
          {renderGrowthBadge(growth.revenueGrowth)}
        </div>
        <strong>{formatLKR(summary.sales.netRevenue)}</strong>
        <p>{summary.sales.totalOrders} sales orders completed.</p>
      </article>

      {/* 2. Units Sold */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Battery Units Sold</span>
          {renderGrowthBadge(growth.unitsGrowth)}
        </div>
        <strong>{summary.sales.totalUnitsSold} units</strong>
        <p>Avg order value: {formatLKR(summary.sales.averageOrderValue)}</p>
      </article>

      {/* 3. On-Hand Stock */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Current Stock On Hand</span>
          <BatteryCharging size={14} className="report-icon-muted" />
        </div>
        <strong>{summary.inventory.currentStockUnits} units</strong>
        <p>{summary.inventory.totalModels} battery models in catalog.</p>
      </article>

      {/* 4. Procurement Spend */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Procurement Spend</span>
          {renderGrowthBadge(growth.procurementGrowth)}
        </div>
        <strong>{formatLKR(summary.procurement.procurementSpend)}</strong>
        <p>{summary.procurement.totalUnitsProcured} units across {summary.procurement.totalPOs} POs.</p>
      </article>

      {/* 5. Warranty Returns */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Warranty Returns</span>
          <ShieldCheck size={14} className="report-icon-muted" />
        </div>
        <strong>{summary.returns.totalUnitsReturned} units</strong>
        <p>{summary.returns.returnCount} warranty claims processed.</p>
      </article>

      {/* 6. Batch Expiry Alerts */}
      <article className="metric-card panel">
        <div className="report-card-top">
          <span className="metric-label">Recharge / Expiry Due</span>
          <AlertTriangle size={14} className={`report-icon-muted ${summary.inventory.expiringStockUnits > 0 ? "text-danger" : ""}`} />
        </div>
        <strong className={summary.inventory.expiringStockUnits > 0 ? "text-danger" : ""}>
          {summary.inventory.expiringStockUnits} units
        </strong>
        <p>{summary.inventory.expiringBatchesCount} batches need maintenance or recharge within 30 days.</p>
      </article>
    </section>
  )
}
