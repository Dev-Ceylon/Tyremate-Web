import React, { useMemo } from "react"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type {
  PurchaseOrderFormData,
  PurchaseOrderLine,
} from "../hooks/usePurchaseOrderForm"
import { saveButtonLabel } from "../../../shared/ui/saveButtonLabel"

interface PurchaseOrderFormProps {
  state: {
    formData: PurchaseOrderFormData
    lines: PurchaseOrderLine[]
    tyres: TyreRecord[]
    submitting: boolean
    initializing?: boolean
    error?: string | null
  }
  actions: {
    onChangeDate: (val: string) => void
    onAddLine: () => void
    onRemoveLine: (id: string) => void
    onUpdateLine: (id: string, field: keyof PurchaseOrderLine, value: any) => void
    onOpenSupplierModal: (lineId: string) => void
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
  }
  onOpenCreateTyre?: () => void
  onCancel?: () => void
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ state, actions, onOpenCreateTyre, onCancel }) => {
  const totals = useMemo(() => {
    const subtotal = state.lines.reduce((sum, line) => sum + line.Price * line.Qty, 0)
    const totalDiscount = state.lines.reduce(
      (sum, line) => sum + (line.Price * line.Qty * line.Discount) / 100,
      0
    )
    const netTotal = subtotal - totalDiscount
    return { subtotal, totalDiscount, netTotal }
  }, [state.lines])

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
      return
    }
    actions.onCancel()
  }

  return (
    <form className="po-form" onSubmit={actions.onSubmit}>
      <label className="field-label">
        PO Date
        <span className="so-date-text">{state.formData.Date}</span>
      </label>

      <div className="header-actions po-form-full-span">
        <button
          className="secondary-action"
          type="button"
          onClick={actions.onAddLine}
          disabled={state.submitting}
        >
          Add Line Item
        </button>
        {onOpenCreateTyre && (
          <button
            className="secondary-action"
            type="button"
            onClick={onOpenCreateTyre}
            disabled={state.submitting}
          >
            Create New Tyre
          </button>
        )}
      </div>

      <div className="table-scroll table-scroll-wide po-form-full-span">
        <table className="product-table">
          <thead>
            <tr>
              <th>Tyre</th>
              <th>Qty</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => (
              <React.Fragment key={line.id}>
                <tr>
                  <td>
                    <select
                      className="text-input"
                      value={line.TyreID}
                      onChange={(e) => actions.onUpdateLine(line.id, "TyreID", Number(e.target.value))}
                      disabled={state.submitting}
                      required
                    >
                      <option value="">Select tyre</option>
                      {state.tyres.map((t) => (
                        <option key={t.Id} value={t.Id}>
                          {t.Brand} / {t.Size} / {t.Pattern}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="numeric"
                      value={line.Qty}
                      onChange={(e) => actions.onUpdateLine(line.id, "Qty", e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      className="secondary-action table-action"
                      type="button"
                      onClick={() => actions.onRemoveLine(line.id)}
                      disabled={state.submitting}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                <tr className="supplier-allocation-row">
                  <td colSpan={3} className="nested-table-cell">
                    <div className="header-actions nested-table-header">
                      <div>
                        <p className="section-label">Supplier Allocations</p>
                        {line.TyreID === 0 && (
                          <small className="secondary-text">Select a tyre to enable allocation</small>
                        )}
                      </div>
                      <button
                        className="secondary-action table-action"
                        type="button"
                        onClick={() => actions.onOpenSupplierModal(line.id)}
                        disabled={state.submitting || line.TyreID === 0}
                      >
                        Manage Suppliers
                      </button>
                    </div>
                    {line.Suppliers.length > 0 && (
                      <div className="tm-table-scroll">
                        <table className="product-table nested-product-table">
                          <thead>
                            <tr>
                              <th>Supplier Name</th>
                              <th className="text-center">Price</th>
                              <th className="text-center">Discount</th>
                              <th className="text-center">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {line.Suppliers.map((s) => (
                              <tr key={s.id}>
                                <td>{s.SupplierName || `ID: ${s.SupplierID}`}</td>
                                <td className="text-center">{s.Price > 0 ? `$${s.Price.toFixed(2)}` : '-'}</td>
                                <td className="text-center">{s.Discount > 0 ? `${s.Discount}%` : '-'}</td>
                                <td className="text-center">{s.Qty}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="po-form-summary po-form-full-span">
        <div className="po-form-summary-row">
          <span className="po-form-summary-key">Subtotal</span>
          <span className="po-form-summary-val">${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="po-form-summary-row">
          <span className="po-form-summary-key">Applied Discounts</span>
          <span className="po-form-summary-val">-${totals.totalDiscount.toFixed(2)}</span>
        </div>
        <div className="po-form-summary-row po-form-summary-net">
          <span className="po-form-summary-key">Net Payable</span>
          <span className="po-form-summary-val">${totals.netTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="header-actions po-form-full-span">
        <button className="secondary-action" type="button" onClick={handleCancel} disabled={state.submitting || state.initializing}>
          Cancel
        </button>
        <button className="primary-action" type="submit" disabled={state.submitting || state.initializing}>
          {saveButtonLabel("purchaseOrder", state.submitting)}
        </button>
      </div>
    </form>
  )
}