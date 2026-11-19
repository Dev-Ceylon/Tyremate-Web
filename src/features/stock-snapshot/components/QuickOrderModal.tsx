import { useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import { SupplierList } from "../../tyre-suppliers/components/SupplierList"
import type { StockSnapshotRecord } from "../models/stockSnapshot"
import type { TyreSupplier } from "../../tyre-suppliers/models/tyreSupplier"

type QuickOrderModalProps = {
  isOpen: boolean
  onClose: () => void
  tyre: StockSnapshotRecord | null
  onCreateOrder: (orderData: QuickOrderData) => void
}

export interface QuickOrderData {
  tyreId: number
  supplierId: number | string
  selectedSupplier: TyreSupplier
  quantity: number
}

export function QuickOrderModal({
  isOpen,
  onClose,
  tyre,
  onCreateOrder,
}: QuickOrderModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<TyreSupplier | null>(null)
  const [quantity, setQuantity] = useState(1)

  const handleCreateOrder = () => {
    if (!tyre || !selectedSupplier) {
      alert("Please select a supplier")
      return
    }

    const orderData: QuickOrderData = {
      tyreId: tyre.TyreID,
      supplierId: selectedSupplier.supplierId,
      selectedSupplier,
      quantity,
    }

    onCreateOrder(orderData)
    handleClose()
  }

  const handleClose = () => {
    setSelectedSupplier(null)
    setQuantity(1)
    onClose()
  }

  return (
    <AppModal isOpen={isOpen} title="Create Order" onClose={handleClose}>
      {tyre && (
        <div className="quick-order-modal-content">
          <div className="order-modal-tyre-info">
            <h4>{tyre.Size} - {tyre.Pattern}</h4>
            <div className="order-modal-metrics">
              <div>
                <label>Available:</label>
                <strong>{tyre.AvailableToSellQty}</strong>
              </div>
              <div>
                <label>On Hand:</label>
                <strong>{tyre.OnHandQty}</strong>
              </div>
              <div>
                <label>Current Supplier:</label>
                <span>{tyre.SupplierCodes || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="order-modal-suppliers-section">
            <h5>Select Supplier:</h5>
            <SupplierList
              tyreId={tyre.TyreID}
              onSelect={setSelectedSupplier}
              isSelectable={true}
            />
          </div>

          {selectedSupplier && (
            <div className="order-modal-quantity-section">
              <label htmlFor="order-quantity">Order Quantity:</label>
              <input
                id="order-quantity"
                type="text"
                inputMode="numeric"
                defaultValue={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? 1 : Math.max(1, Number(e.target.value)))}
              />
              <small>Available from supplier: {selectedSupplier.quantity}</small>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="primary-action"
              onClick={handleCreateOrder}
              disabled={!selectedSupplier}
            >
              Create Order
            </button>
            <button type="button" className="secondary-action" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppModal>
  )
}