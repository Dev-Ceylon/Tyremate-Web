import { AppModal } from "../../../shared/ui/modal/AppModal"
import { useGoodsReceiptForm } from "../hooks/useGoodsReceiptForm"
import type { GoodsReceiptPayload } from "../models/goodsReceipt"

type PoGoodsReceiptModalProps = {
  isOpen: boolean
  poId: number
  category?: "tyre" | "battery"
  supplierAllocationId: number | null
  supplierName: string
  tyreLabel: string
  allocationQty: number
  receivedToDate: number
  locationName: string
  isSaving: boolean
  onClose: () => void
  onPost: (payload: GoodsReceiptPayload) => Promise<void>
}

export function PoGoodsReceiptModal({
  isOpen,
  poId,
  category,
  supplierAllocationId,
  supplierName,
  tyreLabel,
  allocationQty,
  receivedToDate,
  locationName,
  isSaving,
  onClose,
  onPost,
}: PoGoodsReceiptModalProps) {
  const isBattery = category === "battery"
  const {
    receiptDate,
    setReceiptDate,
    deliveryNoteNumber,
    setDeliveryNoteNumber,
    dispatchedQty,
    setDispatchedQty,
    damagedQty,
    setDamagedQty,
    discrepancyReason,
    setDiscrepancyReason,
    batches,
    validationMessage,
    receivedTotal,
    acceptedTotal,
    shortage,
    overReceipt,
    actions,
  } = useGoodsReceiptForm({
    isOpen,
    poId,
    category,
    supplierAllocationId,
    allocationQty,
    receivedToDate,
    locationName,
    onClose,
    onPost,
  })

  return (
    <AppModal
      isOpen={isOpen}
      title="Post Goods Receipt"
      onClose={onClose}
    >
      <div className="goods-receipt-modal">
        <header className="goods-receipt-heading">
          <div>
            <p className="goods-receipt-eyebrow">Purchase order receipt</p>
            <h2>{isBattery ? "Record delivered batteries" : "Record delivered tyres"}</h2>
            <p>{isBattery ? "Enter the delivery details, then reconcile each batch." : "Enter the delivery details, then reconcile each DOT batch."}</p>
          </div>
          <span className="goods-receipt-stamp">GRN</span>
        </header>

        <section className="goods-receipt-context" aria-label="Receipt allocation details">
          <div className="goods-receipt-tyre">
            <span className="goods-receipt-context-label">{isBattery ? "Battery line" : "Tyre line"}</span>
            <strong>{tyreLabel}</strong>
            <span>{supplierName}</span>
          </div>
          <div className="goods-receipt-location">
            <span className="goods-receipt-context-label">Receiving location</span>
            <strong>{locationName || "Not allocated"}</strong>
          </div>
        </section>

        <section className="goods-receipt-progress" aria-label="Allocation quantities">
          <div>
            <span>Supplier allocation</span>
            <strong>{allocationQty}</strong>
          </div>
          <div>
            <span>Previously received</span>
            <strong>{receivedToDate}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{Math.max(allocationQty - receivedToDate, 0)}</strong>
          </div>
        </section>

        <section className="goods-receipt-section">
          <div className="goods-receipt-section-heading">
            <div>
              <h3>Delivery details</h3>
              <p>Record the carrier document and delivery quantities.</p>
            </div>
          </div>
          <div className="goods-receipt-fields">
            <label className="goods-receipt-field">
              <span>Receipt date</span>
              <input className="text-input" type="date" value={receiptDate} onChange={(event) => setReceiptDate(event.target.value)} />
            </label>
            <label className="goods-receipt-field">
              <span>Delivery note</span>
              <input className="text-input" value={deliveryNoteNumber} onChange={(event) => setDeliveryNoteNumber(event.target.value)} placeholder="Supplier delivery note" />
            </label>
            <label className="goods-receipt-field">
              <span>Dispatched quantity</span>
              <input className="text-input" type="number" min="0" step="1" value={dispatchedQty} onChange={(event) => setDispatchedQty(event.target.value)} />
            </label>
            <label className="goods-receipt-field">
              <span>Damaged quantity</span>
              <input className="text-input" type="number" min="0" step="1" value={damagedQty} onChange={(event) => setDamagedQty(event.target.value)} />
            </label>
          </div>
        </section>

        <section className="goods-receipt-section goods-receipt-batches">
          <div className="goods-receipt-section-heading">
            <div>
              <h3>{isBattery ? "Batch breakdown" : "DOT batch breakdown"}</h3>
              <p>Accepted units are added to stock; rejected units stay out of inventory.</p>
            </div>
            <button type="button" className="secondary-action" onClick={actions.addBatch}>Add batch</button>
          </div>
          <div className="table-scroll goods-receipt-batch-scroll">
            <table className="product-table goods-receipt-batch-table">
              <thead>
                <tr>
                  <th>{isBattery ? "Batch code" : "DOT code"}</th>
                  <th>Received</th>
                  <th>Accepted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.key}>
                    <td>
                      <input className="text-input" value={batch.DOT} onChange={(event) => actions.updateBatch(batch.key, { DOT: event.target.value })} placeholder={isBattery ? "Batch code / Lot #" : "DOT code"} />
                    </td>
                    <td>
                      <input className="text-input" type="number" min="0" value={batch.ReceivedQty} onChange={(event) => actions.updateBatch(batch.key, { ReceivedQty: event.target.value })} />
                    </td>
                    <td>
                      <input className="text-input" type="number" min="0" value={batch.AcceptedQty} onChange={(event) => actions.updateBatch(batch.key, { AcceptedQty: event.target.value })} />
                    </td>
                    <td>
                      <button type="button" className="secondary-action" onClick={() => actions.removeBatch(batch.key)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="goods-receipt-reconciliation">
            <div><span>Received</span><strong>{receivedTotal}</strong></div>
            <div><span>Accepted</span><strong>{acceptedTotal}</strong></div>
            <div><span>Shortage</span><strong>{shortage}</strong></div>
            <div><span>Over-receipt</span><strong>{overReceipt}</strong></div>
          </div>
        </section>

        <label className="goods-receipt-field goods-receipt-reason">
          <span>Discrepancy reason</span>
          <textarea className="text-input" rows={2} value={discrepancyReason} onChange={(event) => setDiscrepancyReason(event.target.value)} placeholder={isBattery ? "Describe any quantity difference or damage to batteries" : "Describe any quantity difference or damage"} />
        </label>

        {validationMessage && <div className="goods-receipt-error" role="alert">{validationMessage}</div>}
        <footer className="goods-receipt-actions">
          <button type="button" className="secondary-action" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="primary-action" onClick={actions.submit} disabled={isSaving}>{isSaving ? "Posting..." : "Post GRN"}</button>
        </footer>
      </div>
    </AppModal>
  )
}
