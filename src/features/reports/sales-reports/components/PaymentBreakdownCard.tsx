import React from "react"
import { CheckCircle2, Clock, Landmark, Banknote } from "lucide-react"
import type { PaymentMethodBreakdown } from "../models/salesReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface PaymentBreakdownCardProps {
  payments: PaymentMethodBreakdown
}

export const PaymentBreakdownCard: React.FC<PaymentBreakdownCardProps> = ({ payments }) => {
  const { cash, cheque, bankTransfer, totalSettled, totalPending } = payments

  return (
    <article className="panel panel-strong report-breakdown-card">
      <div className="card-header-clean">
        <div>
          <span className="eyebrow">Settlements &amp; Liquidity</span>
          <h3>Payment Tender Methods</h3>
        </div>
        <span className="badge-count">{cash.count + cheque.totalCount + bankTransfer.count} Receipts</span>
      </div>

      {/* Progress ratio */}
      <div className="report-settlement-summary">
        <div className="settlement-stat">
          <span className="metric-label">Settled / Cleared</span>
          <strong className="text-success">{formatLKR(totalSettled)}</strong>
        </div>
        {totalPending > 0 && (
          <div className="settlement-stat">
            <span className="metric-label">Pending Cheques</span>
            <strong className="text-warning">{formatLKR(totalPending)}</strong>
          </div>
        )}
      </div>

      <div className="report-channel-grid">
        {/* Cash */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <Banknote size={18} className="text-success" />
            <div>
              <strong>Cash Payments</strong>
              <small>{cash.count} transaction{cash.count === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(cash.amount)}</strong>
            <small className="status-badge-inline status-approved">Immediate</small>
          </div>
        </div>

        {/* Cheques Collected */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <CheckCircle2 size={18} className="text-primary" />
            <div>
              <strong>Cheques (Cleared)</strong>
              <small>{cheque.collectedCount} cheque{cheque.collectedCount === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(cheque.collectedAmount)}</strong>
            <small className="status-badge-inline status-completed">Collected</small>
          </div>
        </div>

        {/* Cheques Pending */}
        {cheque.pendingAmount > 0 && (
          <div className="report-channel-box">
            <div className="channel-indicator">
              <Clock size={18} className="text-warning" />
              <div>
                <strong>Cheques (Pending)</strong>
                <small>{cheque.pendingCount} awaiting clearance</small>
              </div>
            </div>
            <div className="channel-financials">
              <strong className="text-warning">{formatLKR(cheque.pendingAmount)}</strong>
              <small className="status-badge-inline status-pending">In Clearance</small>
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <Landmark size={18} className="text-accent" />
            <div>
              <strong>Bank Transfer</strong>
              <small>{bankTransfer.count} transfer{bankTransfer.count === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(bankTransfer.amount)}</strong>
            <small className="status-badge-inline status-completed">Direct</small>
          </div>
        </div>
      </div>
    </article>
  )
}
