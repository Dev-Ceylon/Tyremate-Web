import { memo } from "react"

type PaymentSettlementSummaryProps = {
  needToPay: number
  enteredTotal: number
  remainingDue: number
  overPaid: number
}

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const PaymentSettlementSummary = memo(function PaymentSettlementSummary({
  needToPay,
  enteredTotal,
  remainingDue,
  overPaid,
}: PaymentSettlementSummaryProps) {
  return (
    <>
      <div className="payment-summary">
        <div className="payment-summary-item">
          <span className="payment-summary-label">Amount Due</span>
          <strong className="payment-summary-value">${formatMoney(needToPay)}</strong>
        </div>
        <div className="payment-summary-item">
          <span className="payment-summary-label">Entered</span>
          <strong className="payment-summary-value">${formatMoney(enteredTotal)}</strong>
        </div>
        <div className="payment-summary-item">
          <span className="payment-summary-label">Remaining to Pay</span>
          <strong
            className={`payment-summary-value ${overPaid > 0 ? "payment-summary-overpaid" : ""}`}
          >
            ${formatMoney(overPaid > 0 ? 0 : remainingDue)}
          </strong>
        </div>
      </div>
      {overPaid > 0 && (
        <p className="payment-summary-note">
          Over-payment of ${formatMoney(overPaid)} — excess will be returned. Other payment types
          are locked until you reduce the entered amount.
        </p>
      )}
    </>
  )
})
