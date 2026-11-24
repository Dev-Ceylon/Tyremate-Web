import { useCallback, useState } from "react"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type { BatteryStorageManagerLocationRecord } from "../models/batteryStorageManager"
import { BatteryLocationDetailsRow } from "./BatteryLocationDetailsRow"
import { BatteryLocationDetailsCreateRow } from "./BatteryLocationDetailsCreateRow"

type TableState = {
  loading: boolean
  error: string | null
  submitting: boolean
  storageManagerRows: BatteryStorageManagerLocationRecord[]
  editingRowId: number | null
  editingQty: number
  canSaveCreateRow: boolean
  selectedBatteryId: number | null
  qty: number
  batchCode: string
  mfgDate: string
  expiryDate: string
  batteries: BatteryRecord[]
  availableBatteries: BatteryRecord[]
}

type TableEditActions = {
  canSaveEditRow: (row: BatteryStorageManagerLocationRecord) => boolean
  updateEditingQty: (value: number | null) => void
  startEditStorageRow: (row: BatteryStorageManagerLocationRecord) => void
  cancelEditStorageRow: () => void
  handleUpdateStorageRow: (row: BatteryStorageManagerLocationRecord) => Promise<void>
  handleDeleteStorageRow: (row: BatteryStorageManagerLocationRecord) => Promise<void>
}

type TableCreateActions = {
  updateField: (
    field: "selectedBatteryId" | "qty" | "batchCode" | "mfgDate" | "expiryDate",
    value: string | number | null,
  ) => void
  handleCreateStorageRow: () => Promise<void>
}

type BatteryLocationDetailsTableProps = {
  state: TableState
  editActions: TableEditActions
  createActions: TableCreateActions
}

export function BatteryLocationDetailsTable({
  state: {
    loading,
    error,
    submitting,
    storageManagerRows,
    editingRowId,
    editingQty,
    canSaveCreateRow,
    selectedBatteryId,
    qty,
    batchCode,
    mfgDate,
    expiryDate,
    batteries,
    availableBatteries,
  },
  editActions: {
    canSaveEditRow,
    updateEditingQty,
    startEditStorageRow,
    cancelEditStorageRow,
    handleUpdateStorageRow,
    handleDeleteStorageRow,
  },
  createActions: { updateField, handleCreateStorageRow },
}: BatteryLocationDetailsTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)

  const toggleExpand = useCallback((rowId: number) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId))
  }, [])

  if (loading || error) {
    return null
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Battery</th>
            <th>Qty</th>
            <th>Batch Code</th>
            <th>Mfg Date</th>
            <th>Expiry Date</th>
            <th>Voltage</th>
            <th>Capacity</th>
            <th>Application</th>
            <th>Source</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {storageManagerRows.map((row) => (
            <BatteryLocationDetailsRow
              key={row.Id}
              row={row}
              isEditing={editingRowId === row.Id}
              isExpanded={expandedRowId === row.Id}
              editingQty={editingQty}
              loading={loading}
              submitting={submitting}
              canSaveEditRow={canSaveEditRow}
              updateEditingQty={updateEditingQty}
              startEditStorageRow={startEditStorageRow}
              cancelEditStorageRow={cancelEditStorageRow}
              handleUpdateStorageRow={handleUpdateStorageRow}
              handleDeleteStorageRow={handleDeleteStorageRow}
              toggleExpand={toggleExpand}
            />
          ))}

          <BatteryLocationDetailsCreateRow
            selectedBatteryId={selectedBatteryId}
            qty={qty}
            batchCode={batchCode}
            mfgDate={mfgDate}
            expiryDate={expiryDate}
            batteries={batteries}
            availableBatteries={availableBatteries}
            loading={loading}
            submitting={submitting}
            canSaveCreateRow={canSaveCreateRow}
            updateField={updateField}
            handleCreateStorageRow={handleCreateStorageRow}
          />
        </tbody>
      </table>
    </div>
  )
}
