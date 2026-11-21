import type { ChangeEvent, FormEvent } from "react"
import type { SupplierRecord } from "../../suppliers/models/supplier"
import type { BatteryPayload } from "../models/battery"
import { BATTERY_APPLICATION_OPTIONS } from "../constants/batteryConstants"
import { SuggestionInput } from "../../../../shared/ui/suggestion/SuggestionInput"

type BatteryFormProps = {
  formData: BatteryPayload
  onChange: <K extends keyof BatteryPayload>(
    field: K,
    value: BatteryPayload[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitting?: boolean
  suppliers: SupplierRecord[]
  hideSupplier?: boolean
  fetchSuggestions?: (field: string, query: string) => Promise<string[]>
}

export function BatteryForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  suppliers,
  hideSupplier = false,
  fetchSuggestions,
}: BatteryFormProps) {
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
            placeholder="e.g. Lucas"
            required
          />
        ) : (
          <input
            className="text-input"
            type="text"
            value={formData.Brand ?? ""}
            onChange={(event) => onChange("Brand", event.target.value)}
            placeholder="e.g. Lucas"
            required
          />
        )}
      </label>

      <label className="field-label">
        Model
        {fetchSuggestions ? (
          <SuggestionInput
            label="Model"
            hideLabel
            value={formData.Model ?? ""}
            onChange={(v) => onChange("Model", v)}
            fetchSuggestions={(q) => fetchSuggestions("Model", q)}
            placeholder="e.g. LU-12XL5B or LL-12XL2.5C"
            required
          />
        ) : (
          <input
            className="text-input"
            type="text"
            value={formData.Model ?? ""}
            onChange={(event) => onChange("Model", event.target.value)}
            placeholder="e.g. LU-12XL5B or LL-12XL2.5C"
            required
          />
        )}
      </label>



      <label className="field-label">
        Capacity
        {fetchSuggestions ? (
          <SuggestionInput
            label="Capacity"
            hideLabel
            value={formData.Capacity ?? ""}
            onChange={(v) => onChange("Capacity", v)}
            fetchSuggestions={(q) => fetchSuggestions("Capacity", q)}
            placeholder="e.g. 5Ah, 2.5Ah, 7Ah, 9Ah"
            required
          />
        ) : (
          <input
            className="text-input"
            type="text"
            value={formData.Capacity ?? ""}
            onChange={(event) => onChange("Capacity", event.target.value)}
            placeholder="e.g. 5Ah, 2.5Ah, 7Ah, 9Ah"
            required
          />
        )}
      </label>

      <label className="field-label">
        Voltage
        {fetchSuggestions ? (
          <SuggestionInput
            label="Voltage"
            hideLabel
            value={formData.Voltage ?? ""}
            onChange={(v) => onChange("Voltage", v)}
            fetchSuggestions={(q) => fetchSuggestions("Voltage", q)}
            placeholder="e.g. 12V"
          />
        ) : (
          <input
            className="text-input"
            type="text"
            value={formData.Voltage ?? ""}
            onChange={(event) => onChange("Voltage", event.target.value)}
            placeholder="e.g. 12V"
          />
        )}
      </label>



      <label className="field-label">
        Application
        <select
          className="text-input"
          value={formData.Application ?? ""}
          onChange={(event) =>
            onChange("Application", event.target.value === "" ? null : event.target.value)
          }
        >
          <option value="">Select an application</option>
          {BATTERY_APPLICATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Warranty (Months)
        <input
          className="text-input"
          type="number"
          min={0}
          value={formData.WarrantyMonths ?? ""}
          onChange={(event) =>
            onChange(
              "WarrantyMonths",
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      </label>



      {!hideSupplier && (
        <label className="field-label">
          Supplier
          <select
            className="text-input"
            value={selectedSupplierValue}
            onChange={handleSupplierChange}
          >
            <option value="">Select a supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.SupplierID} value={supplier.SupplierID}>
                {[supplier.SupplierCode, supplier.Name].filter(Boolean).join(" - ")}
              </option>
            ))}
          </select>
          {!hasSuppliers ? <small>No suppliers available to link.</small> : null}
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

      <div className="form-actions">
        <button
          className="primary-action"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Saving..." : "Save Battery"}
        </button>
        {onCancel ? (
          <button
            className="secondary-action"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
