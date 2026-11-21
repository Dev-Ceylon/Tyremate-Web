import React, { useMemo } from "react"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type {
  PurchaseOrderFormData,
  PurchaseOrderLine,
} from "../hooks/usePurchaseOrderForm"
import type { POCategory } from "@/shared/constants/poCategoryConstants"
import { saveButtonLabel } from "../../../shared/ui/saveButtonLabel"

interface PurchaseOrderFormProps {
  state: {
    category?: POCategory
    formData: PurchaseOrderFormData
    lines: PurchaseOrderLine[]
    tyres: TyreRecord[]
    batteries?: BatteryRecord[]
    submitting: boolean
    initializing?: boolean
    error?: string | null
  }
  actions: {
    onCategoryChange?: (category: POCategory) => void
    onChangeDate: (val: string) => void
    onAddLine: () => void
    onRemoveLine: (id: string) => void
    onUpdateLine: (id: string, field: keyof PurchaseOrderLine, value: any) => void
    onOpenSupplierModal: (lineId: string) => void
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
  }
  onOpenCreateTyre?: () => void
  onOpenCreateBattery?: () => void
  onCancel?: () => void
  isEditMode?: boolean
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  state,
  actions,
  onOpenCreateTyre,
  onOpenCreateBattery,
  onCancel,
  isEditMode = false,
}) => {
  const category = state.category || "tyre"

  const totals = useMemo(() => {
    const subtotal = state.lines.reduce((sum, line) => sum + (line.Price || 0) * (line.Qty || 0), 0)
    const totalDiscount = state.lines.reduce(
      (sum, line) => sum + ((line.Price || 0) * (line.Qty || 0) * (line.Discount || 0)) / 100,
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
      <div className="po-form-top-meta po-form-full-span" style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "1rem" }}>
        <label className="field-label" style={{ margin: 0 }}>
          PO Date: <span className="so-date-text">{state.formData.Date}</span>
        </label>

        {isEditMode ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="field-label" style={{ margin: 0 }}>Category:</span>
            <span className={`status-badge ${category === "battery" ? "status-pending" : "status-approved"}`}>
              {category === "battery" ? "Batteries" : "Tyres"}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="field-label" style={{ margin: 0 }}>Category:</span>
            <div style={{ display: "inline-flex", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color, #ccc)" }}>
              <button
                type="button"
                className={`secondary-action ${category === "tyre" ? "primary-action" : ""}`}
                style={{ borderRadius: 0, border: "none", padding: "0.35rem 0.85rem" }}
                onClick={() => actions.onCategoryChange?.("tyre")}
                disabled={state.submitting}
              >
                Tyres
              </button>
              <button
                type="button"
                className={`secondary-action ${category === "battery" ? "primary-action" : ""}`}
                style={{ borderRadius: 0, border: "none", padding: "0.35rem 0.85rem" }}
                onClick={() => actions.onCategoryChange?.("battery")}
                disabled={state.submitting}
              >
                Batteries
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="header-actions po-form-full-span">
        <button
          className="secondary-action"
          type="button"
          onClick={actions.onAddLine}
          disabled={state.submitting}
        >
          Add Line Item
        </button>
        {category === "battery" && onOpenCreateBattery && (
          <button
            className="secondary-action"
            type="button"
            onClick={onOpenCreateBattery}
            disabled={state.submitting}
          >
            Create New Battery
          </button>
        )}
        {category !== "battery" && onOpenCreateTyre && (
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
              <th>{category === "battery" ? "Battery" : "Tyre"}</th>
              <th>Qty</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => {
              const isItemUnselected = category === "battery" ? !line.BatteryID : !line.TyreID

              return (
                <React.Fragment key={line.id}>
                  <tr>
                    <td>
                      {category === "battery" ? (
                        <select
                          className="text-input"
                          value={line.BatteryID || ""}
                          onChange={(e) => {
                            const bId = Number(e.target.value)
                            actions.onUpdateLine(line.id, "BatteryID", bId)
                            const selBattery = (state.batteries || []).find((b) => b.Id === bId)
                            if (selBattery) {
                              actions.onUpdateLine(line.id, "Price", selBattery.ActualSellingPrice || selBattery.PurchasedPrice || 0)
                            }
                          }}
                          disabled={state.submitting}
                          required
                        >
                          <option value="">Select battery</option>
                          {(state.batteries || []).map((b) => (
                            <option key={b.Id} value={b.Id}>
                              {b.Brand} {b.Model ? `- ${b.Model}` : ""} {b.Capacity ? `(${b.Capacity}` : ""}{b.Voltage ? ` ${b.Voltage})` : b.Capacity ? ")" : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="text-input"
                          value={line.TyreID || ""}
                          onChange={(e) => {
                            const tId = Number(e.target.value)
                            actions.onUpdateLine(line.id, "TyreID", tId)
                            const selTyre = state.tyres.find((t) => t.Id === tId)
                            if (selTyre) {
                              actions.onUpdateLine(line.id, "Price", selTyre.ActualSellingPrice || 0)
                            }
                          }}
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
                      )}
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
                          {isItemUnselected && (
                            <small className="secondary-text">
                              Select a {category === "battery" ? "battery" : "tyre"} to enable allocation
                            </small>
                          )}
                        </div>
                        <button
                          className="secondary-action table-action"
                          type="button"
                          onClick={() => actions.onOpenSupplierModal(line.id)}
                          disabled={state.submitting || isItemUnselected}
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
                                  <td className="text-center">{s.Price > 0 ? `$${s.Price.toFixed(2)}` : "-"}</td>
                                  <td className="text-center">{s.Discount > 0 ? `${s.Discount}%` : "-"}</td>
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
              )
            })}
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