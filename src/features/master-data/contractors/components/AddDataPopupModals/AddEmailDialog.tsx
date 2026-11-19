import { AppModal } from "../../../../../shared/ui/modal/AppModal"
import type { ContractorEmail } from "../../models/contractor"
import { useAddEmailDialog } from "../../hooks/useAddEmailDialog"

type AddEmailDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (emails: ContractorEmail[]) => void
}

export function AddEmailDialog({ isOpen, onClose, onAdd }: AddEmailDialogProps) {
  const {
    currentEmail,
    setCurrentEmail,
    pendingEmails,
    validationError,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddEmails,
    handleCloseAndReset,
  } = useAddEmailDialog({ onAdd, onClose })

  return (
    <AppModal isOpen={isOpen} title="Add Email Addresses" onClose={handleCloseAndReset}>
      <div className="modal-body-content">
        <div className="modal-input-with-button">
          <label className="field-label">
            Email Address
            <input
              className="text-input"
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              maxLength={254}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddToPendingList()
                }
              }}
              autoFocus
            />
          </label>
          <button
            type="button"
            className="secondary-action"
            onClick={handleAddToPendingList}
            disabled={!currentEmail.trim() || Boolean(validationError)}
          >
            Add to list
          </button>
        </div>

        {validationError ? <p className="hero-text">{validationError}</p> : null}

        {pendingEmails.length > 0 && (
          <div className="pending-numbers-list-container">
            <p className="field-label">Emails to add:</p>
            <div className="pending-numbers-list">
              {pendingEmails.map((email) => (
                <div key={email} className="contractor-tyre-tag pending-number-tag">
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromPendingList(email)}
                    className="pending-number-remove-btn"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="header-actions contractor-tyre-modal-actions modal-actions-top-margin">
          <button type="button" className="secondary-action" onClick={handleCloseAndReset}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={handleAddEmails}
            disabled={(pendingEmails.length === 0 && !currentEmail.trim()) || Boolean(validationError)}
          >
            Add Email(s)
          </button>
        </div>
      </div>
    </AppModal>
  )
}
