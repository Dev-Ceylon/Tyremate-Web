import type { FormEvent } from "react"
import type { BranchRecord } from "../../branches/models/branch"
import type { StorageLocationTypeRecord } from "../../storage-locations-types/models/storageLocationType"
import type { BatteryLocationPayload } from "../models/batteryLocation"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type BatteryLocationFormProps = {
  formData: BatteryLocationPayload
  branches: BranchRecord[]
  locationTypes: StorageLocationTypeRecord[]
  onChange: <K extends keyof BatteryLocationPayload>(
    field: K,
    value: BatteryLocationPayload[K]
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  loadingBranches?: boolean
  loadingLocationTypes?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function BatteryLocationForm({
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
}: BatteryLocationFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Location Code
        <input
          className="text-input"
          value={formData.LocationCode}
          onChange={(event) => onChange("LocationCode", event.target.value)}
          placeholder="e.g. KAN-BAT-01"
          required
        />
      </label>

      <label className="field-label">
        Location Name
        {fetchSuggestions ? (
          <SuggestionInput
            label="Location Name"
            hideLabel
            required
            value={formData.LocationName ?? ""}
            onChange={(v) => onChange("LocationName", v)}
            fetchSuggestions={(q) => fetchSuggestions("LocationName", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.LocationName ?? ""}
            onChange={(event) => onChange("LocationName", event.target.value)}
            placeholder="e.g. Kandy Battery Store"
            required
          />
        )}
      </label>

      <label className="field-label">
        Branch
        <select
          className="text-input"
          value={formData.BranchId ?? ""}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange("BranchId", nextValue ? Number(nextValue) : null)
          }}
          disabled={loadingBranches}
          required
        >
          <option value="">Select branch</option>
          {branches.map((branch) => (
            <option key={branch.Id} value={branch.Id}>
              {branch.BranchName}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Location Type
        <select
          className="text-input"
          value={formData.LocationTypeId ?? ""}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange("LocationTypeId", nextValue ? Number(nextValue) : null)
          }}
          disabled={loadingLocationTypes}
          required
        >
          <option value="">Select location type</option>
          {locationTypes.map((type) => (
            <option key={type.Id} value={type.Id}>
              {type.LocationTypeName}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Capacity
        <input
          type="number"
          min="0"
          className="text-input"
          value={formData.Capacity ?? 0}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange("Capacity", nextValue === "" ? 0 : Number(nextValue))
          }}
          required
        />
      </label>

      <div className="form-actions">
        <button
          type="submit"
          className="primary-action submit-action"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Location"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="secondary-action"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
