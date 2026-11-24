import { useState, useEffect } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import { LoadingState } from "../../../shared/ui/progress"
import type { TyreSupplierApiRecord } from "../../tyre-suppliers/models/tyreSupplier"
import type { PurchaseOrderLineSupplier } from "../hooks/usePurchaseOrderForm"
import { v4 as uuidv4 } from "uuid"

interface SupplierSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  tyreId?: number
  batteryId?: number
  itemId?: number
  category?: 'tyre' | 'battery'
  tyreLabel?: string
  itemLabel?: string
  lineQty: number
  existingSuppliers: PurchaseOrderLineSupplier[]
  onConfirm: (suppliers: PurchaseOrderLineSupplier[]) => void
}

export function SupplierSelectionModal({
  isOpen,
  onClose,
  tyreId,
  batteryId,
  itemId,
  category = "tyre",
  tyreLabel,
  itemLabel,
  lineQty,
  existingSuppliers,
  onConfirm,
}: SupplierSelectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [allocations, setAllocations] = useState<Record<number, number>>({})
  const [prices, setPrices] = useState<Record<number, number>>({})
  const [discounts, setDiscounts] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)

  const effectiveItemId = itemId || (category === "battery" ? batteryId : tyreId) || 0
  const effectiveLabel = itemLabel || tyreLabel || (category === "battery" ? "Selected Battery" : "Selected Tyre")

  useEffect(() => {
    if (isOpen && effectiveItemId) {
      loadSuppliers(effectiveItemId)
      const initialQty: Record<number, number> = {}
      const initialPrices: Record<number, number> = {}
      const initialDiscounts: Record<number, number> = {}
      existingSuppliers.forEach((s) => {
        initialQty[s.SupplierID] = s.Qty
        initialPrices[s.SupplierID] = s.Price
        initialDiscounts[s.SupplierID] = s.Discount
      })
      setAllocations(initialQty)
      setPrices(initialPrices)
      setDiscounts(initialDiscounts)
    }
  }, [isOpen, effectiveItemId, existingSuppliers])

  const loadSuppliers = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const data =
        category === "battery"
          ? await window.api.batterySuppliers.getSuppliersByBatteryId(id)
          : await window.api.tyreSuppliers.getSuppliersByTyreId(id)
      setSuppliers(data || [])
      setPrices((prev) => {
        const merged = { ...prev }
        ;(data || []).forEach((s: any) => {
          const sId = Number(s.SupplierID)
          if (!merged[sId] && s.Price) {
            merged[sId] = Number(s.Price)
          }
        })
        return merged
      })
    } catch (err: any) {
      setError("Failed to load suppliers")
    } finally {
      setLoading(false)
    }
  }

  const handleQtyChange = (supplierId: number, qty: number) => {
    setAllocations((prev) => ({
      ...prev,
      [supplierId]: Math.max(0, qty),
    }))

    if (qty > 0 && !prices[supplierId]) {
      const supplier = suppliers.find((s) => Number(s.SupplierID) === supplierId)
      if (supplier?.Price) {
        setPrices((prev) => ({
          ...prev,
          [supplierId]: Number(supplier.Price),
        }))
      }
    }
  }

  const handlePriceChange = (supplierId: number, price: number) => {
    setPrices((prev) => ({
      ...prev,
      [supplierId]: Math.max(0, price),
    }))
  }

  const handleDiscountChange = (supplierId: number, discount: number) => {
    setDiscounts((prev) => ({
      ...prev,
      [supplierId]: Math.min(100, Math.max(0, discount)),
    }))
  }

  const totalAllocated = Object.values(allocations).reduce((sum, q) => sum + q, 0)
  const remainder = lineQty - totalAllocated
  const isOverAllocated = totalAllocated > lineQty

  const handleConfirm = () => {
    if (totalAllocated > lineQty) {
      return
    }

    const selected: PurchaseOrderLineSupplier[] = Object.entries(allocations)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => {
        const sId = Number(idStr)
        const sInfo = suppliers.find((s) => Number(s.SupplierID) === sId)
        return {
          id: uuidv4(),
          SupplierID: sId,
          SupplierName: sInfo?.Name || `Supplier #${sId}`,
          Qty: qty,
          Price: prices[sId] || 0,
          Discount: discounts[sId] || 0,
        }
      })

    onConfirm(selected)
    onClose()
  }

  return (
    <AppModal isOpen={isOpen} title="Manage Supplier Allocations" onClose={onClose}>
      <div className="quick-order-modal-content">
        <div className="order-modal-tyre-info">
          <h4>{effectiveLabel}</h4>
          <div className="order-modal-metrics">
            <div>
              <label>Target Line Qty:</label>
              <strong>{lineQty}</strong>
            </div>
            <div>
              <label>Total Allocated:</label>
              <strong
                className={
                  totalAllocated > lineQty
                    ? "order-modal-metric-value-over"
                    : "order-modal-metric-value-ok"
                }
              >
                {totalAllocated}
              </strong>
            </div>
            <div>
              <label>Remainder Needed:</label>
              <strong
                className={
                  isOverAllocated
                    ? "order-modal-metric-value-over"
                    : remainder === 0
                      ? "order-modal-metric-value-match"
                      : "order-modal-metric-value-ok"
                }
              >
                {isOverAllocated ? `Over by ${-remainder}` : remainder}
              </strong>
            </div>
          </div>
          {isOverAllocated && (
            <p className="supplier-list-error supplier-list-error-inline">
              Total allocated ({totalAllocated}) exceeds line quantity ({lineQty}) by {totalAllocated - lineQty}. Reduce supplier quantities below to continue.
            </p>
          )}
        </div>

        <div className="supplier-list-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <LoadingState message="Fetching available suppliers…" />
          ) : error ? (
            <p className="supplier-list-error">{error}</p>
          ) : suppliers.length === 0 ? (
            <p className="supplier-list-empty">No suppliers found for this item.</p>
          ) : (
            <div className="tm-table-scroll">
              <table className="supplier-list-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Discount (%)</th>
                    <th>Stock</th>
                    <th style={{ width: '120px' }}>PO Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => {
                    const sId = Number(s.SupplierID)
                    return (
                      <tr key={sId}>
                        <td>
                          <strong>{s.Name}</strong>
                          <br />
                          <small className="secondary-text">{s.Contact || '-'}</small>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="text-input"
                            inputMode="decimal"
                            value={prices[sId] || ""}
                            placeholder="0.00"
                            onChange={(e) => handlePriceChange(sId, e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="text-input"
                            inputMode="decimal"
                            value={discounts[sId] || ""}
                            placeholder="0.00"
                            style={{ width: "80px" }}
                            onChange={(e) => handleDiscountChange(sId, e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </td>
                        <td>{s.AvailableQuantity ?? s.Quantity ?? 0}</td>
                        <td>
                          <input
                            type="text"
                            className="text-input"
                            inputMode="numeric"
                            value={allocations[sId] || 0}
                            onChange={(e) => handleQtyChange(sId, e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="primary-action" onClick={handleConfirm} disabled={loading || isOverAllocated}>
            Update Allocations
          </button>
          <button type="button" className="secondary-action" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </AppModal>
  )
}