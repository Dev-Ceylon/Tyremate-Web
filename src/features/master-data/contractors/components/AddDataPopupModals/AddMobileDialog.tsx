import { AppModal } from "../../../../../shared/ui/modal/AppModal"
import type { ContractorContact } from "../../models/contractor"
import { useAddMobileDialog } from "../../hooks/useAddMobileDialog"

type AddMobileDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (contacts: ContractorContact[]) => void
}

export function AddMobileDialog({ isOpen, onClose, onAdd }: AddMobileDialogProps) {
  const {
    currentPhoneNumber,
    setCurrentPhoneNumber,
    pendingMobileNumbers,
    validationError,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddNumbers,
    handleCloseAndReset,
  } = useAddMobileDialog({ onAdd, onClose })

  return (
    <AppModal isOpen={isOpen} title="Add Mobile Number" onClose={handleCloseAndReset}>
      <div className="modal-body-content">
        <div className="modal-input-with-button">
          <label className="field-label">
            Phone Number
            <input
              className="text-input"
              value={currentPhoneNumber}
              onChange={(e) => setCurrentPhoneNumber(e.target.value)}
              placeholder="e.g. 0771234567"
              inputMode="numeric"
              maxLength={10}
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
            disabled={!currentPhoneNumber.trim() || Boolean(validationError)}
          >
            Add to list
          </button>
        </div>

        {validationError ? <p className="hero-text">{validationError}</p> : null}

        {pendingMobileNumbers.length > 0 && (
          <div className="pending-numbers-list-container">
            <p className="field-label">Numbers to add:</p>
            <div className="pending-numbers-list">
              {pendingMobileNumbers.map((number) => (
                <div key={number} className="contractor-tyre-tag pending-number-tag">
                  {number}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromPendingList(number)}
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
            onClick={handleAddNumbers}
            disabled={(pendingMobileNumbers.length === 0 && !currentPhoneNumber.trim()) || Boolean(validationError)}
          >
            Add Number(s)
          </button>
        </div>
      </div>
    </AppModal>
  )
}
