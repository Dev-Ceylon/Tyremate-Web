import { useMemo, useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { StorageAllocationInput } from "../models/salesOrder"
import type { SOCategory } from "../../../shared/constants/soCategoryConstants"
import {
  useQuantityManagerStock,
  type StockLotRow,
} from "../hooks/useQuantityManagerStock"
import { isUsingNewerLotWhileOlderAvailable } from "../utils/salesOrderCalculations"
import { NewerStockWarningModal } from "./NewerStockWarningModal"

type QuantitySelectModalProps = {
  isOpen: boolean
  tyreId?: number | null
  itemId?: number | null
  tyreLabel?: string
  itemLabel?: string
  category?: SOCategory
  initialAllocations: StorageAllocationInput[]
  onClose: () => void
  onConfirm: (allocations: StorageAllocationInput[]) => void
}

const toNonNegativeInt = (raw: string): number => {
  if (raw.trim() === "") return Number.NaN
  const value = Number(raw)
  return Number.isInteger(value) ? Math.max(value, 0) : Number.NaN
}

const remainingAvailableQty = (row: StockLotRow): number => {
  const allocated = toNonNegativeInt(row.allocated)
  return Number.isNaN(allocated)
    ? row.availableQty
    : Math.max(row.availableQty - allocated, 0)
}

const renderDot = (row: StockLotRow): string => {
  if (row.StorageManagerBatchID === null) return "-"
  return row.dot || row.batchCode || (row.expiryDate ? `Exp: ${row.expiryDate}` : "-")
}

export function QuantitySelectModal({
  isOpen,
  tyreId = null,
  itemId = null,
  tyreLabel = "",
  itemLabel = "",
  category = "tyre",
  initialAllocations,
  onClose,
  onConfirm,
}: QuantitySelectModalProps) {
  const targetId = itemId ?? tyreId
  const displayLabel = itemLabel || tyreLabel
  const { rows, loading, error, totalQty, updateAllocated, updateTakeNow } = useQuantityManagerStock(
    isOpen,
    targetId,
    initialAllocations,
    category,
  )
  const [rowError, setRowError] = useState<string | null>(null)
  const [showNewerStockWarning, setShowNewerStockWarning] = useState(false)

  const allocatedTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const value = toNonNegativeInt(row.allocated)
        return Number.isNaN(value) ? sum : sum + value
      }, 0),
    [rows],
  )

  const takeNowTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const value = toNonNegativeInt(row.takeNow)
        return Number.isNaN(value) ? sum : sum + value
      }, 0),
    [rows],
  )

  const handleAllocatedChange = (batchId: number | null, raw: string) => {
    updateAllocated(batchId, raw)
    setRowError(null)
  }

  const handleTakeNowChange = (batchId: number | null, raw: string) => {
    updateTakeNow(batchId, raw)
    setRowError(null)
  }

  const handleRowTakeNowAll = (row: StockLotRow) => {
    const allocated = toNonNegativeInt(row.allocated)
    if (Number.isNaN(allocated)) return
    handleTakeNowChange(row.StorageManagerBatchID, String(allocated))
  }

  const handleRowTakeNowLater = (row: StockLotRow) => {
    handleTakeNowChange(row.StorageManagerBatchID, "0")
  }

  const validateAllocations = (): string | null => {
    for (const row of rows) {
      const value = toNonNegativeInt(row.allocated)
      if (Number.isNaN(value)) {
        return `Quantity must be a whole number for batch ${renderDot(row)}`
      }
      if (row.StorageManagerBatchID !== null && value > row.availableQty) {
        return `Quantity for batch ${renderDot(row)} exceeds its available stock (${row.availableQty})`
      }

      const takeNow = toNonNegativeInt(row.takeNow)
      if (Number.isNaN(takeNow)) {
        return `Take now must be a whole number for batch ${renderDot(row)}`
      }
      if (takeNow > value) {
        return `Take now for batch ${renderDot(row)} cannot exceed its allocated quantity (${value})`
      }
    }
    if (allocatedTotal <= 0) {
      return `Allocate at least one ${category === "battery" ? "battery" : "tyre"}`
    }
    return null
  }

  const buildAllocations = (): StorageAllocationInput[] => {
    const allocations: StorageAllocationInput[] = []
    for (const row of rows) {
      const value = toNonNegativeInt(row.allocated)
      if (value > 0) {
        const takeNow = toNonNegativeInt(row.takeNow)
        allocations.push({
          StorageManagerID: row.StorageManagerID,
          StorageManagerBatchID: row.StorageManagerBatchID,
          Qty: value,
          TakeNowQty: Number.isNaN(takeNow) ? 0 : takeNow,
        })
      }
    }
    return allocations
  }

  const handleConfirm = () => {
    const validationError = validateAllocations()
    if (validationError) {
      setRowError(validationError)
      return
    }

    const allocations = buildAllocations()

    if (isUsingNewerLotWhileOlderAvailable(rows)) {
      setShowNewerStockWarning(true)
      return
    }

    onConfirm(allocations)
  }

  const handleWarningDismiss = () => {
    setShowNewerStockWarning(false)
  }

  const handleWarningContinue = () => {
    setShowNewerStockWarning(false)
    onConfirm(buildAllocations())
  }

  return (
    <>
      <AppModal
        isOpen={isOpen}
        title={displayLabel ? `Quantity Select - ${displayLabel}` : "Quantity Select"}
        onClose={onClose}
      >
      <div className="stock-allocation-modal">
        {loading ? (
          <p className="secondary-text">Loading stock batches...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>{category === "battery" ? "Batch / Expiry" : "DOT"}</th>
                    <th>Location</th>
                    <th>Available</th>
                    <th>Qty</th>
                    <th>Take Now</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.StorageManagerBatchID ?? "auto"}>
                      <td>
                        {row.StorageManagerBatchID === null ? (
                          <span className="secondary-text">Auto</span>
                        ) : (
                          <span className="dot-badge">{renderDot(row)}</span>
                        )}
                      </td>
                      <td>
                        {row.StorageManagerBatchID === null ? (
                          <span className="secondary-text">{category === "battery" ? "Auto (FEFO)" : "Auto (FIFO)"}</span>
                        ) : (
                          row.locationName
                        )}
                      </td>
                      <td>
                        {row.StorageManagerBatchID === null ? (
                          <span className="secondary-text">Auto (FIFO)</span>
                        ) : (
                          remainingAvailableQty(row)
                        )}
                      </td>
                      <td>
                        <input
                          className="text-input stock-allocation-qty"
                          type="text"
                          inputMode="numeric"
                          value={row.allocated}
                          onChange={(event) =>
                            handleAllocatedChange(row.StorageManagerBatchID, event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <div className="stock-take-now-cell">
                          <input
                            className="text-input stock-allocation-qty"
                            type="text"
                            inputMode="numeric"
                            value={row.takeNow}
                            onChange={(event) =>
                              handleTakeNowChange(row.StorageManagerBatchID, event.target.value)
                            }
                            aria-label={`Take now for ${renderDot(row)}`}
                          />
                          <div className="stock-take-now-quick">
                            <button
                              type="button"
                              className="stock-take-now-quick-button"
                              onClick={() => handleRowTakeNowAll(row)}
                              disabled={toNonNegativeInt(row.allocated) === 0}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              className="stock-take-now-quick-button"
                              onClick={() => handleRowTakeNowLater(row)}
                              disabled={toNonNegativeInt(row.takeNow) === 0}
                            >
                              Later
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="secondary-text">
                        No stock batches found for this tyre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="qty-manager-totals">
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Stock Available</span>
                <strong className="qty-manager-total-value">
                  {Math.max(totalQty - allocatedTotal, 0)}
                </strong>
              </div>
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Allocated</span>
                <strong
                  className={`qty-manager-total-value ${allocatedTotal <= 0 ? "qty-manager-total-shortfall" : ""}`}
                >
                  {allocatedTotal}
                </strong>
              </div>
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Take Now</span>
                <strong className="qty-manager-total-value">{takeNowTotal}</strong>
              </div>
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Later</span>
                <strong className="qty-manager-total-value">
                  {Math.max(allocatedTotal - takeNowTotal, 0)}
                </strong>
              </div>
            </div>

            {rowError && <p className="text-danger">{rowError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="primary-action"
                onClick={handleConfirm}
                disabled={loading}
              >
                Confirm
              </button>
              <button type="button" className="secondary-action" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </AppModal>

      <NewerStockWarningModal
        isOpen={showNewerStockWarning}
        onCancel={handleWarningDismiss}
        onConfirm={handleWarningContinue}
      />
  </>
  )
}