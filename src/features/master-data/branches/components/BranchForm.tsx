import { useState, type FormEvent } from "react"
import type { BranchPayload, BranchContact, BranchAddress } from "../models/branch"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"
import { AddMobileDialog } from "./AddDataPopupModals/AddMobileDialog"
import { AddAddressDialog } from "./AddDataPopupModals/AddAddressDialog"
import { AddressSection } from "./AddressSection"

type BranchFormProps = {
  formData: BranchPayload
  onChange: <K extends keyof BranchPayload>(field: K, value: BranchPayload[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

type AddressDialogState = {
  addressType: string
  initialAddress: BranchAddress | null
} | null

export function BranchForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  fetchSuggestions,
}: BranchFormProps) {
  const [isAddMobileOpen, setIsAddMobileOpen] = useState(false)
  const [addressDialog, setAddressDialog] = useState<AddressDialogState>(null)

  const handleAddContacts = (contacts: BranchContact[]) => {
    let newList = [...(formData.Contacts || [])]

    if (contacts.some((c) => c.IsPrimary)) {
      newList = newList.map(c => ({ ...c, IsPrimary: 0 }))
    }

    newList = [...newList, ...contacts]
    onChange("Contacts", newList)
    setIsAddMobileOpen(false)
  }

  const handleSaveAddress = (address: BranchAddress) => {
    if (addressDialog?.addressType === "Delivery") {
      onChange("DeliveryAddress", address)
    } else {
      onChange("BillingAddress", address)
    }
    setAddressDialog(null)
  }

  return (
    <>
      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-label">
          Branch Code
          <input
            className="text-input"
            value={formData.BranchCode}
            onChange={(event) => onChange("BranchCode", event.target.value)}
            required
          />
        </label>

        <label className="field-label">
          Branch Name
          {fetchSuggestions ? (
            <SuggestionInput
              label="Branch Name"
              hideLabel
              required
              value={formData.BranchName}
              onChange={(v) => onChange("BranchName", v)}
              fetchSuggestions={(q) => fetchSuggestions("BranchName", q)}
            />
          ) : (
            <input className="text-input" value={formData.BranchName} onChange={(event) => onChange("BranchName", event.target.value)} required />
          )}
        </label>

        <div className="field-label contractor-tyre-field login-form-full-span">
          <div className="contractor-tyre-field-header">
            <span>Mobile Numbers</span>
            <button
              type="button"
              className="contractor-tyre-add-button"
              onClick={() => setIsAddMobileOpen(true)}
              aria-label="Add mobile numbers"
            >
              <span aria-hidden>+</span>
            </button>
          </div>
          <div className="pending-numbers-list">
            {(formData.Contacts || []).map((c, i) => (
              <div key={i} className="contractor-tyre-tag pending-number-tag">
                <span>{c.PhoneNumber}</span>
                {c.IsPrimary ? (
                  <span className="status-badge status-completed" style={{ fontSize: '10px', padding: '2px 4px', marginLeft: '4px' }}>P</span>
                ) : null}
                <button
                  type="button"
                  className="pending-number-remove-btn"
                  onClick={() => onChange("Contacts", formData.Contacts?.filter((_, idx) => idx !== i))}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <AddMobileDialog
          isOpen={isAddMobileOpen}
          onClose={() => setIsAddMobileOpen(false)}
          onAdd={handleAddContacts}
        />

        <AddressSection
          title="Billing Address"
          address={formData.BillingAddress}
          onEdit={() => setAddressDialog({ addressType: "Billing", initialAddress: formData.BillingAddress ?? null })}
          onRemove={() => onChange("BillingAddress", null)}
        />

        <AddressSection
          title="Delivery Address"
          address={formData.DeliveryAddress}
          onEdit={() => setAddressDialog({ addressType: "Delivery", initialAddress: formData.DeliveryAddress ?? null })}
          onRemove={() => onChange("DeliveryAddress", null)}
        />

        <AddAddressDialog
          isOpen={addressDialog !== null}
          addressType={addressDialog?.addressType ?? "Billing"}
          initialAddress={addressDialog?.initialAddress ?? null}
          onClose={() => setAddressDialog(null)}
          onSave={handleSaveAddress}
        />

        <div className="header-actions">
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Branch"}
          </button>
          {onCancel ? (
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </>
  )
}
