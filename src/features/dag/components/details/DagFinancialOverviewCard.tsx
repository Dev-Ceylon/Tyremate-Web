import { formatCurrency } from "../../utils/dagDetails"
import type { DagTotals } from "../../utils/dagDetails"

type DagFinancialOverviewCardProps = {
  totals: DagTotals
}

export function DagFinancialOverviewCard({ totals }: DagFinancialOverviewCardProps) {
  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Financial Overview</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Total Cost</span>
          <span className="detail-card-val">${formatCurrency(totals.totalCost)}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Taken</span>
          <span className="detail-card-val">${formatCurrency(totals.takenAmount)}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Total Paid</span>
          <span className="detail-card-val">${formatCurrency(totals.paidAmount)}</span>
        </div>
        {totals.outstanding > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Amount Due</span>
            <span className="detail-card-val text-danger font-bold">
              ${formatCurrency(totals.outstanding)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}