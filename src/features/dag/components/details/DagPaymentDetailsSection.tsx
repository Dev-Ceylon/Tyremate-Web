import { useState } from "react"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import { PAYMENT_TYPE_CODES } from "../../../../shared/payment/constants/paymentTypeConstants"
import type { DagPaymentDetail } from "../../models/dag"
import { formatCurrency } from "../../utils/dagDetails"
import { PaymentSaleDetails } from "./PaymentSaleDetails"

type DagPaymentDetailsSectionProps = {
  payments: DagPaymentDetail[]
  isPaymentCompleted: number
  onViewReceipts?: (paymentId: number) => void
  onCompleteCheque?: (paymentId: number) => void
  completingChequeId?: number | null
}

const ordinal = (idx: number) => {
  if (idx === 0) return "1st Payment"
  if (idx === 1) return "2nd Payment"
  if (idx === 2) return "3rd Payment"
  return `${idx + 1}th Payment`
}

function hasReceipts(payment: DagPaymentDetail): boolean {
  // Check for single receipt (cash/bank transfer)
  const hasSingleReceipt = Boolean(
    payment.ReceiptPath &&
      payment.ReceiptEncIV &&
      payment.ReceiptEncAuthTag &&
      payment.ReceiptEncKey
  )
  // Check for multiple receipts (cheque)
  const hasMultipleReceipts = Array.isArray(payment.Receipts) && payment.Receipts.length > 0
  return hasSingleReceipt || hasMultipleReceipts
}

export function DagPaymentDetailsSection({
  payments,
  isPaymentCompleted,
  onViewReceipts,
  onCompleteCheque,
  completingChequeId,
}: DagPaymentDetailsSectionProps) {
  const [activePayment, setActivePayment] = useState<DagPaymentDetail | null>(null)

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <h2>Payment Details</h2>
        <div className="header-actions">
          <StatusBadge
            label={isPaymentCompleted === 1 ? "Completed" : "Pending"}
            tone={isPaymentCompleted === 1 ? "completed" : "pending"}
          />
        </div>
      </div>

      <div className="so-payment-grid">
        {payments.length === 0 ? (
          <div className="info-panel panel">
            <p className="section-label">No payments recorded</p>
            <div className="detail-card-grid">
              <div className="detail-card-row">
                <span className="detail-card-key">Status</span>
                <span className="detail-card-val">Awaiting first payment</span>
              </div>
            </div>
          </div>
        ) : (
          payments.map((payment, idx) => {
            const paymentId = payment.PaymentID
            const receiptsExist = hasReceipts(payment)
            const isCheque = payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE
            const shouldCompleteCheque = isCheque && payment.Collected !== 1
            const isCompleting = completingChequeId === paymentId
            return (
              <div key={paymentId ?? idx} className="info-panel panel">
                <p className="section-label">
                  {ordinal(idx)} · {payment.PaymentTypeName}
                </p>
                <div className="detail-card-grid">
                  <div className="detail-card-row">
                    <span className="detail-card-key">Method</span>
                    <span className="detail-card-val">{payment.PaymentTypeName}</span>
                  </div>
                  <div className="detail-card-row">
                    <span className="detail-card-key">Settled Amount</span>
                    <span className="detail-card-val font-bold">${formatCurrency(payment.Amount)}</span>
                  </div>
                  {payment.AmountReceived !== undefined && payment.AmountReceived !== null && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Received</span>
                      <span className="detail-card-val">${formatCurrency(payment.AmountReceived)}</span>
                    </div>
                  )}
                  {payment.BalanceToReturn !== undefined && payment.BalanceToReturn !== null && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Balance Return</span>
                      <span className="detail-card-val">${formatCurrency(payment.BalanceToReturn)}</span>
                    </div>
                  )}
                  {payment.ChequeNumber && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Cheque Number</span>
                      <span className="detail-card-val">{payment.ChequeNumber}</span>
                    </div>
                  )}
                  {payment.ChequeDate && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Cheque Date</span>
                      <span className="detail-card-val">{payment.ChequeDate}</span>
                    </div>
                  )}
                  {payment.BankName && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Bank Name</span>
                      <span className="detail-card-val">{payment.BankName}</span>
                    </div>
                  )}
                  {payment.Collected !== undefined && payment.Collected !== null && (
                    <div className="detail-card-row">
                      <span className="detail-card-key">Collected</span>
                      <span className="detail-card-val">{payment.Collected === 1 ? "Yes" : "No"}</span>
                    </div>
                  )}
                  <div className="detail-card-row">
                    <span className="detail-card-key">Tyres Taken</span>
                    <span className="detail-card-val">{payment.SaleLines?.length ?? 0}</span>
                  </div>
                </div>
                <div className="detail-card-actions">
                  {paymentId != null && shouldCompleteCheque && onCompleteCheque && (
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => onCompleteCheque(paymentId)}
                      disabled={isCompleting}
                    >
                      {isCompleting ? "Processing..." : "Complete the cheque payment"}
                    </button>
                  )}
                  {paymentId != null && onViewReceipts && (
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => onViewReceipts(paymentId)}
                    >
                      {receiptsExist ? "View Receipts" : "Upload Receipt"}
                    </button>
                  )}
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setActivePayment(payment)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {activePayment && (
        <PaymentSaleDetails
          payment={activePayment}
          title={`${ordinal(payments.indexOf(activePayment))} · ${activePayment.PaymentTypeName}`}
          onClose={() => setActivePayment(null)}
        />
      )}
    </section>
  )
}