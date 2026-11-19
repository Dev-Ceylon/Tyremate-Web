import { useMemo } from "react"
import type { ConsumableRecord } from "../../../shared/models/consumables/consumable"
import type { OtherServiceLineForm } from "../hooks/useOtherServiceForm"
import type { OtherServiceFormData } from "../models/otherService"
import { sanitizePhoneInput } from "../../../shared/validation/phone"
import { sanitizeEmailInput } from "../../../shared/validation/email"

type OtherServiceFormProps = {
  state: {
    formData: OtherServiceFormData
    lines: OtherServiceLineForm[]
    consumables: ConsumableRecord[]
    totalAmount: number
    submitting: boolean
  }
  actions: {
    onChangeCustomerName: (value: string) => void
    onChangeCustomerPhone: (value: string) => void
    onChangeCustomerEmail: (value: string) => void
    onAddLine: () => void
    onRemoveLine: (rowId: number) => void
    onChangeLineConsumable: (rowId: number, value: number | "") => void
    onChangeLinePrice: (rowId: number, value: number) => void
    onChangeLineQty: (rowId: number, value: number) => void
    onMakePayment: () => void
    onCancel: () => void
  }
}

export function OtherServiceForm({ state, actions }: OtherServiceFormProps) {
  const toNumber = (value: string) => value === "" ? 0 : Number(value)
  const toOptionalNumber = (value: string): number | "" => value ? Number(value) : ""

  const handleConsumableChange = (rowId: number, value: string) => {
    actions.onChangeLineConsumable(rowId, toOptionalNumber(value))
  }

  const consumableOptions = useMemo(() =>
    state.consumables.map((c) => (
      <option key={c.Id} value={c.Id}>
        {c.Name}{c.Category ? ` (${c.Category})` : ""}
      </option>
    )),
    [state.consumables],
  )

  const lineTotal = (line: OtherServiceLineForm) =>
    (line.Price || 0) * (line.Qty || 0)

  const availableQtyLabel = (line: OtherServiceLineForm) => {
    const c = state.consumables.find((x) => x.Id === line.ConsumableID)
    if (!c) return null
    const remaining = Math.max(0, (c.AvailableQty ?? 0) - (line.Qty || 0))
    return <span className="qty-available-label">Available: {remaining}</span>
  }

  return (
    <form className="login-form">
      <label className="field-label">
        Customer Name
        <input
          className="text-input"
          type="text"
          placeholder="Customer name"
          value={state.formData.CustomerName}
          onChange={(e) => actions.onChangeCustomerName(e.target.value)}
          disabled={state.submitting}
          required
        />
      </label>

      <label className="field-label">
        Phone (optional)
        <input
          className="text-input"
          type="text"
          placeholder="Phone number"
          value={state.formData.CustomerPhone}
          onChange={(e) => actions.onChangeCustomerPhone(sanitizePhoneInput(e.target.value))}
          disabled={state.submitting}
        />
      </label>

      <label className="field-label">
        Email (optional)
        <input
          className="text-input"
          type="email"
          placeholder="Email address"
          value={state.formData.CustomerEmail}
          onChange={(e) => actions.onChangeCustomerEmail(sanitizeEmailInput(e.target.value))}
          maxLength={254}
          disabled={state.submitting}
        />
      </label>

      <div className="header-actions">
        <button
          className="secondary-action"
          type="button"
          onClick={actions.onAddLine}
          disabled={state.submitting}
        >
          + Add Consumable
        </button>
      </div>

      <div className="table-scroll table-scroll-wide login-form-full-span">
        <table className="product-table">
          <thead>
            <tr>
              <th>Consumable</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Line Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => (
              <tr key={line.RowId}>
                <td>
                  <select
                    className="text-input"
                    value={line.ConsumableID}
                    onChange={(e) => handleConsumableChange(line.RowId, e.target.value)}
                    disabled={state.submitting}
                    required
                  >
                    <option value="">Select consumable</option>
                    {consumableOptions}
                  </select>
                </td>
                <td>
                  <input
                    key={`price-${line.RowId}-${line.ConsumableID}`}
                    className="text-input"
                    type="text"
                    inputMode="decimal"
                    defaultValue={line.Price}
                    onChange={(e) => actions.onChangeLinePrice(line.RowId, toNumber(e.target.value))}
                    disabled={state.submitting}
                  />
                </td>
                <td>
                  <div className="qty-input-container">
                    <input
                      className="text-input"
                      type="text"
                      inputMode="numeric"
                      defaultValue={line.Qty}
                      onChange={(e) => actions.onChangeLineQty(line.RowId, toNumber(e.target.value))}
                      disabled={state.submitting}
                    />
                    {availableQtyLabel(line)}
                  </div>
                </td>
                <td>
                  <span className="table-count">
                    ${lineTotal(line).toFixed(2)}
                  </span>
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-panel-header login-form-full-span">
        <div>
          <p className="hero-text">Estimated Total</p>
          <h3>${state.totalAmount.toFixed(2)}</h3>
        </div>
      </div>

      <div className="header-actions">
        <button className="secondary-action" type="button" onClick={actions.onCancel} disabled={state.submitting}>
          Cancel
        </button>
        <button className="primary-action" type="button" onClick={actions.onMakePayment} disabled={state.submitting}>
          Make Payment
        </button>
      </div>
    </form>
  )
}
