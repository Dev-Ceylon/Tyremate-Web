import type { BatteryStorageManagerLocationRecord } from "../models/batteryStorageManager"
import { getStorageSourceName } from "../../../shared/constants/storageSourceConstants"
import { formatBatteryLabel } from "../../../shared/battery/models/batteryDisplay"
import { BatteryBatchLotsTable } from "./BatteryBatchLotsTable"

type BatteryLocationDetailsRowProps = {
  row: BatteryStorageManagerLocationRecord
  isEditing: boolean
  isExpanded: boolean
  editingQty: number
  loading: boolean
  submitting: boolean
  canSaveEditRow: (row: BatteryStorageManagerLocationRecord) => boolean
  updateEditingQty: (value: number | null) => void
  startEditStorageRow: (row: BatteryStorageManagerLocationRecord) => void
  cancelEditStorageRow: () => void
  handleUpdateStorageRow: (row: BatteryStorageManagerLocationRecord) => Promise<void>
  handleDeleteStorageRow: (row: BatteryStorageManagerLocationRecord) => Promise<void>
  toggleExpand: (rowId: number) => void
}

export function BatteryLocationDetailsRow({
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
}: BatteryLocationDetailsRowProps) {
  const batteryLabel = formatBatteryLabel(
    {
      Brand: row.Brand,
      Model: row.Model,
      Capacity: row.Capacity,
      Voltage: row.Voltage,
      Application: row.Application,
    },
    { preset: "full" },
  )

  const batchCount = row.batches?.length ?? 0

  return (
    <>
      <tr>
        <td>
          <button
            className="secondary-action"
            type="button"
            onClick={() => toggleExpand(row.Id)}
            disabled={loading || submitting}
            title={isExpanded ? "Collapse batches" : "Expand batches"}
          >
            {isExpanded ? "−" : "+"}
          </button>{" "}
          <strong>{batteryLabel}</strong>
          {batchCount > 0 ? (
            <span className="section-label" style={{ marginLeft: "0.5rem" }}>
              ({batchCount} batch{batchCount === 1 ? "" : "es"})
            </span>
          ) : null}
        </td>
        <td>
          {isEditing ? (
            <input
              className="text-input"
              type="text"
              inputMode="numeric"
              defaultValue={editingQty}
              onChange={(event) =>
                updateEditingQty(event.target.value === "" ? null : Number(event.target.value))
              }
              disabled={submitting}
            />
          ) : (
            row.Qty
          )}
        </td>
        <td>
          {row.batches?.[0]?.BatchCode || row.MasterBatchCode || "—"}
          {batchCount > 1 ? ` (+${batchCount - 1} more)` : ""}
        </td>
        <td>{row.batches?.[0]?.MfgDate || "—"}</td>
        <td>{row.batches?.[0]?.ExpiryDate || "—"}</td>
        <td>{row.Voltage ?? "12V"}</td>
        <td>{row.Capacity ?? "—"}</td>
        <td>{row.Application ?? "—"}</td>
        <td>{getStorageSourceName(row.SourceCode)}</td>
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

      {isExpanded ? (
        <tr>
          <td colSpan={10} style={{ padding: "0.75rem 1rem", backgroundColor: "var(--color-surface-sunken, #f8f9fa)" }}>
            <div style={{ marginBottom: "0.5rem" }}>
              <span className="section-label">Batch Lots for {batteryLabel}</span>
            </div>
            <BatteryBatchLotsTable batches={row.batches || []} />
          </td>
        </tr>
      ) : null}
    </>
  )
}
