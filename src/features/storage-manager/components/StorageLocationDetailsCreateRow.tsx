import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import { getTyreLabel } from "./StorageLocationDetailsTable"

type StorageLocationDetailsCreateRowProps = {
  selectedTyreId: number | null
  qty: number
  tyres: TyreRecord[]
  availableTyres: TyreRecord[]
  loading: boolean
  submitting: boolean
  canSaveCreateRow: boolean
  updateField: (field: "selectedTyreId" | "qty", value: number | null) => void
  handleCreateStorageRow: () => Promise<void>
}

function renderTyreOptions(availableTyres: TyreRecord[]) {
  return availableTyres.map((tyre) => {
    const tyreLabel = getTyreLabel(tyre.Size, tyre.Pattern, tyre.Id)

    return (
      <option key={tyre.Id} value={tyre.Id}>
        {tyreLabel}
      </option>
    )
  })
}

export function StorageLocationDetailsCreateRow({
  selectedTyreId,
  qty,
  tyres,
  availableTyres,
  loading,
  submitting,
  canSaveCreateRow,
  updateField,
  handleCreateStorageRow,
}: StorageLocationDetailsCreateRowProps) {
  const selectedTyre = tyres.find((tyre) => tyre.Id === selectedTyreId)

  return (
    <tr>
      <td>
        <select
          className="text-input"
          value={selectedTyreId ?? ""}
          onChange={(event) => updateField("selectedTyreId", Number(event.target.value) || null)}
          disabled={loading || submitting}
        >
          <option value="">{availableTyres.length > 0 ? "Select tyre" : "No available tyres"}</option>
          {renderTyreOptions(availableTyres)}
        </select>
      </td>
      <td>
        <input
          className="text-input"
            type="text"
            inputMode="numeric"
            defaultValue={qty}
            onChange={(event) => updateField("qty", event.target.value === "" ? 0 : Number(event.target.value))}
          disabled={loading || submitting}
        />
      </td>
      <td>{selectedTyre?.Size ?? "Not selected"}</td>
      <td>{selectedTyre?.Pattern ?? "Not selected"}</td>
      <td>—</td>
      <td>Manual</td>
      <td>—</td>
      <td>
        <button
          className="primary-action"
          type="button"
          onClick={() => void handleCreateStorageRow()}
          disabled={loading || submitting || !canSaveCreateRow}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  )
}