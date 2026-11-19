import type { ChangeEvent, FormEvent } from "react"
import type { SupplierRecord } from "../../suppliers/models/supplier"
import type { TyrePayload } from "../models/tyre"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type TyreFormProps = {
  formData: TyrePayload
  onChange: <K extends keyof TyrePayload>(
    field: K,
    value: TyrePayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  suppliers: SupplierRecord[]
  hideSupplier?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function TyreForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  suppliers,
  hideSupplier = false,
  fetchSuggestions,
}: TyreFormProps) {
  const selectedSupplierValue = formData.SupplierIDs?.[0] ? String(formData.SupplierIDs[0]) : ""
  const hasSuppliers = suppliers.length > 0

  const handleSupplierChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedSupplierId = event.target.value === "" ? [] : [Number(event.target.value)]
    onChange("SupplierIDs", selectedSupplierId)
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field-label">
        Brand
        {fetchSuggestions ? (
          <SuggestionInput
            label="Brand"
            hideLabel
            value={formData.Brand ?? ""}
            onChange={(v) => onChange("Brand", v)}
            fetchSuggestions={(q) => fetchSuggestions("Brand", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.Brand ?? ""}
            onChange={(event) => onChange("Brand", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        Size
        {fetchSuggestions ? (
          <SuggestionInput
            label="Size"
            hideLabel
            value={formData.Size ?? ""}
            onChange={(v) => onChange("Size", v)}
            fetchSuggestions={(q) => fetchSuggestions("Size", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.Size ?? ""}
            onChange={(event) => onChange("Size", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        Pattern
        {fetchSuggestions ? (
          <SuggestionInput
            label="Pattern"
            hideLabel
            value={formData.Pattern ?? ""}
            onChange={(v) => onChange("Pattern", v)}
            fetchSuggestions={(q) => fetchSuggestions("Pattern", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.Pattern ?? ""}
            onChange={(event) => onChange("Pattern", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        LL / SR
        {fetchSuggestions ? (
          <SuggestionInput
            label="LL / SR"
            hideLabel
            value={formData.LL_SR ?? ""}
            onChange={(v) => onChange("LL_SR", v)}
            fetchSuggestions={(q) => fetchSuggestions("LL_SR", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.LL_SR ?? ""}
            onChange={(event) => onChange("LL_SR", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        PR
        {fetchSuggestions ? (
          <SuggestionInput
            label="PR"
            hideLabel
            value={formData.PR ?? ""}
            onChange={(v) => onChange("PR", v)}
            fetchSuggestions={(q) => fetchSuggestions("PR", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.PR ?? ""}
            onChange={(event) => onChange("PR", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        Side Wall
        {fetchSuggestions ? (
          <SuggestionInput
            label="Side Wall"
            hideLabel
            value={formData.SideWall ?? ""}
            onChange={(v) => onChange("SideWall", v)}
            fetchSuggestions={(q) => fetchSuggestions("SideWall", q)}
          />
        ) : (
          <input
            className="text-input"
            value={formData.SideWall ?? ""}
            onChange={(event) => onChange("SideWall", event.target.value)}
          />
        )}
      </label>

      <label className="field-label">
        DOT
        <input
          className="text-input"
          value={formData.DOT ?? ""}
          onChange={(event) => onChange("DOT", event.target.value)}
        />
      </label>

      {!hideSupplier && (
        <label className="field-label" style={{ gridColumn: "1 / -1" }}>
          Supplier
          <select
            className="text-input"
            value={selectedSupplierValue}
            onChange={handleSupplierChange}
            disabled={!hasSuppliers}
          >
            <option value="">Select a supplier</option>
            {hasSuppliers ? (
              suppliers.map((supplier) => (
                <option key={supplier.SupplierID} value={supplier.SupplierID}>
                  {supplier.SupplierCode} - {supplier.Name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No suppliers available
              </option>
            )}
          </select>
          <small>Choose the supplier for this tyre.</small>
        </label>
      )}

      <label className="field-label">
        Price Validity From
        <input
          className="text-input"
          type="date"
          value={formData.PriceValidityFrom ?? ""}
          onChange={(event) => onChange("PriceValidityFrom", event.target.value)}
        />
      </label>

      <label className="field-label">
        Price Validity To
        <input
          className="text-input"
          type="date"
          value={formData.PriceValidityTo ?? ""}
          onChange={(event) => onChange("PriceValidityTo", event.target.value)}
        />
      </label>

      <label className="field-label">
        Purchased Price
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.PurchasedPrice ?? ""}
          onChange={(event) =>
            onChange(
              "PurchasedPrice",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        DAG Cost
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.DAGCost ?? ""}
          onChange={(event) =>
            onChange(
              "DAGCost",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
        <small>Default cost applied to each serial when tyres are sent out on a DAG.</small>
      </label>

      <label className="field-label">
        Maximum Discount Offered (%)
        <input
          className="text-input"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formData.DiscountOffered ?? ""}
          onChange={(event) =>
            onChange(
              "DiscountOffered",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        Discount Amount
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.DiscountAmount ?? ""}
          onChange={(event) =>
            onChange(
              "DiscountAmount",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        MRP Without VAT
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.MRP_WithoutVAT ?? ""}
          onChange={(event) =>
            onChange(
              "MRP_WithoutVAT",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        MRP With VAT
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.MRP_WithVAT ?? ""}
          onChange={(event) =>
            onChange(
              "MRP_WithVAT",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <label className="field-label">
        Actual Selling Price
        <input
          className="text-input"
          type="number"
          min={0}
          step="0.01"
          value={formData.ActualSellingPrice ?? ""}
          onChange={(event) =>
            onChange(
              "ActualSellingPrice",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>

      <div className="header-actions">
        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Tyre"}
        </button>
        {onCancel ? (
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
