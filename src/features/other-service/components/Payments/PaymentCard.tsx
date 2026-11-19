import { PAYMENT_TYPE_CODES } from "../../../../shared/payment/constants/paymentTypeConstants"
import type { OtherServicePaymentDetail } from "../../models/otherService"

type PaymentCardProps = {
  payment: OtherServicePaymentDetail
  onCompleteCheque: (paymentId: number) => void
  submitting: boolean
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

export function PaymentCard({ payment, onCompleteCheque, submitting }: PaymentCardProps) {
  return (
    <div className="info-panel panel">
      <p className="section-label">{payment.PaymentTypeName}</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Settled Amount</span>
          <span className="detail-card-val">${fmt(payment.Amount)}</span>
        </div>
        {payment.ReferenceNumber && (
          <div className="detail-card-row">
            <span className="detail-card-key">Ref/Cheque #</span>
            <span className="detail-card-val">{payment.ReferenceNumber}</span>
          </div>
        )}
        {payment.PaymentDate && (
          <div className="detail-card-row">
            <span className="detail-card-key">Payment Date</span>
            <span className="detail-card-val">{payment.PaymentDate}</span>
          </div>
        )}
        {payment.BankName && (
          <div className="detail-card-row">
            <span className="detail-card-key">Bank Name</span>
            <span className="detail-card-val">{payment.BankName}</span>
          </div>
        )}
        {payment.PaidAmount !== undefined && (
          <div className="detail-card-row">
            <span className="detail-card-key">Received</span>
            <span className="detail-card-val">${fmt(payment.PaidAmount)}</span>
          </div>
        )}
        {payment.BalanceAmount !== undefined && (
          <div className="detail-card-row">
            <span className="detail-card-key">Balance Return</span>
            <span className="detail-card-val">${fmt(payment.BalanceAmount)}</span>
          </div>
        )}
      </div>
      {payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && !payment.Collected && (
        <div style={{ marginTop: "1rem" }}>
          <button
            className="primary-action"
            style={{ width: "100%" }}
            onClick={() => onCompleteCheque(payment.PaymentID)}
            disabled={submitting}
          >
            {submitting ? "Processing..." : "Complete the cheque payment"}
          </button>
        </div>
      )}
    </div>
  )
}