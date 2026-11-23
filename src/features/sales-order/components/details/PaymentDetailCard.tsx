import { useMemo } from "react"
import { Link } from "@/lib/router"
import { PAYMENT_TYPE_CODES } from "../../../../shared/payment/constants/paymentTypeConstants"
import { receiptItemsFromPayment } from "../../../../shared/payment/utils/receiptPreviewHelpers"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type { SoPaymentRecord } from "../../models/salesOrder"

type PaymentDetailCardProps = {
  payment: SoPaymentRecord
  disabled?: boolean
  onViewReceipts: (paymentId: number) => void
  onCompleteCheque: (paymentId?: number) => void
  onPrintCustomerReceipt: (payment: SoPaymentRecord) => void
  onDownloadCustomerReceipt: (payment: SoPaymentRecord) => void
  printingReceipt: boolean
  downloadingReceipt: boolean
}

export function PaymentDetailCard({
  payment,
  disabled = false,
  onViewReceipts,
  onCompleteCheque,
  onPrintCustomerReceipt,
  onDownloadCustomerReceipt,
  printingReceipt,
  downloadingReceipt,
}: PaymentDetailCardProps) {
  const receiptItems = useMemo(() => receiptItemsFromPayment(payment), [payment])
  const paymentId = payment.PaymentID ?? null
  const invoices = payment.Invoices ?? []
  const isAdvance = Boolean(payment.IsAdvance)
  const shouldCompleteCheque =
    payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && !payment.Collected

  return (
    <div className="info-panel panel">
      <div className="table-panel-header">
        <p className="section-label">{payment.PaymentTypeName}</p>
        <StatusBadge
          label={
            isAdvance
              ? invoices.length > 0
                ? "Advance Applied"
                : "Advance Deposit"
              : invoices.length > 0
                ? "Invoice Payment"
                : "Direct Payment"
          }
          tone="approved"
        />
      </div>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Payment Role</span>
          <span className="detail-card-val font-bold">
            {isAdvance
              ? invoices.length > 0
                ? "Customer Advance (Applied to Invoice)"
                : "Customer Advance Payment"
              : invoices.length > 0
                ? "Invoice Settlement Payment"
                : "Direct Order Payment"}
          </span>
        </div>
        {invoices.length > 0 ? (
          <div className="detail-card-row">
            <span className="detail-card-key">Invoice{invoices.length > 1 ? "s" : ""}</span>
            <span className="detail-card-val">
              {invoices.map((invoice, index) => (
                <span key={invoice.InvoiceID}>
                  {index > 0 ? ", " : ""}
                  <Link className="text-link" to={`/invoices/${invoice.InvoiceID}`}>
                    {invoice.InvoiceNumber || `#${invoice.InvoiceID}`}
                  </Link>
                </span>
              ))}
            </span>
          </div>
        ) : (
          <div className="detail-card-row">
            <span className="detail-card-key">Invoiced Status</span>
            <span className="detail-card-val secondary-text">
              {isAdvance ? "Advance Deposit (Unbilled)" : "Direct Payment (Unbilled)"}
            </span>
          </div>
        )}
        <div className="detail-card-row">
          <span className="detail-card-key">Settled Amount</span>
          <span className="detail-card-val font-bold">${payment.Amount.toLocaleString()}</span>
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
            <span className="detail-card-val">${payment.PaidAmount.toLocaleString()}</span>
          </div>
        )}
        {payment.BalanceAmount !== undefined && (
          <div className="detail-card-row">
            <span className="detail-card-key">Balance Return</span>
            <span className="detail-card-val">${payment.BalanceAmount.toLocaleString()}</span>
          </div>
        )}
      </div>
      {(receiptItems.length > 0 || paymentId != null || shouldCompleteCheque) && (
        <div className="payment-card-action">
          {paymentId != null && (
            <button className="secondary-action" onClick={() => onViewReceipts(paymentId)}>
              {receiptItems.length > 0
                ? `View Receipt${receiptItems.length > 1 ? "s" : ""}`
                : "Upload Receipt"}
            </button>
          )}
          {shouldCompleteCheque && (
            <button
              className="primary-action"
              onClick={() => onCompleteCheque(payment.PaymentID)}
              disabled={disabled}
            >
              {disabled ? "Processing..." : "Complete the cheque payment"}
            </button>
          )}
          {paymentId != null && (
            <>
              <button
                className="secondary-action"
                onClick={() => onPrintCustomerReceipt(payment)}
                disabled={disabled || printingReceipt || downloadingReceipt}
              >
                {printingReceipt ? "Printing receipt..." : "Print payment receipt"}
              </button>
              <button
                className="secondary-action"
                onClick={() => onDownloadCustomerReceipt(payment)}
                disabled={disabled || printingReceipt || downloadingReceipt}
              >
                {downloadingReceipt ? "Preparing PDF..." : "Download payment receipt"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
