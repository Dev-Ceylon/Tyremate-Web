import { AppModal } from "../../../../../shared/ui/modal/AppModal"
import type { SupplierAddress } from "../../models/supplier"
import { useAddAddressDialog } from "../../hooks/useAddAddressDialog"

type AddAddressDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (addresses: SupplierAddress[]) => void
}

export function AddAddressDialog({ isOpen, onClose, onAdd }: AddAddressDialogProps) {
  const {
    currentAddressInput,
    updateCurrentAddressField,
    pendingAddresses,
    handleAddToPendingList,
    handleRemoveFromPendingList,
    handleAddAddresses,
    handleCloseAndReset,
  } = useAddAddressDialog({ onAdd, onClose })

  const isCurrentAddressValid = currentAddressInput.AddressLine1?.trim() && currentAddressInput.City?.trim()

  return (
    <AppModal isOpen={isOpen} title="Add Addresses" onClose={handleCloseAndReset}>
      <div className="modal-body-content">
        <label className="field-label">
          Address Type
          <input
            className="text-input"
            value={currentAddressInput.AddressType || ""}
            onChange={(e) => updateCurrentAddressField("AddressType", e.target.value)}
            placeholder="e.g. Billing, Home, Office"
            autoFocus
          />
        </label>
        <label className="field-label">
          Address Line 1
          <input
            className="text-input"
            value={currentAddressInput.AddressLine1 || ""}
            onChange={(e) => updateCurrentAddressField("AddressLine1", e.target.value)}
            placeholder="Building No / Street"
          />
        </label>
        <label className="field-label">
          Address Line 2
          <input
            className="text-input"
            value={currentAddressInput.AddressLine2 || ""}
            onChange={(e) => updateCurrentAddressField("AddressLine2", e.target.value)}
            placeholder="Locality / Area"
          />
        </label>
        <div className="grid-2">
          <label className="field-label">
            City
            <input
              className="text-input"
              value={currentAddressInput.City || ""}
              onChange={(e) => updateCurrentAddressField("City", e.target.value)}
              placeholder="City"
            />
          </label>
          <label className="field-label">
            State
            <input
              className="text-input"
              value={currentAddressInput.State || ""}
              onChange={(e) => updateCurrentAddressField("State", e.target.value)}
              placeholder="State"
            />
          </label>
        </div>
        <label className="field-label">
          Postal Code
          <input
            className="text-input"
            value={currentAddressInput.PostalCode || ""}
            onChange={(e) => updateCurrentAddressField("PostalCode", e.target.value)}
            placeholder="Postal Code"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isCurrentAddressValid) {
                handleAddToPendingList()
              }
            }}
          />
        </label>
        <div className="modal-section-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={handleAddToPendingList}
            disabled={!isCurrentAddressValid}
          >
            Add to list
          </button>
        </div>

        {pendingAddresses.length > 0 && (
          <div className="pending-numbers-list-container">
            <p className="field-label">Addresses to add:</p>
            <div className="pending-numbers-list">
              {pendingAddresses.map((address, index) => (
                <div key={index} className="contractor-tyre-tag pending-number-tag address-tag">
                  <div className="address-tag-info">
                    <div className="address-tag-header">
                      <strong>{address.AddressType}</strong>
                      {address.IsPrimary ? (
                        <span className="status-badge status-completed status-badge-xs">P</span>
                      ) : null}
                    </div>
                    <span className="address-tag-details">
                      {address.AddressLine1}{address.AddressLine2 ? `, ${address.AddressLine2}` : ''}{address.City ? `, ${address.City}` : ''}{address.State ? `, ${address.State}` : ''}{address.PostalCode ? ` - ${address.PostalCode}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromPendingList(address)}
                    className="pending-number-remove-btn self-center"
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
            onClick={handleAddAddresses}
            disabled={pendingAddresses.length === 0 && !isCurrentAddressValid}
          >
            Add Address(es)
          </button>
        </div>
      </div>
    </AppModal>
  )
}
