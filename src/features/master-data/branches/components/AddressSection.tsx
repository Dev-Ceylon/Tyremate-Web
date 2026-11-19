import type { BranchAddress } from "../models/branch"

type AddressSectionProps = {
  title: string
  address: BranchAddress | null | undefined
  onEdit: () => void
  onRemove: () => void
}

export function AddressSection({ title, address, onEdit, onRemove }: AddressSectionProps) {
  return (
    <div className="field-label contractor-tyre-field login-form-full-span">
      <div className="contractor-tyre-field-header">
        <span>{title}</span>
        <button
          type="button"
          className="contractor-tyre-add-button"
          onClick={onEdit}
          aria-label={`${address ? "Edit" : "Add"} ${title}`}
        >
          <span aria-hidden>+</span>
        </button>
      </div>
      <div className="pending-numbers-list">
        {address ? (
          <div className="contractor-tyre-tag pending-number-tag address-tag">
            <div className="address-tag-info">
              <div className="address-tag-header">
                <strong>{title}</strong>
              </div>
              <span className="address-tag-details">
                {address.AddressLine1}
                {address.AddressLine2 ? `, ${address.AddressLine2}` : ''}
                {address.City ? `, ${address.City}` : ''}
                {address.State ? `, ${address.State}` : ''}
                {address.PostalCode ? ` - ${address.PostalCode}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="pending-number-remove-btn self-center"
            >
              &times;
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
