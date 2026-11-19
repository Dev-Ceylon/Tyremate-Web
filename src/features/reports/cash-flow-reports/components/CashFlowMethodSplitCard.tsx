import React from "react"
import { Banknote, Landmark, CheckCircle2, Clock, Truck, RotateCcw, Wrench, Disc, Package } from "lucide-react"
import type { CashFlowMethodBreakdown } from "../models/cashFlowReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface CashFlowMethodSplitCardProps {
  breakdown: CashFlowMethodBreakdown
  totalRealizedInflow: number
  totalOutflow: number
}

export const CashFlowMethodSplitCard: React.FC<CashFlowMethodSplitCardProps> = ({
  breakdown,
  totalRealizedInflow,
  totalOutflow,
}) => {
  const getInstrumentIcon = (method: string) => {
    switch (method) {
      case "CASH":
      case "csh":
        return <Banknote size={18} className="text-success" />
      case "BANK_TRANSFER":
      case "btr":
        return <Landmark size={18} className="text-primary" />
      case "CHEQUE_CLEARED":
      case "chq":
        return <CheckCircle2 size={18} className="text-accent" />
      case "CHEQUE_PENDING":
        return <Clock size={18} className="text-warning" />
      default:
        return <Banknote size={18} className="text-muted" />
    }
  }

  return (
    <div className="report-two-column-grid">
      {/* 1. Payment Instrument Distribution */}
      <article className="panel panel-strong report-breakdown-card">
        <div className="card-header-clean">
          <div>
            <span className="eyebrow">Settlements &amp; Liquidity</span>
            <h3>Inflow Payment Instruments</h3>
          </div>
          <span className="badge-count text-success">
            {formatLKR(totalRealizedInflow)}
          </span>
        </div>

        <div className="report-channel-list">
          {breakdown.inflowMethods.map((m) => (
            <div key={m.method} className="report-channel-row">
              <div className="report-channel-info">
                {getInstrumentIcon(m.method)}
                <div>
                  <strong>{m.methodLabel}</strong>
                  <div>
                    <small className="text-muted">{m.count} receipt{m.count === 1 ? "" : "s"}</small>
                  </div>
                </div>
              </div>
              <div className="report-channel-values">
                <strong className={m.isPending ? "text-warning" : "text-success"}>{formatLKR(m.amount)}</strong>
                <div>
                  <small className={m.isPending ? "status-badge-inline status-pending" : "status-badge-inline status-approved"}>
                    {m.isPending ? "Uncleared" : `${m.percentage}% Share`}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* 2. Disbursements & Revenue Streams */}
      <article className="panel panel-strong report-breakdown-card">
        <div className="card-header-clean">
          <div>
            <span className="eyebrow">Cash Disbursements</span>
            <h3>Outflow &amp; Revenue Sources</h3>
          </div>
          <span className="badge-count text-danger">
            {formatLKR(totalOutflow)}
          </span>
        </div>

        {/* Outflow Categories */}
        <div className="report-channel-list">
          {breakdown.outflowCategories.map((cat) => (
            <div key={cat.category} className="report-channel-row">
              <div className="report-channel-info">
                {cat.category === "PO_PROCUREMENT" ? (
                  <Truck size={18} className="text-danger" />
                ) : (
                  <RotateCcw size={18} className="text-warning" />
                )}
                <div>
                  <strong>{cat.categoryLabel}</strong>
                  <div>
                    <small className="text-muted">{cat.count} order{cat.count === 1 ? "" : "s"}/return{cat.count === 1 ? "" : "s"}</small>
                  </div>
                </div>
              </div>
              <div className="report-channel-values">
                <strong className="text-danger">{formatLKR(cat.amount)}</strong>
                <div>
                  <small className="status-badge-inline status-draft">
                    {cat.percentage}% of Outflow
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Inflow Revenue Streams Sub-bar */}
        <div className="report-sources-subbar">
          <span className="eyebrow d-block mb-1">Realized Inflow Sources</span>
          <div className="report-sources-grid">
            <div className="report-source-card">
              <div className="report-source-header">
                <Disc size={13} className="text-primary" />
                <small className="text-muted">Tyres (SO)</small>
              </div>
              <strong className="report-source-amount">
                {formatLKR(breakdown.inflowStreams.tyreSales, 0)}
              </strong>
            </div>

            <div className="report-source-card">
              <div className="report-source-header">
                <Package size={13} className="text-accent" />
                <small className="text-muted">DAG Retreading</small>
              </div>
              <strong className="report-source-amount">
                {formatLKR(breakdown.inflowStreams.dagSales, 0)}
              </strong>
            </div>

            <div className="report-source-card">
              <div className="report-source-header">
                <Wrench size={13} className="text-warning" />
                <small className="text-muted">Services</small>
              </div>
              <strong className="report-source-amount">
                {formatLKR(breakdown.inflowStreams.serviceSales, 0)}
              </strong>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
