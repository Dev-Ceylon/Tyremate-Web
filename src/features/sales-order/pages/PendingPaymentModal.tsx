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
            <span className="table-count">Total Order: ${totalAmount.toFixed(2)}</span>
          </div>

          <div className="login-form">
            <div className="details-summary" style={{ gridColumn: "1 / -1", marginBottom: "1rem" }}>
              <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="label">Already Paid</span>
                <span className="value">${paidAmount.toFixed(2)}</span>
              </div>
              <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '8px' }}>
                <span className="label">Remaining Pending</span>
                <span className="value font-bold" style={{ color: 'var(--action-primary-strong)' }}>
                  ${pendingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Content area for additional pending-payment fields */}
            <div className="login-form-full-span">
              <p className="secondary-text" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Configure additional settlement details or notes for this pending balance below.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
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