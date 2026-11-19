import { AppModal } from "../../../shared/ui/modal/AppModal"

interface NewerStockWarningModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function NewerStockWarningModal({
  isOpen,
  onCancel,
  onConfirm,
}: NewerStockWarningModalProps) {
  return (
    <AppModal isOpen={isOpen} title="FIFO order warning" onClose={onCancel}>
      <div className="warning-modal">
        <div className="warning-modal-icon" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div className="warning-modal-content">
          <p className="warning-modal-message">
            An <strong>older stock lot</strong> still has available quantity, but your
            allocation uses a <strong>newer lot</strong> first.
          </p>
          <p className="warning-modal-hint">
            This skips the FIFO (first-in, first-out) order. Do you want to continue with the
            newer stock anyway?
          </p>
        </div>

        <div className="modal-actions warning-modal-actions">
          <button type="button" className="secondary-action" onClick={onCancel}>
            Go Back
          </button>
          <button type="button" className="primary-action" onClick={onConfirm}>
            Continue Anyway
          </button>
        </div>
      </div>
    </AppModal>
  )
}