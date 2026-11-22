import { useMemo } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type { SalesOrderLineForm } from "../hooks/useSalesOrderForm"
import { getCollectableQty } from "../hooks/useSalesOrderForm"
import { WalkinCustomerFields } from "../../../shared/walkinCustomer/ui/WalkinCustomerFields"
import type {
  WalkinCustomerFieldErrors,
  WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"
import type { SOCategory } from "../../../shared/constants/soCategoryConstants"
import { TyreIcon, BatteryIcon } from "../../../shared/ui/icons"
import {
  calculateDiscountAmount,
  calculateLineTotal,
  parseLineTotalOverride,
  parseLineDiscountOverride,
  calculateRemainingAvailableForLine,
} from "../utils/salesOrderCalculations"

type SalesOrderFormProps = {
  state: {
    formData: {
      Date: string
      Category?: SOCategory
      CustomerMode: "registered" | "walkin"
      CustomerID: number | ""
      WalkinCustomer: WalkinCustomerForm
    }
    lines: SalesOrderLineForm[]
    customers: CustomerRecord[]
    tyres: TyreRecord[]
    batteries?: BatteryRecord[]
    totalAmount: number
    takingAmount: number
    submitting: boolean
    walkinCustomerErrors: WalkinCustomerFieldErrors
  }
  actions: {
    onCategoryChange?: (category: SOCategory) => void
    onChangeDate: (value: string) => void
    onChangeCustomerMode: (mode: "registered" | "walkin") => void
    onChangeCustomer: (value: number | "") => void
    onChangeWalkinCustomer: (patch: Partial<WalkinCustomerForm>) => void
    onOpenCreateCustomer: () => void
    onOpenCreateTyre: () => void
    onOpenCreateBattery?: () => void
    onAddLine: () => void
    onRemoveLine: (rowId: number) => void
    onChangeLineTyre: (rowId: number, value: number | "") => void
    onChangeLineBattery?: (rowId: number, value: number | "") => void
    onChangeLinePrice: (rowId: number, value: number) => void
    onChangeLineDiscount: (rowId: number, value: number) => void
    onChangeLineQty: (rowId: number, value: number) => void
    onChangeLineTakeNow: (rowId: number, value: number) => void
    onManageStock: (rowId: number) => void
    onChangeLineTotal: (rowId: number, value: number | null) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onOpenAdvancePayment?: () => void
    onCancel: () => void
  }
}

export function SalesOrderForm(props: SalesOrderFormProps) {
  const { state, actions } = props
  const category = state.formData.Category || "tyre"
  const isBattery = category === "battery"
  const toNumber = (value: string) => value === "" ? 0 : Number(value)
  const toOptionalNumber = (value: string): number | "" => (value ? Number(value) : "")

  const handleCustomerChange = (value: string) => {
    actions.onChangeCustomer(toOptionalNumber(value))
  }

  const handleItemChange = (rowId: number, value: string) => {
    if (isBattery) {
      actions.onChangeLineBattery?.(rowId, toOptionalNumber(value))
    } else {
      actions.onChangeLineTyre(rowId, toOptionalNumber(value))
    }
  }

  const handleLineDiscountChange = (line: SalesOrderLineForm, raw: string) => {
    if (raw === "") {
      actions.onChangeLineDiscount(line.RowId, 0)
      return
    }
    const val = parseLineDiscountOverride(raw)
    if (val !== null) actions.onChangeLineDiscount(line.RowId, val)
  }

  const handleLineQtyChange = (rowId: number, value: string) => {
    actions.onChangeLineQty(rowId, toNumber(value))
  }

  const handleLineTotalChange = (line: SalesOrderLineForm, raw: string) => {
    if (raw === "") {
      actions.onChangeLineTotal(line.RowId, null)
      return
    }
    const val = parseLineTotalOverride(raw, line)
    if (val !== null) actions.onChangeLineTotal(line.RowId, val)
  }

  const getTyreOptionLabel = (tyre: TyreRecord) => {
    return `${tyre.Brand || "NA"} / ${tyre.Size || "NA"}`
  }

  const getBatteryOptionLabel = (battery: BatteryRecord) => {
    return `${battery.Brand || "NA"} ${battery.Model || "NA"} (${battery.Capacity || "NA"} ${battery.Voltage || "NA"})`
  }

  const getCustomerOptionLabel = (customer: CustomerRecord) => {
    return `${customer.CustomerCode} - ${customer.Name}`
  }

  const renderCustomerOptions = () => {
    return state.customers.map((customer) => (
      <option key={customer.CustomerID} value={customer.CustomerID}>
        {getCustomerOptionLabel(customer)}
      </option>
    ))
  }

  const tyreOptions = useMemo(() => {
    return state.tyres.map((tyre) => (
      <option key={tyre.Id} value={tyre.Id}>
        {getTyreOptionLabel(tyre)}
      </option>
    ))
  }, [state.tyres])

  const batteryOptions = useMemo(() => {
    return (state.batteries || []).map((battery) => (
      <option key={battery.Id} value={battery.Id}>
        {getBatteryOptionLabel(battery)}
      </option>
    ))
  }, [state.batteries])

  const renderItemOptions = () => {
    return isBattery ? batteryOptions : tyreOptions
  }

  const renderSubmitButtons = () => {
    if (state.takingAmount > 0) {
      return (
        <button className="primary-action" type="submit" disabled={state.submitting}>
          {state.submitting
            ? "Saving..."
            : isBattery
              ? "Pay for Taken Batteries & Create SO"
              : "Pay for Taken Tyres & Create SO"}
        </button>
      )
    }

    return (
      <>
        <button className="secondary-action" type="submit" disabled={state.submitting}>
          {state.submitting ? "Saving..." : "Create SO (No Advance)"}
        </button>
        {actions.onOpenAdvancePayment && (
          <button
            className="primary-action"
            type="button"
            onClick={actions.onOpenAdvancePayment}
            disabled={state.submitting || state.totalAmount <= 0}
          >
            Pay Advance &amp; Create SO
          </button>
        )}
      </>
    )
  }

  const takingLines = state.lines.filter((line) => line.TakeNowQty > 0)

  const tyreById = useMemo(() => {
    return new Map(state.tyres.map((tyre) => [tyre.Id, tyre]))
  }, [state.tyres])

  const batteryById = useMemo(() => {
    return new Map((state.batteries || []).map((b) => [b.Id, b]))
  }, [state.batteries])

  const itemsById = isBattery ? batteryById : tyreById

  return (
    <form className="login-form" onSubmit={actions.onSubmit}>
      <div className="login-form-full-span po-top-bar">
        <label className="field-label po-date-badge">
          Date
          <span className="so-date-text">{state.formData.Date}</span>
        </label>

        <div className="po-category-group">
          <span className="po-category-label">Category:</span>
          <div className="po-category-segment" role="radiogroup" aria-label="Sales Order Category">
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
            <select
              className="text-input"
              value={state.formData.CustomerID}
              onChange={(event) => handleCustomerChange(event.target.value)}
              disabled={state.submitting}
              required
            >
              <option value="">Select customer</option>
              {renderCustomerOptions()}
            </select>
          </label>

          <div className="header-actions form-inline-action">
            <button
              className="secondary-action"
              type="button"
              onClick={actions.onOpenCreateCustomer}
              disabled={state.submitting}
            >
              Create New Customer
            </button>
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

      <div className="header-actions login-form-full-span">
        {isBattery ? (
          <button
            className="secondary-action"
            type="button"
            onClick={actions.onOpenCreateBattery}
            disabled={state.submitting}
          >
            Create New Battery
          </button>
        ) : (
          <button
            className="secondary-action"
            type="button"
            onClick={actions.onOpenCreateTyre}
            disabled={state.submitting}
          >
            Create New Tyre
          </button>
        )}
      </div>

      <p className="hero-text so-take-now-hint login-form-full-span">
        Set how many {isBattery ? "batteries" : "tyres"} the customer takes now. The rest are saved as Later for a future collection.
      </p>

      <div className="table-scroll table-scroll-wide login-form-full-span so-order-lines-scroll">
        <table className="product-table so-form-table so-order-lines-table">
          <thead>
            <tr>
              <th>{isBattery ? "Battery" : "Tyre"}</th>
              <th>MRP (With VAT)</th>
              <th>Discount (%)</th>
              <th>Qty</th>
              <th>Take Now</th>
              <th>Need To Order Qty</th>
              <th>Line Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => {
              const selectedValue = isBattery ? (line.BatteryID ?? "") : line.TyreID
              return (
                <tr key={line.RowId}>
                  <td>
                    <select
                      className="text-input"
                      value={selectedValue}
                      onChange={(event) => handleItemChange(line.RowId, event.target.value)}
                      disabled={state.submitting}
                      required
                    >
                      <option value="">Select {isBattery ? "battery" : "tyre"}</option>
                      {renderItemOptions()}
                    </select>
                  </td>
                  <td>
                    <span className="table-count">
                      {line.MRP_WithVAT.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div className="qty-input-container qty-input-stacked">
                      <input
                        className="text-input"
                        type="text"
                        inputMode="decimal"
                        value={line.Discount}
                        onChange={(event) => handleLineDiscountChange(line, event.target.value)}
                        disabled={state.submitting}
                      />
                      <span className="qty-label-row">
                        <span className="qty-available-label">
                          Amt: {calculateDiscountAmount(line).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="qty-input-container qty-input-stacked">
                      <div className="qty-manage-wrap">
                        <input
                          key={`${line.RowId}-${line.AllocationsVersion}`}
                          className="text-input qty-manage-input"
                          type="text"
                          inputMode="numeric"
                          defaultValue={line.Qty}
                          onChange={(event) => handleLineQtyChange(line.RowId, event.target.value)}
                          disabled={state.submitting}
                        />
                        <button
                          className="qty-manage-button"
                          type="button"
                          onClick={() => actions.onManageStock(line.RowId)}
                          disabled={state.submitting || (!line.TyreID && !line.BatteryID)}
                        >
                          Select
                        </button>
                      </div>
                      <span className="qty-label-row">
                        <span className="qty-available-label">
                          Available: {calculateRemainingAvailableForLine(line, itemsById)}
                        </span>
                        {line.Allocations.some((allocation) => allocation.StorageManagerID !== null) && (
                          <span className="qty-available-label qty-managed-badge">
                            Lots: {line.Allocations.filter((allocation) => allocation.StorageManagerID !== null).length}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="qty-input-container qty-input-stacked take-now-cell">
                      <div className="take-now-input-row">
                        <input
                          className="text-input take-now-input"
                          type="text"
                          inputMode="numeric"
                          value={line.TakeNowQty}
                          onChange={(event) => actions.onChangeLineTakeNow(line.RowId, Number(event.target.value.replace(/[^0-9]/g, "")))}
                          disabled={state.submitting || getCollectableQty(line) === 0}
                          aria-label="Take now quantity"
                        />
                        <div className="take-now-quick">
                          <button
                            type="button"
                            className="take-now-quick-button"
                            onClick={() => actions.onChangeLineTakeNow(line.RowId, getCollectableQty(line))}
                            disabled={state.submitting || getCollectableQty(line) === 0}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            className="take-now-quick-button"
                            onClick={() => actions.onChangeLineTakeNow(line.RowId, 0)}
                            disabled={state.submitting || line.TakeNowQty === 0}
                          >
                            Later
                          </button>
                        </div>
                      </div>
                      <span className="qty-label-row">
                        <span className="qty-available-label">
                          Later: {Math.max(0, line.Qty - line.TakeNowQty)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="table-count">{line.NeedToOrderQty}</span>
                  </td>
                  <td>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="decimal"
                      value={calculateLineTotal(line).toFixed(2)}
                      onChange={(e) => handleLineTotalChange(line, e.target.value)}
                      disabled={state.submitting}
                    />
                  </td>
                  <td>
                    <button
                      className="secondary-action table-action"
                      type="button"
                      onClick={() => actions.onRemoveLine(line.RowId)}
                      disabled={state.submitting}
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
        <button
          className="secondary-action"
          type="button"
          onClick={actions.onAddLine}
          disabled={state.submitting}
        >
          {isBattery ? "Add Battery Line" : "Add Tyre Line"}
        </button>
      </div>

      <section className="login-form-full-span so-taking-now-section">
        <div className="table-panel-header so-taking-now-header">
          <div>
            <p className="section-label so-taking-now-label">Taking Now</p>
            <h3>Payment for {isBattery ? "batteries" : "tyres"} being collected</h3>
            <p className="secondary-text so-taking-now-description">
              Only the quantities being collected today are included in this payment.
            </p>
          </div>
          <span className="so-taking-now-count">
            {takingLines.length} {takingLines.length === 1 ? (isBattery ? "battery line" : "tyre line") : (isBattery ? "battery lines" : "tyre lines")}
          </span>
        </div>
        <div className="table-scroll so-taking-now-scroll">
          <table className="product-table so-form-table so-taking-now-table">
            <thead>
              <tr>
                <th>{isBattery ? "Battery" : "Tyre"}</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Discount (%)</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {takingLines.length > 0 ? (
                takingLines.map((line) => {
                  let itemLabel = "Selected item"
                  if (isBattery) {
                    const battery = batteryById.get(Number(line.BatteryID))
                    if (battery) itemLabel = getBatteryOptionLabel(battery)
                  } else {
                    const tyre = tyreById.get(Number(line.TyreID))
                    if (tyre) itemLabel = getTyreOptionLabel(tyre)
                  }
                  const amount =
                    line.Price * line.TakeNowQty * (1 - line.Discount / 100)

                  return (
                    <tr key={line.RowId}>
                      <td>{itemLabel}</td>
                      <td className="text-right">{line.TakeNowQty}</td>
                      <td className="text-right">{line.Price.toFixed(2)}</td>
                      <td className="text-right">{line.Discount.toFixed(2)}</td>
                      <td className="text-right">{amount.toFixed(2)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="secondary-text">
                    No {isBattery ? "batteries" : "tyres"} are set to be collected now.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={4} className="text-right">Taking Now Total</th>
                <th className="text-right">{state.takingAmount.toFixed(2)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="secondary-text so-taking-now-note">
          {takingLines.length > 0
            ? `${isBattery ? "Batteries" : "Tyres"} marked for later collection remain on the sales order and can be invoiced when collected.`
            : `No ${isBattery ? "batteries" : "tyres"} are being taken today. You can record an advance deposit using 'Pay Advance & Create SO' or save without payment.`}
        </p>
      </section>

      <div className="table-panel-header login-form-full-span">
        <div>
          <p className="hero-text">Sales Order Total</p>
          <h3>{state.totalAmount.toFixed(2)}</h3>
        </div>
      </div>

      <div className="header-actions">
        <button className="secondary-action" type="button" onClick={actions.onCancel} disabled={state.submitting}>
          Cancel
        </button>
        {renderSubmitButtons()}
      </div>
    </form>
  )
}
