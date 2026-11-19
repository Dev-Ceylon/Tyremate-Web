import type { ConsumableRecord } from "../../../shared/models/consumables/consumable"
import type { ConsumableStorageManagerRecord } from "../../../shared/models/consumables/consumableStorageManager"
import { ConsumableLocationDetailsRow } from "./ConsumableLocationDetailsRow"
import { ConsumableLocationDetailsCreateRow } from "./ConsumableLocationDetailsCreateRow"

export function getConsumableLabel(name?: string | null, category?: string | null, fallbackId?: number) {
  const label = [name, category].filter(Boolean).join(" - ")
  return label || `Consumable ${fallbackId ?? ""}`.trim()
}

type TableState = {
  loading: boolean
  error: string | null
  submitting: boolean
  stockRows: ConsumableStorageManagerRecord[]
  editingRowId: number | null
  editingQty: number
  editingBatchNumber: string
  editingExpiryDate: string
  canSaveCreateRow: boolean
  selectedConsumableId: number | null
  qty: number
  batchNumber: string
  expiryDate: string
  consumables: ConsumableRecord[]
}

type EditActions = {
  canSaveEditRow: (row: ConsumableStorageManagerRecord) => boolean
  updateEditingField: (field: "qty" | "batchNumber" | "expiryDate", value: number | string | null) => void
  startEditRow: (row: ConsumableStorageManagerRecord) => void
  cancelEditRow: () => void
  handleUpdateRow: (row: ConsumableStorageManagerRecord) => Promise<void>
  handleDeleteRow: (row: ConsumableStorageManagerRecord) => Promise<void>
}

type CreateActions = {
  updateField: (field: "selectedConsumableId" | "qty" | "batchNumber" | "expiryDate", value: number | string | null) => void
  handleCreateRow: () => Promise<void>
}

type ConsumableLocationDetailsTableProps = {
  state: TableState
  editActions: EditActions
  createActions: CreateActions
}

export function ConsumableLocationDetailsTable({
  state: {
    loading,
    error,
    submitting,
    stockRows,
    editingRowId,
    editingQty,
    editingBatchNumber,
    editingExpiryDate,
    canSaveCreateRow,
    selectedConsumableId,
    qty,
    batchNumber,
    expiryDate,
    consumables,
  },
  editActions: {
    canSaveEditRow,
    updateEditingField,
    startEditRow,
    cancelEditRow,
    handleUpdateRow,
    handleDeleteRow,
  },
  createActions: { updateField, handleCreateRow },
}: ConsumableLocationDetailsTableProps) {
  if (loading || error) {
    return null
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Consumable</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Batch #</th>
            <th>Expiry</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {stockRows.map((row) => (
            <ConsumableLocationDetailsRow
              key={row.Id}
              row={row}
              isEditing={editingRowId === row.Id}
              editingQty={editingQty}
              editingBatchNumber={editingBatchNumber}
              editingExpiryDate={editingExpiryDate}
              loading={loading}
              submitting={submitting}
              canSaveEditRow={canSaveEditRow}
              updateEditingField={updateEditingField}
              startEditRow={startEditRow}
              cancelEditRow={cancelEditRow}
              handleUpdateRow={handleUpdateRow}
              handleDeleteRow={handleDeleteRow}
            />
          ))}

          <ConsumableLocationDetailsCreateRow
            selectedConsumableId={selectedConsumableId}
            qty={qty}
            batchNumber={batchNumber}
            expiryDate={expiryDate}
            consumables={consumables}
            loading={loading}
            submitting={submitting}
            canSaveCreateRow={canSaveCreateRow}
            updateField={updateField}
            handleCreateRow={handleCreateRow}
          />
        </tbody>
      </table>
    </div>
  )
}
