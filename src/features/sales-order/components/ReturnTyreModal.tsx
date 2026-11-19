import { useCallback, useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import { SALES_RETURN_TYPE_CODES, SALES_RETURN_TYPE_OPTIONS, type SalesReturnTypeCode } from "../../sales-return/constants/salesReturnTypeConstants"
import type { SoTyreRecord } from "../models/salesOrder"
import { useTyreReturnAllocations } from "../hooks/useTyreReturnAllocations"

interface ReturnTyreModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: Array<{
    allocationId: number
    storageManagerId: number | null
    storageManagerBatchId: number | null
    dot: string | null
    locationName: string | null
    allocatedQty: number
    alreadyReturned: number
    returnQty: number
  }>, reason?: string, returnType?: SalesReturnTypeCode) => void
  tyre: SoTyreRecord | null
  maxReturnQty: number
  submitting?: boolean
}

export function ReturnTyreModal({
  isOpen,
  onClose,
  onConfirm,
  tyre,
  maxReturnQty,
  submitting = false,
}: ReturnTyreModalProps) {
  const [returnType, setReturnType] = useState<SalesReturnTypeCode>(SALES_RETURN_TYPE_CODES.UNUSED)
  const {
    allocations,
    returnItems,
    loading,
    error,
    reason,
    setReason,
    updateReturnQty,
    validateAndGetItems,
  } = useTyreReturnAllocations({
    tyreId: tyre?.ID ?? null,
    isOpen,
    maxReturnQty,
  })

  const handleConfirmClick = useCallback(() => {
    const itemsToReturn = validateAndGetItems()
    if (!itemsToReturn) return
    onConfirm(itemsToReturn, reason.trim() === "" ? undefined : reason.trim(), returnType)
  }, [validateAndGetItems, reason, returnType, onConfirm])

  if (!tyre) return null

  return (
    <AppModal isOpen={isOpen} title={`Return Tyre: ${tyre.Brand} / ${tyre.Size} - ${tyre.Pattern}`} onClose={onClose}>
      <div className="quick-order-modal-content">
        <div className="login-form">
          <div className="details-summary details-summary-full">
            <div className="summary-item">
              <span className="label">Tyre:</span>
              <span className="value">{tyre.Brand} / {tyre.Size} - {tyre.Pattern}</span>
            </div>
            <div className="summary-item">
              <span className="label">Original Qty:</span>
              <span className="value">{tyre.Qty}</span>
            </div>
            <div className="summary-item">
              <span className="label">Max Return Qty:</span>
              <span className="value">{maxReturnQty}</span>
            </div>
          </div>

          {loading ? (
            <p className="secondary-text">Loading allocations...</p>
          ) : allocations.length === 0 ? (
            <p className="error-text">No stock allocations found for this tyre line.</p>
          ) : (
            <>
              <label className="field-label login-form-full-span">
                Return Type
                <select className="text-input" value={returnType} onChange={(e) => setReturnType(e.target.value as SalesReturnTypeCode)} disabled={submitting}>
                  {SALES_RETURN_TYPE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="table-scroll table-scroll-max-h">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>DOT / Batch</th>
                      <th className="text-right">Allocated</th>
                      <th className="text-right">Already Returned</th>
                      <th className="text-right">Can Return</th>
                      <th className="text-right">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, index) => (
                      <tr key={item.allocationId}>
                        <td>{item.locationName || "N/A"}</td>
                        <td>{item.dot || "-"}</td>
                        <td className="text-right">{item.allocatedQty}</td>
                        <td className="text-right">{item.alreadyReturned}</td>
                        <td className="text-right">{item.allocatedQty - item.alreadyReturned}</td>
                        <td className="text-right">
                          <input
                            className="text-input delivery-qty-input"
                            type="number"
                            min={0}
                            max={item.allocatedQty - item.alreadyReturned}
                            value={item.returnQty}
                            onChange={(e) => updateReturnQty(index, Number(e.target.value) || 0)}
                            disabled={submitting || (item.allocatedQty - item.alreadyReturned) <= 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="field-label login-form-full-span">
                Reason for Return (Optional)
                <textarea
                  className="text-input"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                />
              </label>

              {error && <p className="error-text login-form-full-span">{error}</p>}
            </>
          )}
        </div>

        <div className="modal-actions modal-actions-mt">
          <button
            type="button"
            className="primary-action"
            onClick={handleConfirmClick}
            disabled={submitting || loading}
          >
            {submitting ? "Returning..." : "Confirm Return"}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={submitting || loading}>
            Cancel
          </button>
        </div>
      </div>
    </AppModal>
  )
}
