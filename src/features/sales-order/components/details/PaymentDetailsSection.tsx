import type { SoDetailedRecord, SoPaymentRecord } from "../../models/salesOrder"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import { PaymentDetailCard } from "./PaymentDetailCard"
import { useReceiptViewer } from "../../hooks/useReceiptViewer"
import { ReceiptPreviewModal } from "../../../../shared/payment/ui/ReceiptPreviewModal"

type PaymentDetailsSectionProps = {
  order: SoDetailedRecord
  showMakePayment: boolean
  onMakePayment: () => void
  onCompleteCheque: (paymentId?: number) => void
  disabled?: boolean
  /** Called after a stored receipt is uploaded/replaced/removed so the parent can refetch. */
  onReceiptsChanged?: () => void | Promise<void>
  onPrintCustomerReceipt: (payment: SoPaymentRecord) => void
  onDownloadCustomerReceipt: (payment: SoPaymentRecord) => void
  printingReceiptPaymentId: number | null
  downloadingReceiptPaymentId: number | null
  onPrintSummaryReceipt: () => void
  onDownloadSummaryReceipt: () => void
  isPrintingSummaryReceipt: boolean
  isDownloadingSummaryReceipt: boolean
}

export function PaymentDetailsSection({
  order,
  showMakePayment,
  onMakePayment,
  onCompleteCheque,
  disabled = false,
  onReceiptsChanged,
  onPrintCustomerReceipt,
  onDownloadCustomerReceipt,
  printingReceiptPaymentId,
  downloadingReceiptPaymentId,
  onPrintSummaryReceipt,
  onDownloadSummaryReceipt,
  isPrintingSummaryReceipt,
  isDownloadingSummaryReceipt,
}: PaymentDetailsSectionProps) {
  const payments = order.Payments ?? []
  const hasAdvance = payments.some((p) => p.IsAdvance)
  const hasNonAdvance = payments.some((p) => !p.IsAdvance)
  const paymentStatus = order.IsPaymentCompleted !== undefined && order.IsPaymentCompleted !== null

  const {
    isOpen: isReceiptModalOpen,
    openReceipt,
    closeReceipt,
    previewReceipts,
    previewTitle,
    manage,
  } = useReceiptViewer({ payments, onReceiptsChanged })

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <div>
          <h2>Payment Details</h2>
          {payments.length > 0 && (
            <p className="secondary-text">
              {hasAdvance && !hasNonAdvance
                ? "Customer advance payment records for this sales order."
                : hasAdvance && hasNonAdvance
                  ? "Payment and advance deposit records for this sales order."
                  : "Payment records for this sales order."}
            </p>
          )}
        </div>
        <div className="header-actions">
          {paymentStatus ? (
            <StatusBadge
              label={order.IsPaymentCompleted === 1 ? "Completed" : "Pending"}
              tone={order.IsPaymentCompleted === 1 ? "completed" : "pending"}
            />
          ) : (
            <span className="status-badge">N/A</span>
          )}
          {showMakePayment && (
            <button className="primary-action" onClick={onMakePayment}>
              Make payment
            </button>
          )}
          {payments.length > 0 && (
            <>
              <button
                className="secondary-action"
                onClick={onPrintSummaryReceipt}
                disabled={disabled || isPrintingSummaryReceipt || isDownloadingSummaryReceipt}
              >
                {isPrintingSummaryReceipt ? "Printing summary..." : "Print all payments"}
              </button>
              <button
                className="secondary-action"
                onClick={onDownloadSummaryReceipt}
                disabled={disabled || isPrintingSummaryReceipt || isDownloadingSummaryReceipt}
              >
                {isDownloadingSummaryReceipt ? "Preparing PDF..." : "Download payment summary"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="so-payment-grid">
        {payments.map((payment, idx) => (
          <PaymentDetailCard
            key={payment.PaymentID ?? idx}
            payment={payment}
            disabled={disabled}
            onViewReceipts={openReceipt}
            onCompleteCheque={onCompleteCheque}
            onPrintCustomerReceipt={onPrintCustomerReceipt}
            onDownloadCustomerReceipt={onDownloadCustomerReceipt}
            printingReceipt={printingReceiptPaymentId === payment.PaymentID}
            downloadingReceipt={downloadingReceiptPaymentId === payment.PaymentID}
          />
        ))}
      </div>

      <ReceiptPreviewModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceipt}
        receipts={previewReceipts}
        title={previewTitle}
        manage={manage}
      />
    </section>
  )
}
