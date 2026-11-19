import type { ConsumableStorageManagerRecord } from "../../../shared/models/consumables/consumableStorageManager"
import { getConsumableLabel } from "./ConsumableLocationDetailsTable"

type ConsumableLocationDetailsRowProps = {
  row: ConsumableStorageManagerRecord
  isEditing: boolean
  editingQty: number
  editingBatchNumber: string
  editingExpiryDate: string
  loading: boolean
  submitting: boolean
  canSaveEditRow: (row: ConsumableStorageManagerRecord) => boolean
  updateEditingField: (field: "qty" | "batchNumber" | "expiryDate", value: number | string | null) => void
  startEditRow: (row: ConsumableStorageManagerRecord) => void
  cancelEditRow: () => void
  handleUpdateRow: (row: ConsumableStorageManagerRecord) => Promise<void>
  handleDeleteRow: (row: ConsumableStorageManagerRecord) => Promise<void>
}

export function ConsumableLocationDetailsRow({
  row,
  isEditing,
  editingQty,
  editingBatchNumber,
  editingExpiryDate,
  loading,
  submitting,
  canSaveEditRow,
  updateEditingField,
  startEditRow,
  cancelEditRow,
  handleUpdateRow,
  handleDeleteRow,
}: ConsumableLocationDetailsRowProps) {
  const label = getConsumableLabel(row.ConsumableName, undefined, row.ConsumableID)

  return (
    <tr>
      <td>{label}</td>
      <td>
        {isEditing ? (
          <input
            className="text-input"
            type="text"
            inputMode="numeric"
            defaultValue={editingQty}
            onChange={(event) => updateEditingField("qty", event.target.value === "" ? null : Number(event.target.value))}
            disabled={submitting}
          />
        ) : (
          row.Qty
        )}
      </td>
      <td>{row.ConsumableUnit ?? "-"}</td>
      <td>
        {isEditing ? (
          <input
            className="text-input"
            type="text"
            value={editingBatchNumber}
            onChange={(event) => updateEditingField("batchNumber", event.target.value)}
            disabled={submitting}
          />
        ) : (
          row.BatchNumber ?? "-"
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            className="text-input"
            type="date"
            value={editingExpiryDate}
            onChange={(event) => updateEditingField("expiryDate", event.target.value)}
            disabled={submitting}
          />
        ) : (
          row.ExpiryDate ?? "-"
        )}
      </td>
      <td>
        {isEditing ? (
          <>
            <button
              className="primary-action"
              type="button"
              onClick={() => void handleUpdateRow(row)}
              disabled={loading || submitting || !canSaveEditRow(row)}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={cancelEditRow}
              disabled={loading || submitting}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="secondary-action"
              type="button"
              onClick={() => startEditRow(row)}
              disabled={loading || submitting}
            >
              Edit
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => void handleDeleteRow(row)}
              disabled={loading || submitting}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  )
}
