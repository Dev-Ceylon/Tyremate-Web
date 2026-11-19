import { useMemo, useState, type FormEvent } from "react"
import type { TyreRecord } from "../../tyres/models/tyre"
import type { ContractorPayload, ContractorContact, ContractorEmail, ContractorAddress } from "../models/contractor"
import { TyrePickerModal } from "./TyrePickerModal"
import { AddMobileDialog } from "./AddDataPopupModals/AddMobileDialog"
import { AddEmailDialog } from "./AddDataPopupModals/AddEmailDialog"
import { AddAddressDialog } from "./AddDataPopupModals/AddAddressDialog"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type ContractorFormProps = {
  formData: ContractorPayload
  availableTyres: TyreRecord[]
  tyresLoading?: boolean
  tyresError?: string | null
  onOpenTyrePicker?: () => Promise<void> | void
  onTyreCreated?: (tyre: TyreRecord) => void
  onChange: <K extends keyof ContractorPayload>(
    field: K,
    value: ContractorPayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function ContractorForm({
  formData,
  availableTyres,
  tyresLoading = false,
  tyresError = null,
  onOpenTyrePicker,
  onTyreCreated,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  fetchSuggestions,
}: ContractorFormProps) {
  const [isTyrePickerOpen, setTyrePickerOpen] = useState(false)
  const [isAddMobileOpen, setIsAddMobileOpen] = useState(false)
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const selectedTyreIds = useMemo(
    () => formData.TyreIDs ?? [],
    [formData.TyreIDs],
  )
  const tyreLabelMap = useMemo(
    () =>
      new Map(
        availableTyres.map((tyre) => [tyre.Id, formatTyreLabel(tyre)]),
      ),
    [availableTyres],
  )

  const selectedTyreSummary = useMemo(() => {
    if (selectedTyreIds.length === 0) {
      return "No tyres selected"
    }

    return `${selectedTyreIds.length} tyre${selectedTyreIds.length === 1 ? "" : "s"} selected`
  }, [selectedTyreIds])

  const selectedTyreTags = useMemo(
    () => selectedTyreIds.slice(0, 6),
    [selectedTyreIds],
  )

  const handleOpenTyrePicker = () => {
    setTyrePickerOpen(true)
    void onOpenTyrePicker?.()
  }

  const handleAddContacts = (contacts: ContractorContact[]) => {
    let newList = [...(formData.Contacts || [])]

    if (contacts.some((c) => c.IsPrimary)) {
      newList = newList.map(c => ({ ...c, IsPrimary: 0 }))
    }

    newList = [...newList, ...contacts]
    onChange("Contacts", newList)
    setIsAddMobileOpen(false)
  }

  const handleAddEmails = (emails: ContractorEmail[]) => {
    let newList = [...(formData.Emails || [])]

    if (emails.some((e) => e.IsPrimary)) {
      newList = newList.map(e => ({ ...e, IsPrimary: 0 }))
    }

    newList = [...newList, ...emails]
    onChange("Emails", newList)
    setIsAddEmailOpen(false)
  }

  const handleAddAddresses = (addresses: ContractorAddress[]) => {
    let newList = [...(formData.Addresses || [])]

    if (addresses.some((a) => a.IsPrimary)) {
      newList = newList.map(a => ({ ...a, IsPrimary: 0 }))
    }

    newList = [...newList, ...addresses]
    onChange("Addresses", newList)
    setIsAddAddressOpen(false)
  }

  return (
    <>
      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-label">
          Contractor Name
          {fetchSuggestions ? (
            <SuggestionInput
              label="Contractor Name"
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
          Rating
          <input
            className="text-input"
            type="number"
            step={1}
            value={formData.Rating ?? ""}
            onChange={(event) => {
              const rawValue = event.target.value
              onChange("Rating", rawValue === "" ? null : Number(rawValue))
            }}
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
              onClick={() => setIsAddAddressOpen(true)}
              aria-label="Add addresses"
            >
              <span aria-hidden>+</span>
            </button>
          </div>
          <div className="pending-numbers-list">
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

        <AddAddressDialog
          isOpen={isAddAddressOpen}
          onClose={() => setIsAddAddressOpen(false)}
          onAdd={handleAddAddresses}
        />

        <div className="field-label contractor-tyre-field login-form-full-span">
          <div className="contractor-tyre-field-header">
            <span>Assign Tyres</span>
            <button
              type="button"
              className="contractor-tyre-add-button"
              onClick={handleOpenTyrePicker}
              aria-label="Open tyre picker"
              disabled={submitting}
            >
              <span aria-hidden>+</span>
            </button>
          </div>
          <p className="hero-text contractor-tyre-summary">{selectedTyreSummary}</p>
          {selectedTyreTags.length > 0 ? (
            <div className="contractor-tyre-tags">
              {selectedTyreTags.map((tyreId) => (
                <span key={tyreId} className="contractor-tyre-tag">
                  {tyreLabelMap.get(tyreId) ?? `#${tyreId}`}
                </span>
              ))}
              {selectedTyreIds.length > selectedTyreTags.length ? (
                <span className="contractor-tyre-tag">
                  +{selectedTyreIds.length - selectedTyreTags.length} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Contractor"}
          </button>
          {onCancel ? (
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {isTyrePickerOpen ? (
        <TyrePickerModal
          isOpen={isTyrePickerOpen}
          selectedTyreIds={selectedTyreIds}
          availableTyres={availableTyres}
          loading={tyresLoading}
          error={tyresError}
          onClose={() => setTyrePickerOpen(false)}
          onApply={(tyreIds) => onChange("TyreIDs", tyreIds)}
          onTyreCreated={onTyreCreated}
        />
      ) : null}
    </>
  )
}

function formatTyreLabel(tyre: TyreRecord) {
  const parts = [
    tyre.Size,
    tyre.Pattern,
    tyre.LL_SR,
    tyre.PR,
    tyre.SideWall,
  ].filter(Boolean)

  const descriptor = parts.length > 0 ? parts.join(" / ") : `Tyre ${tyre.Id}`

  return `${tyre.Id} - ${descriptor}`
}
