import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { InquiryLineForm } from "../hooks/useInquiryForm"
import { WalkinCustomerFields } from "../../../shared/walkinCustomer/ui/WalkinCustomerFields"
import { formatTyreLabel } from "../../../shared/tyre/models/tyreDisplay"
import { StatusBadge } from "../../../shared/ui/StatusBadge"
import type {
  WalkinCustomerFieldErrors,
  WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

type InquiryFormProps = {
  state: {
    formData: {
      Date: string
      CustomerMode: "registered" | "walkin"
      CustomerID: number | ""
      WalkinCustomer: WalkinCustomerForm
      Notes: string
    }
    lines: InquiryLineForm[]
    customers: CustomerRecord[]
    tyres: TyreRecord[]
    submitting: boolean
    walkinCustomerErrors: WalkinCustomerFieldErrors
  }
  actions: {
    onChangeDate: (val: string) => void
    onChangeCustomerMode: (mode: "registered" | "walkin") => void
    onChangeCustomer: (val: number | "") => void
    onChangeWalkinCustomer: (patch: Partial<WalkinCustomerForm>) => void
    onChangeNotes: (val: string) => void
    onOpenCreateCustomer: () => void
    onOpenCreateTyre: () => void
    onAddLine: () => void
    onRemoveLine: (rowId: number) => void
    onChangeLineTyre: (rowId: number, val: number | "") => void
    onChangeLinePrice: (rowId: number, val: number) => void
    onChangeLineDiscount: (rowId: number, val: number) => void
    onChangeLineQty: (rowId: number, val: number) => void
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
  }
}

export function InquiryForm({ state, actions }: InquiryFormProps) {
  const availableByTyreId = new Map(state.tyres.map((t) => [t.Id, t.AvailableQuantity ?? 0]))

  return (
    <form className="login-form" onSubmit={actions.onSubmit}>
      <label className="field-label">
        Reminder Date
        <input
          className="text-input"
          type="date"
          value={state.formData.Date}
          onChange={(e) => actions.onChangeDate(e.target.value)}
          disabled={state.submitting}
          required
        />
      </label>

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
              onChange={(e) => actions.onChangeCustomer(e.target.value ? Number(e.target.value) : "")}
              disabled={state.submitting}
              required
            >
              <option value="">Select customer</option>
              {state.customers.map((c) => (
                <option key={c.CustomerID} value={c.CustomerID}>
                  {c.CustomerCode} - {c.Name}
                </option>
              ))}
            </select>
          </label>

          <div className="header-actions">
            <button type="button" className="secondary-action" onClick={actions.onOpenCreateCustomer}>
              + New Customer
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

      <div className="table-scroll login-form-full-span">
        <table className="product-table">
          <thead>
            <tr>
              <th>Tyre</th>
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
              const stock = line.TyreID === "" ? null : availableByTyreId.get(line.TyreID) ?? 0
              const toOrder = stock === null ? null : Math.max(line.Qty - stock, 0)
              return (
                <tr key={line.RowId}>
                  <td>
                    <select
                      className="text-input"
                      value={line.TyreID}
                      onChange={(e) => actions.onChangeLineTyre(line.RowId, e.target.value ? Number(e.target.value) : "")}
                      disabled={state.submitting}
                      required
                    >
                      <option value="">Select tyre</option>
                      {state.tyres.map((t) => (
                        <option key={t.Id} value={t.Id}>
                          {formatTyreLabel(t)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="decimal"
                      defaultValue={line.Price}
                      onChange={(e) => actions.onChangeLinePrice(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="decimal"
                      defaultValue={line.Discount}
                      onChange={(e) => actions.onChangeLineDiscount(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="numeric"
                      defaultValue={line.Qty}
                      onChange={(e) => actions.onChangeLineQty(line.RowId, e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={state.submitting}
                    />
                  </td>
                  <td className="text-right">{stock === null ? "-" : stock}</td>
                  <td className="text-right">
                    {toOrder === null ? (
                      "-"
                    ) : (
                      <StatusBadge label={toOrder.toString()} tone={toOrder <= 0 ? "completed" : "pending"} />
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => actions.onRemoveLine(line.RowId)}
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
        <button type="button" className="secondary-action" onClick={actions.onOpenCreateTyre}>
          + New Tyre
        </button>
        <button type="button" className="secondary-action" onClick={actions.onAddLine}>
          Add Tyre Line
        </button>
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
