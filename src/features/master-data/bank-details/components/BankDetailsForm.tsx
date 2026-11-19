import type { FormEvent } from "react"
import type { BankDetailPayload } from "../models/bankDetail"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type BankDetailsFormProps = {
  formData: BankDetailPayload
  onChange: <K extends keyof BankDetailPayload>(field: K, value: BankDetailPayload[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function BankDetailsForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  fetchSuggestions,
}: BankDetailsFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Bank Name
        {fetchSuggestions ? (
          <SuggestionInput label="Bank Name" hideLabel required value={formData.BankName ?? ""} onChange={(v) => onChange("BankName", v)} fetchSuggestions={(q) => fetchSuggestions("BankName", q)} />
        ) : (
          <input className="text-input" value={formData.BankName ?? ""} onChange={(event) => onChange("BankName", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        Account Number
        <input
          className="text-input"
          value={formData.AccountNumber}
          onChange={(event) => onChange("AccountNumber", event.target.value)}
          required
        />
      </label>

      <label className="field-label">
        Account Name
        {fetchSuggestions ? (
          <SuggestionInput label="Account Name" hideLabel required value={formData.AccountName ?? ""} onChange={(v) => onChange("AccountName", v)} fetchSuggestions={(q) => fetchSuggestions("AccountName", q)} />
        ) : (
          <input className="text-input" value={formData.AccountName ?? ""} onChange={(event) => onChange("AccountName", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        Branch
        {fetchSuggestions ? (
          <SuggestionInput label="Branch" hideLabel required value={formData.Branch ?? ""} onChange={(v) => onChange("Branch", v)} fetchSuggestions={(q) => fetchSuggestions("Branch", q)} />
        ) : (
          <input className="text-input" value={formData.Branch ?? ""} onChange={(event) => onChange("Branch", event.target.value)} required />
        )}
      </label>

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Bank Detail"}
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