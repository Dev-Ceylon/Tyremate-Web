import { AppModal } from "../../../../../shared/ui/modal/AppModal"
import type { BranchAddress } from "../../models/branch"
import { useAddAddressDialog } from "../../hooks/useAddAddressDialog"

type AddAddressDialogProps = {
  isOpen: boolean
  addressType: string
  initialAddress?: BranchAddress | null
  onClose: () => void
  onSave: (address: BranchAddress) => void
}

export function AddAddressDialog({
  isOpen,
  addressType,
  initialAddress,
  onClose,
  onSave,
}: AddAddressDialogProps) {
  const {
    currentAddressInput,
    updateCurrentAddressField,
    isAddressValid,
    handleSave,
    handleCloseAndReset,
  } = useAddAddressDialog({ initialAddress, onSave, onClose })

  return (
    <AppModal
      isOpen={isOpen}
      title={`${addressType} Address`}
      onClose={handleCloseAndReset}
    >
      <div className="modal-body-content">
        <label className="field-label">
          Address Line 1
          <input
            className="text-input"
            value={currentAddressInput.AddressLine1 || ""}
            onChange={(e) => updateCurrentAddressField("AddressLine1", e.target.value)}
            placeholder="Building No / Street"
            autoFocus
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
              if (e.key === "Enter" && isAddressValid) {
                handleSave()
              }
            }}
          />
        </label>

        <div className="header-actions contractor-tyre-modal-actions modal-actions-top-margin">
          <button type="button" className="secondary-action" onClick={handleCloseAndReset}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={handleSave}
            disabled={!isAddressValid}
          >
            Save Address
          </button>
        </div>
      </div>
    </AppModal>
  )
}
