import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type { InquiryLineForm } from "../hooks/useInquiryForm"
import type { InquiryCategory } from "../models/inquiry"
import { WalkinCustomerFields } from "../../../shared/walkinCustomer/ui/WalkinCustomerFields"
import { formatTyreLabel } from "../../../shared/tyre/models/tyreDisplay"
import { StatusBadge } from "../../../shared/ui/StatusBadge"
import { TyreIcon, BatteryIcon } from "../../../shared/ui/icons"
import PermissionGate from "../../../shared/components/PermissionGate"
import type {
  WalkinCustomerFieldErrors,
  WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

type InquiryFormProps = {
  state: {
    formData: {
      Date: string
      Category: InquiryCategory
      CustomerMode: "registered" | "walkin"
      CustomerID: number | ""
      WalkinCustomer: WalkinCustomerForm
      Notes: string
    }
    lines: InquiryLineForm[]
    customers: CustomerRecord[]
    tyres: TyreRecord[]
    batteries: BatteryRecord[]
    initializing?: boolean
    loadingCustomers?: boolean
    loadingTyres?: boolean
    loadingBatteries?: boolean
    submitting: boolean
    walkinCustomerErrors: WalkinCustomerFieldErrors
  }
  actions: {
    onChangeDate: (val: string) => void
    onChangeCategory: (cat: InquiryCategory) => void
    onChangeCustomerMode: (mode: "registered" | "walkin") => void
    onChangeCustomer: (val: number | "") => void
    onChangeWalkinCustomer: (patch: Partial<WalkinCustomerForm>) => void
    onChangeNotes: (val: string) => void
    onOpenCreateCustomer: () => void
    onOpenCreateTyre: () => void
    onOpenCreateBattery: () => void
    onAddLine: () => void
    onRemoveLine: (rowId: number) => void
    onChangeLineTyre: (rowId: number, val: number | "") => void
    onChangeLineBattery: (rowId: number, val: number | "") => void
    onChangeLinePrice: (rowId: number, val: number) => void
    onChangeLineDiscount: (rowId: number, val: number) => void
    onChangeLineQty: (rowId: number, val: number) => void
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
  }
}

export function InquiryForm({ state, actions }: InquiryFormProps) {
  const isBattery = state.formData.Category === "battery"
  const isCustomerLoading = Boolean(state.initializing || state.loadingCustomers)
  const isItemLoading = isBattery
    ? Boolean(state.initializing || state.loadingBatteries)
    : Boolean(state.initializing || state.loadingTyres)
  const availableByTyreId = new Map(state.tyres.map((t) => [t.Id, t.AvailableQuantity ?? 0]))
  const availableByBatteryId = new Map(state.batteries.map((b) => [b.Id, b.AvailableQuantity ?? 0]))

  return (
    <form className="login-form" onSubmit={actions.onSubmit}>
      <div className="login-form-full-span po-top-bar">
        <div className="inq-date-field">
          <label className="field-label inq-date-label">
            <span className="po-date-label">Reminder Date</span>
            <input
              className="text-input inq-date-input"
              type="date"
              value={state.formData.Date}
              onChange={(e) => actions.onChangeDate(e.target.value)}
              disabled={state.submitting}
              required
            />
          </label>
        </div>

        <div className="po-category-group">
          <span className="po-category-label">Category:</span>
          <div className="po-category-segment" role="radiogroup" aria-label="Inquiry Category">
            <button
              type="button"
              role="radio"
              aria-checked={!isBattery}
              className={`po-category-pill ${!isBattery ? "po-category-pill-active" : ""}`}
              onClick={() => actions.onChangeCategory("tyre")}
              disabled={state.submitting}
            >
              <TyreIcon />
              <span>Tyres</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isBattery}
              className={`po-category-pill ${isBattery ? "po-category-pill-active" : ""}`}
              onClick={() => actions.onChangeCategory("battery")}
              disabled={state.submitting}
            >
              <BatteryIcon />
              <span>Batteries</span>
            </button>
          </div>
        </div>
      </div>

      <div className="login-form-full-span">
        <div className="filter-tabs customer-mode-tabs">
          <button
            type="button"
            className={`filter-tab ${state.formData.CustomerMode === "registered" ? "filter-tab-active" : ""}`}
            onClick={() => actions.onChangeCustomerMode("registered")}
            disabled={state.submitting}
          >
            Registered Customer
          </button>
          <button
            type="button"
            className={`filter-tab ${state.formData.CustomerMode === "walkin" ? "filter-tab-active" : ""}`}
            onClick={() => actions.onChangeCustomerMode("walkin")}
            disabled={state.submitting}
          >
            Walk-in Customer
          </button>
        </div>
      </div>

      {state.formData.CustomerMode === "registered" ? (
        <>
          <label className="field-label">
            Customer
            <div className={`tm-select-loading-wrap ${isCustomerLoading ? "is-loading" : ""}`}>
              <select
                className="text-input"
                value={state.formData.CustomerID}
                onChange={(e) => actions.onChangeCustomer(e.target.value ? Number(e.target.value) : "")}
                disabled={state.submitting || isCustomerLoading}
                required
              >
                <option value="">{isCustomerLoading ? "Loading customers…" : "Select customer"}</option>
                {state.customers.map((c) => (
                  <option key={c.CustomerID} value={c.CustomerID}>
                    {c.CustomerCode} - {c.Name}
                  </option>
                ))}
              </select>
              {isCustomerLoading && (
                <span className="tm-select-spinner" aria-hidden="true" title="Loading customers…">
                  <span className="tm-spinner tm-spinner-xs" />
                </span>
              )}
            </div>
          </label>

          <div className="header-actions form-inline-action">
            <PermissionGate permission="customers.manage">
              <button type="button" className="secondary-action" onClick={actions.onOpenCreateCustomer}>
                + New Customer
              </button>
            </PermissionGate>
          </div>
        </>
      ) : (
        <WalkinCustomerFields
          value={state.formData.WalkinCustomer}
          onChange={actions.onChangeWalkinCustomer}
          errors={state.walkinCustomerErrors}
          disabled={state.submitting}
        />
      )}

      <div className="table-scroll tm-table-scroll inq-items-scroll login-form-full-span">
        <table className="product-table inq-items-table">
          <thead>
            <tr>
              <th>{isBattery ? "Battery (Brand / Model - Capacity Voltage)" : "Tyre (Brand / Size - Pattern)"}</th>
              <th>Price</th>
              <th>Discount (%)</th>
              <th>Qty</th>
              <th className="text-right">On Hand</th>
              <th className="text-right">To Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => {
              const stock = isBattery
                ? line.BatteryID === "" || !line.BatteryID ? null : availableByBatteryId.get(Number(line.BatteryID)) ?? 0
                : line.TyreID === "" || !line.TyreID ? null : availableByTyreId.get(Number(line.TyreID)) ?? 0
              const toOrder = stock === null ? null : Math.max(line.Qty - stock, 0)

              return (
                <tr key={line.RowId} className="inq-item-row">
                  <td className="inq-cell inq-product-cell">
                    <span className="inq-cell-label">
                      {isBattery ? "Battery Product" : "Tyre Product"}
                    </span>
                    {isBattery ? (
                      <div className={`tm-select-loading-wrap ${isItemLoading ? "is-loading" : ""}`}>
                        <select
                          className="text-input inq-line-select"
                          value={line.BatteryID ?? ""}
                          onChange={(e) => actions.onChangeLineBattery(line.RowId, e.target.value ? Number(e.target.value) : "")}
                          disabled={state.submitting || isItemLoading}
                          required
                        >
                          <option value="">{isItemLoading ? "Loading batteries…" : "Select battery"}</option>
                          {state.batteries.map((b) => (
                            <option key={b.Id} value={b.Id}>
                              {b.Brand || "NA"} {b.Model || "NA"} ({b.Capacity || "NA"} {b.Voltage || "NA"})
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
                          className="text-input inq-line-select"
                          value={line.TyreID ?? ""}
                          onChange={(e) => actions.onChangeLineTyre(line.RowId, e.target.value ? Number(e.target.value) : "")}
                          disabled={state.submitting || isItemLoading}
                          required
                        >
                          <option value="">{isItemLoading ? "Loading tyres…" : "Select tyre"}</option>
                          {state.tyres.map((t) => (
                            <option key={t.Id} value={t.Id}>
                              {formatTyreLabel(t)}
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
                  <td className="inq-cell inq-price-cell">
                    <span className="inq-cell-label">Price ($)</span>
                    <input
                      className="text-input inq-price-input"
                      type="text"
                      inputMode="decimal"
                      value={line.Price}
                      onChange={(e) => actions.onChangeLinePrice(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td className="inq-cell inq-discount-cell">
                    <span className="inq-cell-label">Disc %</span>
                    <input
                      className="text-input inq-num-input"
                      type="text"
                      inputMode="decimal"
                      value={line.Discount}
                      onChange={(e) => actions.onChangeLineDiscount(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td className="inq-cell inq-qty-cell">
                    <span className="inq-cell-label">Qty</span>
                    <input
                      className="text-input inq-qty-input"
                      type="text"
                      inputMode="numeric"
                      value={line.Qty}
                      onChange={(e) => actions.onChangeLineQty(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td className="inq-cell inq-stock-cell text-right">
                    <span className="inq-cell-label">On Hand</span>
                    <span className="inq-cell-value">{stock === null ? "-" : stock}</span>
                  </td>
                  <td className="inq-cell inq-to-order-cell text-right">
                    <span className="inq-cell-label">To Order</span>
                    <span className="inq-cell-value">
                      {toOrder === null ? (
                        "-"
                      ) : (
                        <StatusBadge label={toOrder.toString()} tone={toOrder <= 0 ? "completed" : "pending"} />
                      )}
                    </span>
                  </td>
                  <td className="inq-cell inq-action-cell">
                    <button
                      type="button"
                      className="secondary-action table-action inq-remove-btn"
                      onClick={() => actions.onRemoveLine(line.RowId)}
                      disabled={state.submitting || state.lines.length <= 1}
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

      <div className="header-actions login-form-full-span">
        {isBattery ? (
          <>
            <PermissionGate permission="inventory.manage">
              <button type="button" className="secondary-action" onClick={actions.onOpenCreateBattery}>
                + New Battery
              </button>
            </PermissionGate>
            <button type="button" className="secondary-action" onClick={actions.onAddLine}>
              Add Battery Line
            </button>
          </>
        ) : (
          <>
            <PermissionGate permission="inventory.manage">
              <button type="button" className="secondary-action" onClick={actions.onOpenCreateTyre}>
                + New Tyre
              </button>
            </PermissionGate>
            <button type="button" className="secondary-action" onClick={actions.onAddLine}>
              Add Tyre Line
            </button>
          </>
        )}
      </div>

      <label className="field-label login-form-full-span">
        Notes
        <textarea
          className="text-input"
          rows={3}
          value={state.formData.Notes}
          onChange={(e) => actions.onChangeNotes(e.target.value)}
          disabled={state.submitting}
        />
      </label>

      <div className="header-actions login-form-full-span">
        <button type="button" className="secondary-action" onClick={actions.onCancel} disabled={state.submitting}>
          Cancel
        </button>
        <button type="submit" className="primary-action" disabled={state.submitting}>
          {state.submitting ? "Saving..." : "Create Inquiry"}
        </button>
      </div>
    </form>
  )
}
