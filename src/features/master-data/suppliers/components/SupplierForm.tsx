import { useMemo, useState, type FormEvent } from "react"
import type { TyreRecord } from "../../tyres/models/tyre"
import type { BatteryRecord } from "../../batteries/models/battery"
import type { SupplierPayload, SupplierContact, SupplierEmail, SupplierAddress } from "../models/supplier"
import { formatTyreLabel } from "../../../../shared/tyre/models/tyreDisplay"
import { formatBatteryLabel } from "../../../../shared/battery/models/batteryDisplay"
import { SUPPLIER_TYPE_CODES, SUPPLIER_TYPE_OPTIONS } from "../constants/supplierTypeConstants"
import { SupplierTyrePickerModal } from "./SupplierTyrePickerModal"
import { SupplierBatteryPickerModal } from "./SupplierBatteryPickerModal"
import { AddMobileDialog } from "./AddDataPopupModals/AddMobileDialog"
import { AddEmailDialog } from "./AddDataPopupModals/AddEmailDialog"
import { AddAddressDialog } from "./AddDataPopupModals/AddAddressDialog"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type SupplierFormProps = {
  formData: SupplierPayload
  availableTyres: TyreRecord[]
  tyresLoading?: boolean
  tyresError?: string | null
  onOpenTyrePicker?: () => Promise<void> | void
  onTyreCreated?: (tyre: TyreRecord) => void
  availableBatteries?: BatteryRecord[]
  batteriesLoading?: boolean
  batteriesError?: string | null
  onOpenBatteryPicker?: () => Promise<void> | void
  onBatteryCreated?: (battery: BatteryRecord) => void
  onChange: <K extends keyof SupplierPayload>(
    field: K,
    value: SupplierPayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  isEdit?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function SupplierForm({
  formData,
  availableTyres,
  tyresLoading = false,
  tyresError = null,
  onOpenTyrePicker,
  onTyreCreated,
  availableBatteries = [],
  batteriesLoading = false,
  batteriesError = null,
  onOpenBatteryPicker,
  onBatteryCreated,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  isEdit = false,
  fetchSuggestions,
}: SupplierFormProps) {
  const [isTyrePickerOpen, setTyrePickerOpen] = useState(false)
  const [isBatteryPickerOpen, setBatteryPickerOpen] = useState(false)
  const [isAddMobileOpen, setIsAddMobileOpen] = useState(false)
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)

  const supplierType = formData.SupplierTypeCode ?? SUPPLIER_TYPE_CODES.TYRES

  const selectedTyres = useMemo(() => formData.Tyres ?? [], [formData.Tyres])
  const tyreLabelMap = useMemo(
    () =>
      new Map(
        availableTyres.map((tyre) => [
          tyre.Id,
          formatTyreLabel(tyre, { preset: "full", showId: true }),
        ]),
      ),
    [availableTyres],
  )

  const selectedTyreSummary = useMemo(() => {
    if (selectedTyres.length === 0) {
      return "No tyres selected"
    }

    return `${selectedTyres.length} tyre${selectedTyres.length === 1 ? "" : "s"} selected`
  }, [selectedTyres])

  const selectedTyreTags = useMemo(
    () => selectedTyres.slice(0, 6),
    [selectedTyres],
  )

  const handleOpenTyrePicker = () => {
    setTyrePickerOpen(true)
    void onOpenTyrePicker?.()
  }

  const selectedBatteries = useMemo(
    () => formData.Batteries ?? [],
    [formData.Batteries],
  )
  const batteryLabelMap = useMemo(
    () =>
      new Map(
        availableBatteries.map((battery) => [
          battery.Id,
          formatBatteryLabel(battery, { preset: "full", showId: true }),
        ]),
      ),
    [availableBatteries],
  )

  const selectedBatterySummary = useMemo(() => {
    if (selectedBatteries.length === 0) {
      return "No batteries selected"
    }

    return `${selectedBatteries.length} batter${selectedBatteries.length === 1 ? "y" : "ies"} selected`
  }, [selectedBatteries])

  const selectedBatteryTags = useMemo(
    () => selectedBatteries.slice(0, 6),
    [selectedBatteries],
  )

  const handleOpenBatteryPicker = () => {
    setBatteryPickerOpen(true)
    void onOpenBatteryPicker?.()
  }

  const handleAddContacts = (contacts: SupplierContact[]) => {
    let newList = [...(formData.Contacts || [])]

    if (contacts.some((c) => c.IsPrimary)) {
      newList = newList.map(c => ({ ...c, IsPrimary: 0 }))
    }

    newList = [...newList, ...contacts]
    onChange("Contacts", newList)
    setIsAddMobileOpen(false)
  }

  const handleAddEmails = (emails: SupplierEmail[]) => {
    let newList = [...(formData.Emails || [])]

    if (emails.some((e) => e.IsPrimary)) {
      newList = newList.map(e => ({ ...e, IsPrimary: 0 }))
    }

    newList = [...newList, ...emails]
    onChange("Emails", newList)
    setIsAddEmailOpen(false)
  }

  const handleAddAddresses = (addresses: SupplierAddress[]) => {
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
          Supplier Code
          <input
            className="text-input"
            value={isEdit ? formData.SupplierCode : "Auto-generated"}
            readOnly
            disabled
          />
        </label>

        <label className="field-label">
          Supplier Name
          {fetchSuggestions ? (
            <SuggestionInput
              label="Supplier Name"
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
          Supplier Type
          <select
            className="text-input"
            value={formData.SupplierTypeCode ?? SUPPLIER_TYPE_CODES.TYRES}
            onChange={(event) => onChange("SupplierTypeCode", event.target.value)}
          >
            {SUPPLIER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

        {supplierType === SUPPLIER_TYPE_CODES.BATTERIES ? (
          <div className="field-label contractor-tyre-field login-form-full-span">
            <div className="contractor-tyre-field-header">
              <span>Assign Batteries</span>
              <button
                type="button"
                className="contractor-tyre-add-button"
                onClick={handleOpenBatteryPicker}
                aria-label="Open supplier battery picker"
                disabled={submitting}
              >
                <span aria-hidden>+</span>
              </button>
            </div>
            <p className="hero-text contractor-tyre-summary">{selectedBatterySummary}</p>
            {selectedBatteryTags.length > 0 ? (
              <div className="contractor-tyre-tags">
                {selectedBatteryTags.map((battery) => (
                  <span key={battery.BatteryID} className="contractor-tyre-tag">
                    {batteryLabelMap.get(battery.BatteryID) ??
                      formatBatteryLabel(battery, { preset: "full", showId: true })}
                  </span>
                ))}
                {selectedBatteries.length > selectedBatteryTags.length ? (
                  <span className="contractor-tyre-tag">
                    +{selectedBatteries.length - selectedBatteryTags.length} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : supplierType === SUPPLIER_TYPE_CODES.TYRES ? (
          <div className="field-label contractor-tyre-field login-form-full-span">
            <div className="contractor-tyre-field-header">
              <span>Assign Tyres</span>
              <button
                type="button"
                className="contractor-tyre-add-button"
                onClick={handleOpenTyrePicker}
                aria-label="Open supplier tyre picker"
                disabled={submitting}
              >
                <span aria-hidden>+</span>
              </button>
            </div>
            <p className="hero-text contractor-tyre-summary">{selectedTyreSummary}</p>
            {selectedTyreTags.length > 0 ? (
              <div className="contractor-tyre-tags">
                {selectedTyreTags.map((tyre) => (
                  <span key={tyre.TyreID} className="contractor-tyre-tag">
                    {tyreLabelMap.get(tyre.TyreID) ??
                      formatTyreLabel(tyre, { preset: "full", showId: true })}
                  </span>
                ))}
                {selectedTyres.length > selectedTyreTags.length ? (
                  <span className="contractor-tyre-tag">
                    +{selectedTyres.length - selectedTyreTags.length} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="field-label contractor-tyre-field login-form-full-span">
            <div className="contractor-tyre-field-header">
              <span>Product Assignment</span>
            </div>
            <p className="hero-text contractor-tyre-summary" style={{ fontStyle: "italic" }}>
              {supplierType === SUPPLIER_TYPE_CODES.CONSUMABLES
                ? "No catalog assignment needed for consumables suppliers. Items are managed directly in inventory."
                : "No product catalog assignment needed for general suppliers."}
            </p>
          </div>
        )}

        <div className="header-actions">
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Supplier"}
          </button>
          {onCancel ? (
            <button className="secondary-action" type="button" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {isTyrePickerOpen ? (
        <SupplierTyrePickerModal
          isOpen={isTyrePickerOpen}
          selectedTyres={selectedTyres}
          availableTyres={availableTyres}
          loading={tyresLoading}
          error={tyresError}
          onClose={() => setTyrePickerOpen(false)}
          onApply={(tyres) => onChange("Tyres", tyres)}
          onTyreCreated={onTyreCreated}
        />
      ) : null}

      {isBatteryPickerOpen ? (
        <SupplierBatteryPickerModal
          isOpen={isBatteryPickerOpen}
          selectedBatteries={selectedBatteries}
          availableBatteries={availableBatteries}
          loading={batteriesLoading}
          error={batteriesError}
          onClose={() => setBatteryPickerOpen(false)}
          onApply={(batteries) => onChange("Batteries", batteries)}
          onBatteryCreated={onBatteryCreated}
        />
      ) : null}
    </>
  )
}
