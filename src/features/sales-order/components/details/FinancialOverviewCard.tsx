import type { SoDetailedRecord } from "../../models/salesOrder"
import { PAYMENT_TYPE_CODES } from "../../../../shared/payment/constants/paymentTypeConstants"

type FinancialOverviewCardProps = {
  order: SoDetailedRecord
  netTotal: number
}

export function FinancialOverviewCard({ order, netTotal }: FinancialOverviewCardProps) {
  const advancePaid = (order.Payments ?? []).reduce((sum, p) => {
    const isCollectedCheque =
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE &&
      (p.Collected === 1 || p.Collected === true)
    const isLiquid =
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER
    const isSettled = isLiquid || isCollectedCheque
    return isSettled ? sum + (Number(p.Amount) || 0) : sum
  }, 0)

  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Financial Overview</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Subtotal</span>
          <span className="detail-card-val">${order.TotalSale?.toLocaleString()}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Total Discount</span>
          <span className="detail-card-val">-${order.TotalDiscount?.toLocaleString()}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Net Total</span>
          <span className="detail-card-val font-bold">${netTotal.toLocaleString()}</span>
        </div>
        {advancePaid > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Advance Paid</span>
            <span className="detail-card-val text-success font-bold">${advancePaid.toLocaleString()}</span>
          </div>
        )}
        {(order.RemainingAmount ?? 0) > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Amount Due</span>
            <span className="detail-card-val text-danger font-bold">${order.RemainingAmount?.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
