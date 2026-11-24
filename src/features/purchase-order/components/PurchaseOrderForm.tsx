import React, { useMemo } from "react"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type {
  PurchaseOrderFormData,
  PurchaseOrderLine,
} from "../hooks/usePurchaseOrderForm"
import type { POCategory } from "@/shared/constants/poCategoryConstants"
import { saveButtonLabel } from "../../../shared/ui/saveButtonLabel"
import { TyreIcon, BatteryIcon, CalendarIcon } from "../../../shared/ui/icons"

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
  const isItemLoading = Boolean(state.initializing)

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
      <div className="po-top-bar po-form-full-span">
        <div className="po-date-badge">
          <CalendarIcon />
          <span className="po-date-label">PO Date:</span>
          <strong>{state.formData.Date}</strong>
        </div>

        <div className="po-category-group">
          <span className="po-category-label">Category:</span>
          {isEditMode ? (
            <div className="po-category-read-only">
              {category === "battery" ? <BatteryIcon /> : <TyreIcon />}
              <span>{category === "battery" ? "Batteries Order" : "Tyres Order"}</span>
            </div>
          ) : (
            <div className="po-category-segment" role="radiogroup" aria-label="Purchase Order Category">
              <button
                type="button"
                role="radio"
                aria-checked={category === "tyre"}
                className={`po-category-pill ${category === "tyre" ? "po-category-pill-active" : ""}`}
                onClick={() => actions.onCategoryChange?.("tyre")}
                disabled={state.submitting}
              >
                <TyreIcon />
                <span>Tyres</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={category === "battery"}
                className={`po-category-pill ${category === "battery" ? "po-category-pill-active" : ""}`}
                onClick={() => actions.onCategoryChange?.("battery")}
                disabled={state.submitting}
              >
                <BatteryIcon />
                <span>Batteries</span>
              </button>
            </div>
          )}
        </div>
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
                        <div className={`tm-select-loading-wrap ${isItemLoading ? "is-loading" : ""}`}>
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
                            disabled={state.submitting || isItemLoading}
                            required
                          >
                            <option value="">{isItemLoading ? "Loading batteries…" : "Select battery"}</option>
                            {(state.batteries || []).map((b) => (
                              <option key={b.Id} value={b.Id}>
                                {b.Brand} {b.Model ? `- ${b.Model}` : ""} {b.Capacity ? `(${b.Capacity}` : ""}{b.Voltage ? ` ${b.Voltage})` : b.Capacity ? ")" : ""}
                              </option>
                            ))}
                          </select>
                          {isItemLoading && (
                            <span className="tm-select-spinner" aria-hidden="true" title="Loading batteries…">
                              <span className="tm-spinner tm-spinner-xs" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={`tm-select-loading-wrap ${isItemLoading ? "is-loading" : ""}`}>
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
                            disabled={state.submitting || isItemLoading}
                            required
                          >
                            <option value="">{isItemLoading ? "Loading tyres…" : "Select tyre"}</option>
                            {state.tyres.map((t) => (
                              <option key={t.Id} value={t.Id}>
                                {t.Brand} / {t.Size} / {t.Pattern}
                              </option>
                            ))}
                          </select>
                          {isItemLoading && (
                            <span className="tm-select-spinner" aria-hidden="true" title="Loading tyres…">
                              <span className="tm-spinner tm-spinner-xs" />
                            </span>
                          )}
                        </div>
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