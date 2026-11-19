import { useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { CreditNotePayload } from "../models/invoice"

type CreditNoteDialogProps = {
  isOpen: boolean
  invoiceNumber: string
  submitting: boolean
  onClose: () => void
  onSubmit: (data: CreditNotePayload) => Promise<void>
}

export function CreditNoteDialog({
  isOpen,
  invoiceNumber,
  submitting,
  onClose,
  onSubmit,
}: CreditNoteDialogProps) {
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setNotes("")
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit({ Notes: notes.trim() || null })
      setNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create credit note")
    }
  }

  return (
    <AppModal isOpen={isOpen} title={`Credit Note for ${invoiceNumber}`} onClose={handleClose}>
      <p className="hero-text modal-hint-text">
        A credit note reverses this invoice. It is issued with its own CRN number and reduces the
        amount owed by the customer.
      </p>

      {error && <p className="hero-text error-text modal-hint-text">{error}</p>}

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-label">
          Reason / Notes
          <textarea
            className="text-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder="Reason for the credit note"
          />
        </label>

        <div className="header-actions">
          <button className="secondary-action" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Issuing..." : "Issue Credit Note"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}
