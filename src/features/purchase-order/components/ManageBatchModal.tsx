import { AppModal } from "../../../shared/ui/modal/AppModal"
import { useManageBatch } from "../hooks/useManageBatch"
import { saveButtonLabel } from "../../../shared/ui/saveButtonLabel"

type ManageBatchModalProps = {
  isOpen: boolean
  poTyresId: number | null
  tyreLabel: string
  lineQty: number
  isBattery?: boolean
  onClose: () => void
  onSaved: () => void
}

export function ManageBatchModal({
  isOpen,
  poTyresId,
  tyreLabel,
  lineQty,
  isBattery = false,
  onClose,
  onSaved,
}: ManageBatchModalProps) {
  const {
    drafts,
    loading,
    saving,
    error,
    allocatedTotal,
    validationError,
    dotErrors,
    actions,
  } = useManageBatch({
    isOpen,
    poTyresId,
    lineQty,
    isBattery,
    onSaved,
  })

  return (
    <AppModal
      isOpen={isOpen}
      title={tyreLabel ? `Manage Batch - ${tyreLabel}` : "Manage Batch"}
      onClose={onClose}
    >
      <div className="stock-allocation-modal">
        {loading ? (
          <p className="secondary-text">Loading batches...</p>
        ) : (
          <>
            <div className="table-scroll">
              {isBattery ? (
                <p className="secondary-text batch-dot-hint">
                  Batch Code: Enter the manufacturing batch or lot code.
                </p>
              ) : (
                <p className="secondary-text batch-dot-hint">
                  DOT format: <strong>WWYY</strong> — 2-digit week (01–53) + 2-digit year (e.g.{" "}
                  <strong>2526</strong> = week 25 of 2026).
                </p>
              )}
              <div className="tm-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th className="text-right">#</th>
                      <th>{isBattery ? "Batch Code" : "DOT"}</th>
                      <th className="text-right">Qty</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="secondary-text">
                          {isBattery
                            ? "No batches entered yet. Add a batch code for incoming battery items."
                            : "No batches entered yet. Add a batch for each DOT the supplier will send."}
                        </td>
                      </tr>
                    )}
                    {drafts.map((draft, index) => {
                      const dotError = dotErrors[draft.localId]
                      return (
                        <tr key={draft.localId}>
                          <td className="text-right secondary-text">{index + 1}</td>
                          <td>
                            <input
                              className="text-input"
                              type="text"
                              inputMode={isBattery ? "text" : "numeric"}
                              placeholder={isBattery ? "e.g. BATCH-2026-01" : "WWYY e.g. 2526"}
                              maxLength={isBattery ? 50 : 4}
                              value={draft.DOT}
                              onChange={(event) => actions.update(draft.localId, { DOT: event.target.value })}
                            />
                            {dotError && <span className="validation-error">{dotError}</span>}
                          </td>
                          <td>
                            <input
                              className="text-input"
                              type="text"
                              inputMode="numeric"
                              placeholder="Qty"
                              value={draft.Qty}
                              onChange={(event) => actions.update(draft.localId, { Qty: event.target.value })}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="secondary-action"
                              onClick={() => actions.removeRow(draft.localId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-action" onClick={actions.addRow}>
                Add Batch
              </button>
            </div>

            <div className="qty-manager-totals">
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Ordered Qty</span>
                <strong className="qty-manager-total-value">{lineQty}</strong>
              </div>
              <div className="qty-manager-total-item">
                <span className="qty-manager-total-label">Batch Total</span>
                <strong
                  className={`qty-manager-total-value ${
                    drafts.length > 0 && allocatedTotal !== lineQty ? "qty-manager-total-shortfall" : ""
                  }`}
                >
                  {allocatedTotal}
                </strong>
              </div>
            </div>

            {validationError && <p className="text-danger">{validationError}</p>}

            {error && !validationError && <p className="text-danger">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="primary-action"
                onClick={actions.save}
                disabled={saving || loading || !!validationError}
              >
                {saveButtonLabel("batches", saving)}
              </button>
              <button type="button" className="secondary-action" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </AppModal>
  )
}