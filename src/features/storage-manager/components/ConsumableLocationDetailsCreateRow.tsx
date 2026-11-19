import type { ConsumableRecord } from "../../../shared/models/consumables/consumable"
import { getConsumableLabel } from "./ConsumableLocationDetailsTable"

type ConsumableLocationDetailsCreateRowProps = {
  selectedConsumableId: number | null
  qty: number
  batchNumber: string
  expiryDate: string
  consumables: ConsumableRecord[]
  loading: boolean
  submitting: boolean
  canSaveCreateRow: boolean
  updateField: (field: "selectedConsumableId" | "qty" | "batchNumber" | "expiryDate", value: number | string | null) => void
  handleCreateRow: () => Promise<void>
}

function renderConsumableOptions(consumables: ConsumableRecord[]) {
  return consumables.map((consumable) => {
    const label = getConsumableLabel(consumable.Name, consumable.Category, consumable.Id)

    return (
      <option key={consumable.Id} value={consumable.Id}>
        {label}
      </option>
    )
  })
}

export function ConsumableLocationDetailsCreateRow({
  selectedConsumableId,
  qty,
  batchNumber,
  expiryDate,
  consumables,
  loading,
  submitting,
  canSaveCreateRow,
  updateField,
  handleCreateRow,
}: ConsumableLocationDetailsCreateRowProps) {
  const selectedConsumable = consumables.find((c) => c.Id === selectedConsumableId)

  return (
    <tr>
      <td>
        <select
          className="text-input"
          value={selectedConsumableId ?? ""}
          onChange={(event) => updateField("selectedConsumableId", Number(event.target.value) || null)}
          disabled={loading || submitting}
        >
          <option value="">{consumables.length > 0 ? "Select consumable" : "No consumables"}</option>
          {renderConsumableOptions(consumables)}
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
      <td>{selectedConsumable?.Unit ?? "-"}</td>
      <td>
        <input
          className="text-input"
          type="text"
          value={batchNumber}
          onChange={(event) => updateField("batchNumber", event.target.value)}
          disabled={loading || submitting}
          placeholder="Optional"
        />
      </td>
      <td>
        <input
          className="text-input"
          type="date"
          value={expiryDate}
          onChange={(event) => updateField("expiryDate", event.target.value)}
          disabled={loading || submitting}
        />
      </td>
      <td>
        <button
          className="primary-action"
          type="button"
          onClick={() => void handleCreateRow()}
          disabled={loading || submitting || !canSaveCreateRow}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  )
}
