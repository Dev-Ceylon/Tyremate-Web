import type { FormEvent } from "react"
import type { BranchRecord } from "../../branches/models/branch"
import type { StorageLocationTypeRecord } from "../../storage-locations-types/models/storageLocationType"
import type { StorageLocationPayload } from "../models/storageLocation"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type StorageLocationFormProps = {
  formData: StorageLocationPayload
  branches: BranchRecord[]
  locationTypes: StorageLocationTypeRecord[]
  onChange: <K extends keyof StorageLocationPayload>(
    field: K,
    value: StorageLocationPayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  loadingBranches?: boolean
  loadingLocationTypes?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function StorageLocationForm({
  formData,
  branches,
  locationTypes,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  loadingBranches = false,
  loadingLocationTypes = false,
  fetchSuggestions,
}: StorageLocationFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Location Code
        <input
          className="text-input"
          value={formData.LocationCode}
          onChange={(event) => onChange("LocationCode", event.target.value)}
          required
        />
      </label>

      <label className="field-label">
        Location Name
        {fetchSuggestions ? (
          <SuggestionInput label="Location Name" hideLabel required value={formData.LocationName ?? ""} onChange={(v) => onChange("LocationName", v)} fetchSuggestions={(q) => fetchSuggestions("LocationName", q)} />
        ) : (
          <input className="text-input" value={formData.LocationName ?? ""} onChange={(event) => onChange("LocationName", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        Branch
        <select
          className="text-input"
          value={formData.BranchId ?? ""}
          onChange={(event) => onChange("BranchId", Number(event.target.value || 0) || null)}
          disabled={loadingBranches || submitting}
        >
          <option value="">
            {loadingBranches ? "Loading branches..." : "Select a branch"}
          </option>
          {branches.map((branch) => (
            <option key={branch.Id} value={branch.Id}>
              {branch.BranchCode} - {branch.BranchName}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Location Type
        <select
          className="text-input"
          value={formData.LocationTypeId ?? ""}
          onChange={(event) => onChange("LocationTypeId", Number(event.target.value || 0) || null)}
          disabled={loadingLocationTypes || submitting}
          required
        >
          <option value="">
            {loadingLocationTypes ? "Loading location types..." : "Select a location type"}
          </option>
          {locationTypes.map((type) => (
            <option key={type.Id} value={type.Id}>
              {type.LocationTypeCode} - {type.LocationTypeName}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Capacity
        <input
          className="text-input"
          type="text"
          inputMode="numeric"
          defaultValue={formData.Capacity ?? ""}
          onChange={(event) => onChange("Capacity", event.target.value === "" ? 0 : Number(event.target.value))}
        />
      </label>

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Storage Location"}
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
