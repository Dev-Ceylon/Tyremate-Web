import { useEffect, useMemo, useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { RecordSoDeliveryPayload, SoDeliveryProgress } from "../models/delivery"

interface RecordDeliveryModalProps {
  isOpen: boolean
  progress: SoDeliveryProgress | null
  onClose: () => void
  onConfirm: (payload: RecordSoDeliveryPayload) => void
  submitting?: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Lets the user hand over the tyres still to collect for a sales order. Only
 * lots with a positive remaining quantity are shown, and each quantity is
 * capped at what that lot still has left.
 */
export function RecordDeliveryModal({
  isOpen,
  progress,
  onClose,
  onConfirm,
  submitting = false,
}: RecordDeliveryModalProps) {
  const [qtyByAllocation, setQtyByAllocation] = useState<Record<number, number>>({})
  const [deliveryDate, setDeliveryDate] = useState(today())
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQtyByAllocation({})
      setDeliveryDate(today())
      setNotes("")
      setError(null)
    }
  }, [isOpen])

  const collectableLines = useMemo(
    () =>
      (progress?.Lines ?? []).filter((line) =>
        line.Allocations.some((allocation) => allocation.RemainingQty > 0),
      ),
    [progress],
  )

  const setQty = (allocationId: number, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 0))
    setQtyByAllocation((current) => {
      if (clamped <= 0) {
        const next = { ...current }
        delete next[allocationId]
        return next
      }
      return { ...current, [allocationId]: clamped }
    })
  }

  const lines = useMemo(() => {
    const built: RecordSoDeliveryPayload["Lines"] = []

    collectableLines.forEach((line) => {
      line.Allocations.forEach((allocation) => {
        const qty = qtyByAllocation[allocation.AllocationID] ?? 0
        if (qty > 0) {
          built.push({ SoTyreStorageAllocationID: allocation.AllocationID, Qty: qty })
        }
      })
    })

    return built
  }, [collectableLines, qtyByAllocation])

  const handleConfirm = () => {
    if (lines.length === 0) {
      setError("Select at least one tyre quantity to hand over.")
      return
    }
    if (!deliveryDate) {
      setError("Delivery date is required.")
      return
    }
    setError(null)
    onConfirm({
      Lines: lines,
      DeliveryDate: deliveryDate,
      Notes: notes.trim(),
    })
  }

  return (
    <AppModal isOpen={isOpen} title="Record Delivery" onClose={onClose}>
      <div className="quick-order-modal-content">
        {collectableLines.length === 0 ? (
          <p className="secondary-text">Nothing is currently collectable for this order.</p>
        ) : (
          <>
            <div className="login-form" style={{ marginBottom: "1rem" }}>
              <label className="field-label">
                Delivery Date
                <input
                  className="text-input"
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  disabled={submitting}
                />
              </label>
              <label className="field-label login-form-full-span">
                Notes (Optional)
                <textarea
                  className="text-input"
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="delivery-pick-list">
              {collectableLines.map((line) => (
                <div key={line.SoTyreID} className="delivery-pick-line">
                  <div className="delivery-pick-line-header">
                    <span className="font-medium">
                      {line.Brand || "NA"} / {line.Size || "NA"} - {line.Pattern || "NA"}
                    </span>
                    <span className="stat-badge">Still to collect {line.RemainingToCollect}</span>
                  </div>
                  <div className="table-scroll">
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>Location</th>
                          <th>DOT</th>
                          <th className="text-right">Remaining</th>
                          <th className="text-right">Deliver Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {line.Allocations.map((allocation) => (
                          <tr key={allocation.AllocationID}>
                            <td>{allocation.LocationName || "NA"}</td>
                            <td>{allocation.DOT || "-"}</td>
                            <td className="text-right">{allocation.RemainingQty}</td>
                            <td className="text-right">
                              {allocation.RemainingQty > 0 ? (
                                <input
                                  className="text-input delivery-qty-input"
                                  type="number"
                                  min={0}
                                  max={allocation.RemainingQty}
                                  value={qtyByAllocation[allocation.AllocationID] ?? 0}
                                  onChange={(event) =>
                                    setQty(
                                      allocation.AllocationID,
                                      Number(event.target.value),
                                      allocation.RemainingQty,
                                    )
                                  }
                                  disabled={submitting}
                                />
                              ) : (
                                <span className="secondary-text">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}
          </>
        )}

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button
            type="button"
            className="primary-action"
            onClick={handleConfirm}
            disabled={submitting || lines.length === 0}
          >
            {submitting ? "Saving..." : "Confirm Delivery"}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </AppModal>
  )
}
