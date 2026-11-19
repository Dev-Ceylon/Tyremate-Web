import { useCallback, useState } from "react"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { StorageManagerLocationRecord } from "../models/storageManager"
import { StorageLocationDetailsRow } from "./StorageLocationDetailsRow"
import { StorageLocationDetailsCreateRow } from "./StorageLocationDetailsCreateRow"

export function getTyreLabel(size?: string | null, pattern?: string | null, fallbackId?: number) {
  const label = [size, pattern].filter(Boolean).join(" ")
  return label || `Tyre ${fallbackId ?? ""}`.trim()
}

export function getExpiryStatusLabel(daysLeft?: number | null) {
  if (daysLeft === undefined || daysLeft === null) {
    return <span className="status-badge status-draft">No data</span>
  }

  if (daysLeft < 0) {
    return <span className="status-badge status-rejected">Expired</span>
  }

  if (daysLeft <= 5) {
    return <span className="status-badge status-pending">Expiring soon</span>
  }

  return <span className="status-badge status-completed">OK</span>
}

type StorageLocationDetailsTableState = {
  loading: boolean
  error: string | null
  submitting: boolean
  storageManagerRows: StorageManagerLocationRecord[]
  editingRowId: number | null
  editingQty: number
  canSaveCreateRow: boolean
  selectedTyreId: number | null
  qty: number
  tyres: TyreRecord[]
  availableTyres: TyreRecord[]
}

type StorageLocationDetailsTableEditActions = {
  canSaveEditRow: (row: StorageManagerLocationRecord) => boolean
  updateEditingQty: (value: number | null) => void
  startEditStorageRow: (row: StorageManagerLocationRecord) => void
  cancelEditStorageRow: () => void
  handleUpdateStorageRow: (row: StorageManagerLocationRecord) => Promise<void>
  handleDeleteStorageRow: (row: StorageManagerLocationRecord) => Promise<void>
}

type StorageLocationDetailsTableCreateActions = {
  updateField: (field: "selectedTyreId" | "qty", value: number | null) => void
  handleCreateStorageRow: () => Promise<void>
}

type StorageLocationDetailsTableProps = {
  state: StorageLocationDetailsTableState
  editActions: StorageLocationDetailsTableEditActions
  createActions: StorageLocationDetailsTableCreateActions
}

export function StorageLocationDetailsTable({
  state: {
    loading,
    error,
    submitting,
    storageManagerRows,
    editingRowId,
    editingQty,
    canSaveCreateRow,
    selectedTyreId,
    qty,
    tyres,
    availableTyres,
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
}: StorageLocationDetailsTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)

  const toggleExpand = useCallback(
    (rowId: number) => {
      setExpandedRowId((current) => (current === rowId ? null : rowId))
    },
    []
  )

  if (loading || error) {
    return null
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Tyre</th>
            <th>Qty</th>
            <th>Size</th>
            <th>Pattern</th>
            <th>Order ID</th>
            <th>Source</th>
            <th>Created By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {storageManagerRows.map((row) => (
            <StorageLocationDetailsRow
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

          <StorageLocationDetailsCreateRow
            selectedTyreId={selectedTyreId}
            qty={qty}
            tyres={tyres}
            availableTyres={availableTyres}
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