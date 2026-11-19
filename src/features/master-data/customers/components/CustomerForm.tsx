import { useState, type FormEvent } from "react"
import type { CustomerAddress, CustomerContact, CustomerEmail, CustomerPayload } from "../models/customer"
import { AddMobileDialog } from "./AddDataPopupModals/AddMobileDialog"
import { AddEmailDialog } from "./AddDataPopupModals/AddEmailDialog"
import { AddAddressDialog } from "./AddDataPopupModals/AddAddressDialog"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type CustomerFormProps = {
  formData: CustomerPayload
  onChange: <K extends keyof CustomerPayload>(
    field: K,
    value: CustomerPayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  submittingLabel?: string
  isEdit?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function CustomerForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save Customer",
  submittingLabel = "Saving...",
  isEdit = false,
  fetchSuggestions,
}: CustomerFormProps) {
  const [isAddMobileOpen, setIsAddMobileOpen] = useState(false)
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false) // New state for address modal

  const handleAddContacts = (contacts: CustomerContact[]) => {
    let newList = [...(formData.Contacts || [])]

    // If any new contact is primary, unmark others to ensure single primary contact
    if (contacts.some((c) => c.IsPrimary)) {
      newList = newList.map(c => ({ ...c, IsPrimary: 0 }))
    }

    newList = [...newList, ...contacts]
    onChange("Contacts", newList)
    setIsAddMobileOpen(false)
  }

  const handleAddEmails = (emails: CustomerEmail[]) => {
    let newList = [...(formData.Emails || [])]

    if (emails.some((e) => e.IsPrimary)) {
      newList = newList.map(e => ({ ...e, IsPrimary: 0 }))
    }

    newList = [...newList, ...emails]
    onChange("Emails", newList)
    setIsAddEmailOpen(false)
  }

  // New handler for adding addresses
  const handleAddAddresses = (addresses: CustomerAddress[]) => {
    let newList = [...(formData.Addresses || [])]

    if (addresses.some((a) => a.IsPrimary)) {
      newList = newList.map(a => ({ ...a, IsPrimary: 0 }))
    }

    newList = [...newList, ...addresses]
    onChange("Addresses", newList)
    setIsAddAddressOpen(false)
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Customer Code
        <input
          className="text-input"
          value={isEdit ? formData.CustomerCode : "Auto-generated"}
          readOnly
          disabled
        />
      </label>

      <label className="field-label">
        Customer Name
        {fetchSuggestions ? (
          <SuggestionInput
            label="Customer Name"
            hideLabel
            required
            value={formData.Name}
            onChange={(v) => onChange("Name", v)}
            fetchSuggestions={(q) => fetchSuggestions("Name", q)}
          />
        ) : (
          <input className="text-input" value={formData.Name} onChange={(event) => onChange("Name", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        TIN No
        <input
          className="text-input"
          value={formData.TinNo ?? ""}
          onChange={(event) => onChange("TinNo", event.target.value)}
        />
      </label>

      <label className="field-label">
        VAT No
        <input
          className="text-input"
          value={formData.VatNo ?? ""}
          onChange={(event) => onChange("VatNo", event.target.value)}
        />
      </label>

      <label className="field-label">
        Birthday
        <input
          className="text-input"
          type="date"
          value={formData.Birthday ?? ""}
          onChange={(event) => onChange("Birthday", event.target.value)}
        />
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

      <div className="field-label contractor-tyre-field login-form-full-span">
        <div className="contractor-tyre-field-header">
          <span>Email Addresses</span>
          <button
            type="button"
            className="contractor-tyre-add-button"
            onClick={() => setIsAddEmailOpen(true)}
            aria-label="Add email addresses"
          >
            <span aria-hidden>+</span>
          </button>
        </div>
        <div className="pending-numbers-list">
          {(formData.Emails || []).map((e, i) => (
            <div key={i} className="contractor-tyre-tag pending-number-tag">
              <span>{e.EmailAddress}</span>
              {e.IsPrimary ? (
                <span className="status-badge status-completed" style={{ fontSize: '10px', padding: '2px 4px', marginLeft: '4px' }}>P</span>
              ) : null}
              <button
                type="button"
                className="pending-number-remove-btn"
                onClick={() => onChange("Emails", formData.Emails?.filter((_, idx) => idx !== i))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <AddEmailDialog
        isOpen={isAddEmailOpen}
        onClose={() => setIsAddEmailOpen(false)}
        onAdd={handleAddEmails}
      />

      <div className="field-label contractor-tyre-field login-form-full-span">
        <div className="contractor-tyre-field-header">
          <span>Addresses</span>
          <button
            type="button"
            className="contractor-tyre-add-button"
            onClick={() => setIsAddAddressOpen(true)} // Open the new address modal
            aria-label="Add addresses"
          >
            <span aria-hidden>+</span>
          </button>
        </div>
        <div className="pending-numbers-list"> {/* Use pending-numbers-list for consistent tag display */}
          {(formData.Addresses || []).map((a, i) => (
            <div key={i} className="contractor-tyre-tag pending-number-tag" style={{ height: 'auto', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{a.AddressType}</strong>
                  {a.IsPrimary ? (
                    <span className="status-badge status-completed" style={{ fontSize: '10px', padding: '2px 4px' }}>P</span>
                  ) : null}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {a.AddressLine1}
                  {a.AddressLine2 ? `, ${a.AddressLine2}` : ''}
                  {a.City ? `, ${a.City}` : ''}
                  {a.State ? `, ${a.State}` : ''}
                  {a.PostalCode ? ` - ${a.PostalCode}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="pending-number-remove-btn"
                style={{ alignSelf: 'center' }}
                onClick={() => onChange("Addresses", formData.Addresses?.filter((_, idx) => idx !== i))}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Render the new AddAddressDialog */}
      <AddAddressDialog
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
        onAdd={handleAddAddresses}
      />

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel ? (
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
