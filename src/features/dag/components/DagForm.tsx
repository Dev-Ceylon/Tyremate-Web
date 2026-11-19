import { useMemo } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import type { DagLineForm, DagFormState } from "../hooks/useDagForm"
import { getLineQty } from "../hooks/useDagForm"
import { formatTyreLabel } from "../../../shared/tyre/models/tyreDisplay"
import { WalkinCustomerFields } from "../../../shared/walkinCustomer/ui/WalkinCustomerFields"
import type {
  WalkinCustomerFieldErrors,
  WalkinCustomerFieldKey,
  WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

type DagFormProps = {
  state: {
    formData: DagFormState
    customers: CustomerRecord[]
    tyres: TyreRecord[]
    storageLocations: StorageLocationRecord[]
    lines: DagLineForm[]
    submitting: boolean
    walkinCustomerErrors?: WalkinCustomerFieldErrors
  }
  actions: {
    onChange: <K extends keyof DagFormProps["state"]["formData"]>(field: K, value: DagFormProps["state"]["formData"][K]) => void
    onChangeCustomerMode?: (mode: "registered" | "walkin") => void
    onChangeWalkinCustomer?: (patch: Partial<WalkinCustomerForm>) => void
    onBlurWalkinCustomer?: (fieldKey: WalkinCustomerFieldKey) => void
    onAddLine: () => void
    onRemoveLine: (rowId: number) => void
    onChangeLineTyre: (rowId: number, value: number | "") => void
    onChangeLineStorageLocation: (rowId: number, value: number | "") => void
    onChangeLineSerials: (rowId: number, value: string) => void
    onAddLineSerial: (rowId: number) => void
    onRemoveLineSerial: (rowId: number, serialIndex: number) => void
    onChangeLineSerialNumber: (rowId: number, serialIndex: number, value: string) => void
    onChangeLineSerialCost: (rowId: number, serialIndex: number, value: number | "") => void
    onOpenCreateCustomer: () => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onCancel: () => void
  }
}

export function DagForm({ state, actions }: DagFormProps) {
  const toOptionalNumber = (value: string): number | "" => (value ? Number(value) : "")

  const customerOptions = useMemo(
    () =>
      state.customers.map((customer) => (
        <option key={customer.CustomerID} value={customer.CustomerID}>
          {customer.CustomerCode} - {customer.Name}
        </option>
      )),
    [state.customers],
  )

  const tyreOptions = useMemo(
    () =>
      state.tyres.map((tyre) => (
        <option key={tyre.Id} value={tyre.Id}>
          {formatTyreLabel(tyre)}
        </option>
      )),
    [state.tyres],
  )

  const storageLocationOptions = useMemo(
    () =>
      state.storageLocations.map((location) => (
        <option key={location.Id} value={location.Id}>
          {location.LocationCode || ""} - {location.LocationName || ""}
        </option>
      )),
    [state.storageLocations],
  )

  return (
    <form className="login-form" onSubmit={actions.onSubmit}>
      <label className="field-label">
        Date
        <span className="so-date-text">{state.formData.Date}</span>
      </label>

      <div className="login-form-full-span mb-2">
        <label className="field-label mb-1">Customer Type</label>
        <div className="filter-tabs customer-mode-tabs">
          <button
            type="button"
            className={`filter-tab ${state.formData.CustomerMode === "registered" ? "filter-tab-active" : ""}`}
            onClick={() => (actions.onChangeCustomerMode ? actions.onChangeCustomerMode("registered") : actions.onChange("CustomerMode", "registered"))}
            disabled={state.submitting}
          >
            Registered Customer
          </button>
          <button
            type="button"
            className={`filter-tab ${state.formData.CustomerMode === "walkin" ? "filter-tab-active" : ""}`}
            onClick={() => (actions.onChangeCustomerMode ? actions.onChangeCustomerMode("walkin") : actions.onChange("CustomerMode", "walkin"))}
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
              onChange={(event) => actions.onChange("CustomerID", toOptionalNumber(event.target.value))}
              disabled={state.submitting}
              required
            >
              <option value="">Select customer</option>
              {customerOptions}
            </select>
          </label>

          <div className="header-actions">
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
          onChange={(patch) => actions.onChangeWalkinCustomer?.(patch)}
          onBlur={actions.onBlurWalkinCustomer}
          errors={state.walkinCustomerErrors}
          disabled={state.submitting}
        />
      )}

      <label className="field-label">
        Comment
        <textarea
          className="text-input"
          value={state.formData.Comment}
          onChange={(event) => actions.onChange("Comment", event.target.value)}
          disabled={state.submitting}
          rows={4}
        />
      </label>

      <div className="header-actions">
        <button className="secondary-action" type="button" onClick={actions.onAddLine} disabled={state.submitting}>
          Add Tyre Line
        </button>
      </div>

      <div className="table-scroll table-scroll-wide login-form-full-span">
        <table className="product-table">
          <thead>
            <tr>
              <th>Tyre</th>
              <th>Storage Location</th>
              <th>Serial Numbers</th>
              <th>Qty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.lines.map((line) => (
              <tr key={line.RowId}>
                <td>
                  <select
                    className="text-input"
                    value={line.TyreID}
                    onChange={(event) => actions.onChangeLineTyre(line.RowId, toOptionalNumber(event.target.value))}
                    disabled={state.submitting}
                    required
                  >
                    <option value="">Select tyre</option>
                    {tyreOptions}
                  </select>
                </td>
                <td>
                  <div className="flex-column">
                    <select
                      className="text-input"
                      value={line.StorageLocationID}
                      onChange={(event) => actions.onChangeLineStorageLocation(line.RowId, toOptionalNumber(event.target.value))}
                      disabled={state.submitting}
                      required
                    >
                      <option value="">Select location</option>
                      {storageLocationOptions}
                    </select>
                    <span className="secondary-text text-xs mt-1">
                      Space left: {state.storageLocations.find((l) => l.Id === line.StorageLocationID)?.RemainingCapacity ?? "-"}
                    </span>
                  </div>
                </td>
                <td>
                  <input
                    className="text-input"
                    placeholder="Comma-separated serials"
                    value={line.RawSerialsString}
                    onChange={(event) => actions.onChangeLineSerials(line.RowId, event.target.value)}
                    disabled={state.submitting}
                  />
                </td>
                <td>
                  <span className="secondary-text">{getLineQty(line)}</span>
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

      <div className="header-actions">
        <button className="secondary-action" type="button" onClick={actions.onCancel} disabled={state.submitting}>
          Cancel
        </button>
        <button className="primary-action" type="submit" disabled={state.submitting}>
          {state.submitting ? "Saving..." : "Create DAG"}
        </button>
      </div>
    </form>
  )
}
