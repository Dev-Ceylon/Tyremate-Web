import { AppModal } from "../../../shared/ui/modal/AppModal"
import { useDagGoodsReceiptForm } from "../hooks/useDagGoodsReceiptForm"
import { formatTyreLabel } from "../../../shared/tyre/models/tyreDisplay"
import type { DagGoodsReceiptPayload, PendingDagGoodsReceiptRecord } from "../models/goodsReceipt"

type DagGoodsReceiptModalProps = {
  isOpen: boolean
  pending: PendingDagGoodsReceiptRecord
  isSaving: boolean
  onClose: () => void
  onPost: (payload: DagGoodsReceiptPayload) => Promise<void>
}

export function DagGoodsReceiptModal({ isOpen, pending, isSaving, onClose, onPost }: DagGoodsReceiptModalProps) {
  const {
    receiptDate,
    setReceiptDate,
    deliveryNoteNumber,
    setDeliveryNoteNumber,
    dispatchedQty,
    setDispatchedQty,
    receivedQty,
    setReceivedQty,
    acceptedQty,
    setAcceptedQty,
    damagedQty,
    setDamagedQty,
    discrepancyReason,
    setDiscrepancyReason,
    validationMessage,
    acceptedTotal,
    rejectedTotal,
    shortage,
    overReceipt,
    actions,
  } = useDagGoodsReceiptForm({ isOpen, pending, onClose, onPost })

  return (
    <AppModal isOpen={isOpen} title="Post Goods Receipt" onClose={onClose}>
      <div className="goods-receipt-modal">
        <header className="goods-receipt-heading">
          <div>
            <p className="goods-receipt-eyebrow">DAG receipt</p>
            <h2>Receive tyres from quarantine</h2>
            <p>Enter the delivery details, then reconcile the received quantity.</p>
          </div>
          <span className="goods-receipt-stamp">GRN</span>
        </header>

        <section className="goods-receipt-context" aria-label="Receipt details">
          <div className="goods-receipt-tyre">
            <span className="goods-receipt-context-label">Tyre line</span>
            <strong>{formatTyreLabel(pending)}</strong>
            <span>DAG #{pending.DAGID}{pending.CustomerName ? ` \u00b7 ${pending.CustomerName}` : ""}</span>
          </div>
          <div className="goods-receipt-location">
            <span className="goods-receipt-context-label">Receiving location</span>
            <strong>{pending.DestinationLocationName ?? "Not available"}</strong>
            {pending.QuarantineLocationName && (
              <span>From {pending.QuarantineLocationName}</span>
            )}
          </div>
        </section>

        <section className="goods-receipt-progress" aria-label="Quarantine quantities">
          <div>
            <span>In quarantine</span>
            <strong>{pending.PendingQty}</strong>
          </div>
          <div>
            <span>Accepted</span>
            <strong>{acceptedTotal}</strong>
          </div>
          <div>
            <span>Remaining in quarantine</span>
            <strong>{Math.max(pending.PendingQty - acceptedTotal, 0)}</strong>
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
              <input className="text-input" value={deliveryNoteNumber} onChange={(event) => setDeliveryNoteNumber(event.target.value)} placeholder="Carrier delivery note" />
            </label>
            <label className="goods-receipt-field">
              <span>Dispatched quantity</span>
              <input className="text-input" type="number" min="0" value={dispatchedQty} onChange={(event) => setDispatchedQty(event.target.value)} />
            </label>
            <label className="goods-receipt-field">
              <span>Received quantity</span>
              <input className="text-input" type="number" min="1" value={receivedQty} onChange={(event) => setReceivedQty(event.target.value)} />
            </label>
            <label className="goods-receipt-field">
              <span>Accepted quantity</span>
              <input className="text-input" type="number" min="0" value={acceptedQty} onChange={(event) => setAcceptedQty(event.target.value)} />
            </label>
            <label className="goods-receipt-field">
              <span>Damaged quantity</span>
              <input className="text-input" type="number" min="0" value={damagedQty} onChange={(event) => setDamagedQty(event.target.value)} />
            </label>
          </div>
          <div className="goods-receipt-reconciliation">
            <div><span>Accepted</span><strong>{acceptedTotal}</strong></div>
            <div><span>Rejected</span><strong>{rejectedTotal}</strong></div>
            <div><span>Shortage</span><strong>{shortage}</strong></div>
            <div><span>Over-receipt</span><strong>{overReceipt}</strong></div>
          </div>
        </section>

        <label className="goods-receipt-field goods-receipt-reason">
          <span>Discrepancy reason</span>
          <textarea className="text-input" rows={2} value={discrepancyReason} onChange={(event) => setDiscrepancyReason(event.target.value)} placeholder="Describe any quantity difference or damage" />
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
