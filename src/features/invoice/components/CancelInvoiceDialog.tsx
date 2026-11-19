import { useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { CancelInvoicePayload } from "../models/invoice"

type CancelInvoiceDialogProps = {
  isOpen: boolean
  invoiceNumber: string
  submitting: boolean
  onClose: () => void
  onSubmit: (data: CancelInvoicePayload) => Promise<void>
}

export function CancelInvoiceDialog({
  isOpen,
  invoiceNumber,
  submitting,
  onClose,
  onSubmit,
}: CancelInvoiceDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setReason("")
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit({ Reason: reason.trim() || null })
      setReason("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invoice")
    }
  }

  return (
    <AppModal isOpen={isOpen} title={`Cancel ${invoiceNumber}`} onClose={handleClose}>
      <p className="hero-text modal-hint-text">
        Cancelling an invoice voids it. This cannot be undone.
      </p>

      {error && <p className="hero-text error-text modal-hint-text">{error}</p>}

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-label">
          Reason
          <textarea
            className="text-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="Reason for cancelling"
          />
        </label>

        <div className="header-actions">
          <button className="secondary-action" type="button" onClick={handleClose} disabled={submitting}>
            Keep Invoice
          </button>
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Cancelling..." : "Cancel Invoice"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
