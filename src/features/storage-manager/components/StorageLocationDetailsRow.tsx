import type { StorageManagerLocationRecord } from "../models/storageManager"
import { getStorageSourceName } from "../../../shared/constants/storageSourceConstants"
import { getTyreLabel } from "./StorageLocationDetailsTable"
import { DOTLotsTable } from "./DOTLotsTable"

type StorageLocationDetailsRowProps = {
  row: StorageManagerLocationRecord
  isEditing: boolean
  isExpanded: boolean
  editingQty: number
  loading: boolean
  submitting: boolean
  canSaveEditRow: (row: StorageManagerLocationRecord) => boolean
  updateEditingQty: (value: number | null) => void
  startEditStorageRow: (row: StorageManagerLocationRecord) => void
  cancelEditStorageRow: () => void
  handleUpdateStorageRow: (row: StorageManagerLocationRecord) => Promise<void>
  handleDeleteStorageRow: (row: StorageManagerLocationRecord) => Promise<void>
  toggleExpand: (rowId: number) => void
}

export function StorageLocationDetailsRow({
  row,
  isEditing,
  isExpanded,
  editingQty,
  loading,
  submitting,
  canSaveEditRow,
  updateEditingQty,
  startEditStorageRow,
  cancelEditStorageRow,
  handleUpdateStorageRow,
  handleDeleteStorageRow,
  toggleExpand,
}: StorageLocationDetailsRowProps) {
  const tyreLabel = getTyreLabel(row.Size, row.Pattern, row.TyreId)

  return (
    <>
      <tr>
        <td>
          <button
            className="secondary-action"
            type="button"
            onClick={() => toggleExpand(row.Id)}
            disabled={loading || submitting}
          >
            {isExpanded ? "−" : "+"}
          </button>{" "}
          {tyreLabel}
        </td>
        <td>
          {isEditing ? (
            <input
              className="text-input"
              type="text"
              inputMode="numeric"
              defaultValue={editingQty}
              onChange={(event) => updateEditingQty(event.target.value === "" ? null : Number(event.target.value))}
              disabled={submitting}
            />
          ) : (
            row.Qty
          )}
        </td>
        <td>{row.Size ?? "Not provided"}</td>
        <td>{row.Pattern ?? "Not provided"}</td>
        <td>{row.OrderID ?? "—"}</td>
        <td>{getStorageSourceName(row.SourceCode)}</td>
        <td>{row.CreatedBy ?? "—"}</td>
        <td>
          {isEditing ? (
            <>
              <button
                className="primary-action"
                type="button"
                onClick={() => void handleUpdateStorageRow(row)}
                disabled={loading || submitting || !canSaveEditRow(row)}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={cancelEditStorageRow}
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
                onClick={() => startEditStorageRow(row)}
                disabled={loading || submitting}
              >
                Edit
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => void handleDeleteStorageRow(row)}
                disabled={loading || submitting}
              >
                Delete
              </button>
            </>
          )}
        </td>
      </tr>

      <tr className={isExpanded ? "dot-lots-row expanded" : "dot-lots-row"}>
        <td colSpan={8}>
          <div className="dot-lots-content">
            <DOTLotsTable batches={row.batches ?? []} />
          </div>
        </td>
      </tr>
    </>
  )
}