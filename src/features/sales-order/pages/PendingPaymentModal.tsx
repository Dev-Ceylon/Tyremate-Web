import { AppModal } from "../../../shared/ui/modal/AppModal"

interface PendingPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  submitting?: boolean
  totalAmount: number
  paidAmount?: number
  pendingAmount?: number
}

/**
 * PendingPaymentModal
 * A reusable modal component for handling pending payment workflows in Sales Orders.
 * Designed to visually match the existing PaymentTypeModal.
 */
export function PendingPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  totalAmount,
  paidAmount = 0,
  pendingAmount = 0,
}: PendingPaymentModalProps) {
  return (
    <AppModal isOpen={isOpen} title="Pending Payment" onClose={onClose}>
      <div className="quick-order-modal-content">
        {/* Summary Section using existing payment form styling */}
        <div className="cash-payment-form">
          <div className="cash-payment-form-header">
            <p className="section-label">Payment Settlement Summary</p>
            <span className="table-count">Total Order: Rs {totalAmount.toFixed(2)}</span>
          </div>

          <div className="login-form">
            <div className="details-summary details-summary-full">
              <div className="summary-item summary-item-row">
                <span className="label">Already Paid</span>
                <span className="value">Rs {paidAmount.toFixed(2)}</span>
              </div>
              <div className="summary-item summary-item-row-total">
                <span className="label">Remaining Pending</span>
                <span className="value font-bold summary-item-value-highlight">
                  Rs {pendingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Content area for additional pending-payment fields */}
            <div className="login-form-full-span">
              <p className="secondary-text secondary-text-sm">
                Configure additional settlement details or notes for this pending balance below.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions modal-actions-mt">
          <button
            type="button"
            className="primary-action"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Confirming..." : "Confirm Settlement"}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </AppModal>
  )
}