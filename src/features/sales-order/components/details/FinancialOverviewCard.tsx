import type { SoDetailedRecord } from "../../models/salesOrder"
import { PAYMENT_TYPE_CODES } from "../../../../shared/payment/constants/paymentTypeConstants"

type FinancialOverviewCardProps = {
  order: SoDetailedRecord
  netTotal: number
}

export function FinancialOverviewCard({ order, netTotal }: FinancialOverviewCardProps) {
  const settledPayments = (order.Payments ?? []).filter((p) => {
    const isCollectedCheque =
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE &&
      (p.Collected === 1 || p.Collected === true)
    const isLiquid =
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      p.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER
    return isLiquid || isCollectedCheque
  })

  const totalPaid = settledPayments.reduce((sum, p) => sum + (Number(p.Amount) || 0), 0)
  const advancePaid = settledPayments
    .filter((p) => p.IsAdvance)
    .reduce((sum, p) => sum + (Number(p.Amount) || 0), 0)
  const regularPaid = totalPaid - advancePaid

  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Financial Overview</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Subtotal</span>
          <span className="detail-card-val">Rs {order.TotalSale?.toLocaleString()}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Total Discount</span>
          <span className="detail-card-val">-Rs {order.TotalDiscount?.toLocaleString()}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Net Total</span>
          <span className="detail-card-val font-bold">Rs {netTotal.toLocaleString()}</span>
        </div>
        {advancePaid > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Advance Paid</span>
            <span className="detail-card-val text-success font-bold">Rs {advancePaid.toLocaleString()}</span>
          </div>
        )}
        {regularPaid > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">{advancePaid > 0 ? "Additional Paid" : "Amount Paid"}</span>
            <span className="detail-card-val text-success font-bold">Rs {regularPaid.toLocaleString()}</span>
          </div>
        )}
        {(order.RemainingAmount ?? 0) > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Amount Due</span>
            <span className="detail-card-val text-danger font-bold">Rs {order.RemainingAmount?.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
