import type { FormEvent } from "react"
import type { ConsumablePayload } from "../../../../shared/models/consumables/consumable"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

const CATEGORIES = [
  "Patch",
  "Plug",
  "Chemical",
  "Hardware",
  "Gas",
  "Cleaning",
]

type ConsumableFormProps = {
  formData: ConsumablePayload
  onChange: <K extends keyof ConsumablePayload>(
    field: K,
    value: ConsumablePayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function ConsumableForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  fetchSuggestions,
}: ConsumableFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Name
        {fetchSuggestions ? (
          <SuggestionInput
            label="Name"
            hideLabel
            required
            value={formData.Name ?? ""}
            onChange={(v) => onChange("Name", v)}
            fetchSuggestions={(q) => fetchSuggestions("Name", q)}
          />
        ) : (
          <input className="text-input" value={formData.Name ?? ""} onChange={(event) => onChange("Name", event.target.value)} required />
        )}
      </label>

      <label className="field-label">
        Category
        <select
          className="text-input"
          value={formData.Category ?? ""}
          onChange={(event) => onChange("Category", event.target.value || null)}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Unit
        {fetchSuggestions ? (
          <SuggestionInput
            label="Unit"
            hideLabel
            required
            value={formData.Unit ?? ""}
            onChange={(v) => onChange("Unit", v)}
            fetchSuggestions={(q) => fetchSuggestions("Unit", q)}
            placeholder="e.g. pcs, kg, litre"
          />
        ) : (
          <input className="text-input" value={formData.Unit ?? ""} onChange={(event) => onChange("Unit", event.target.value)} placeholder="e.g. pcs, kg, litre" required />
        )}
      </label>

      <label className="field-label">
        Cost Price
        <input
          className="text-input"
          type="text"
          inputMode="decimal"
          defaultValue={formData.CostPrice ?? ""}
          onChange={(event) =>
            onChange(
              "CostPrice",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        Reorder Level
        <input
          className="text-input"
          type="text"
          inputMode="numeric"
          defaultValue={formData.ReorderLevel ?? ""}
          onChange={(event) =>
            onChange(
              "ReorderLevel",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        Status
        <select
          className="text-input"
          value={formData.IsActive ?? 1}
          onChange={(event) => onChange("IsActive", Number(event.target.value))}
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>
      </label>

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Consumable"}
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
