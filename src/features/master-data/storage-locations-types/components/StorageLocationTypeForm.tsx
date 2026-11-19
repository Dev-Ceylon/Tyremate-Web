import type { FormEvent } from "react"
import type { StorageLocationTypePayload } from "../models/storageLocationType"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type StorageLocationTypeFormProps = {
  formData: StorageLocationTypePayload
  onChange: <K extends keyof StorageLocationTypePayload>(
    field: K,
    value: StorageLocationTypePayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function StorageLocationTypeForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  fetchSuggestions,
}: StorageLocationTypeFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Location Type Code
        {fetchSuggestions ? (
          <SuggestionInput label="Location Type Code" hideLabel required value={formData.LocationTypeCode ?? ""} onChange={(v) => onChange("LocationTypeCode", v)} fetchSuggestions={(q) => fetchSuggestions("LocationTypeCode", q)} />
        ) : (
          <input className="text-input" value={formData.LocationTypeCode ?? ""} onChange={(event) => onChange("LocationTypeCode", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        Location Type Name
        {fetchSuggestions ? (
          <SuggestionInput label="Location Type Name" hideLabel required value={formData.LocationTypeName ?? ""} onChange={(v) => onChange("LocationTypeName", v)} fetchSuggestions={(q) => fetchSuggestions("LocationTypeName", q)} />
        ) : (
          <input className="text-input" value={formData.LocationTypeName ?? ""} onChange={(event) => onChange("LocationTypeName", event.target.value)} required />
        )}
      </label>

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Storage Location Type"}
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