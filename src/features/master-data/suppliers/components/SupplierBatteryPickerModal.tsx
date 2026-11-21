import { useEffect, useMemo, useState } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import { formatBatteryLabel } from "../../../../shared/battery/models/batteryDisplay"
import { CreateBatteryDialog } from "../../batteries/components/CreateBatteryDialog"
import type { BatteryRecord } from "../../batteries/models/battery"
import type { SupplierBatteryAssociation } from "../models/supplier"

type SupplierBatteryPickerModalProps = {
  isOpen: boolean
  selectedBatteries: SupplierBatteryAssociation[]
  availableBatteries: BatteryRecord[]
  loading?: boolean
  error?: string | null
  onApply: (batteries: SupplierBatteryAssociation[]) => void
  onClose: () => void
  onBatteryCreated?: (battery: BatteryRecord) => void
}

export function SupplierBatteryPickerModal({
  isOpen,
  selectedBatteries,
  availableBatteries,
  loading = false,
  error = null,
  onApply,
  onClose,
  onBatteryCreated,
}: SupplierBatteryPickerModalProps) {
  const [draftBatteries, setDraftBatteries] =
    useState<SupplierBatteryAssociation[]>(selectedBatteries)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isCreateBatteryOpen, setIsCreateBatteryOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDraftBatteries(selectedBatteries)
      setValidationError(null)
    }
  }, [isOpen, selectedBatteries])

  const draftBatteriesById = useMemo(
    () => new Map(draftBatteries.map((b) => [b.BatteryID, b])),
    [draftBatteries],
  )

  const toggleBattery = (battery: BatteryRecord) => {
    setValidationError(null)
    setDraftBatteries((current) => {
      const existing = current.find((item) => item.BatteryID === battery.Id)

      if (existing) {
        return current.filter((item) => item.BatteryID !== battery.Id)
      }

      return [
        ...current,
        {
          BatteryID: battery.Id,
          Price: null,
          Brand: battery.Brand ?? null,
          Model: battery.Model ?? null,
          Series: battery.Series ?? null,
          Voltage: battery.Voltage ?? null,
          Capacity: battery.Capacity ?? null,
          Technology: battery.Technology ?? null,
          Application: battery.Application ?? null,
          WarrantyMonths: battery.WarrantyMonths ?? null,
        },
      ]
    })
  }

  const updatePrice = (batteryId: number, value: string) => {
    setValidationError(null)
    setDraftBatteries((current) =>
      current.map((item) =>
        item.BatteryID === batteryId
          ? { ...item, Price: value === "" ? null : Number(value) }
          : item,
      ),
    )
  }

  const handleApply = () => {
    const invalidBattery = draftBatteries.find(
      (item) =>
        item.Price === null || !Number.isFinite(item.Price) || item.Price < 0,
    )

    if (invalidBattery) {
      setValidationError(
        `Enter a valid price for battery ${invalidBattery.BatteryID}.`,
      )
      return
    }

    onApply(draftBatteries)
    onClose()
  }

  const handleBatteryCreated = (battery: BatteryRecord) => {
    onBatteryCreated?.(battery)
    setDraftBatteries((current) => {
      if (current.find((item) => item.BatteryID === battery.Id)) {
        return current
      }

      return [
        ...current,
        {
          BatteryID: battery.Id,
          Price: null,
          Brand: battery.Brand ?? null,
          Model: battery.Model ?? null,
          Series: battery.Series ?? null,
          Voltage: battery.Voltage ?? null,
          Capacity: battery.Capacity ?? null,
          Technology: battery.Technology ?? null,
          Application: battery.Application ?? null,
          WarrantyMonths: battery.WarrantyMonths ?? null,
        },
      ]
    })
  }

  return (
    <AppModal isOpen={isOpen} title="Assign Batteries" onClose={onClose}>
      {loading ? <p className="hero-text">Loading batteries...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {validationError ? <p className="hero-text">{validationError}</p> : null}

      {!loading && !error && availableBatteries.length === 0 ? (
        <p className="table-empty">No batteries found.</p>
      ) : null}

      {!loading && availableBatteries.length > 0 ? (
        <div className="supplier-tyre-options">
          {availableBatteries.map((battery) => {
            const selectedBattery = draftBatteriesById.get(battery.Id)
            const isSelected = Boolean(selectedBattery)

            return (
              <label
                key={battery.Id}
                className={`supplier-tyre-option ${isSelected ? "supplier-tyre-option-selected" : ""}`}
              >
                <div className="supplier-tyre-option-main">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBattery(battery)}
                  />
                  <span
                    title={formatBatteryLabel(battery, {
                      preset: "full",
                      showId: true,
                    })}
                  >
                    {formatBatteryLabel(battery, {
                      preset: "full",
                      showId: true,
                    })}
                  </span>
                </div>
                {isSelected ? (
                  <input
                    className="text-input supplier-tyre-price-input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter price"
                    value={selectedBattery?.Price ?? ""}
                    onChange={(event) =>
                      updatePrice(battery.Id, event.target.value)
                    }
                  />
                ) : null}
              </label>
            )
          })}
        </div>
      ) : null}

      <div className="header-actions contractor-tyre-modal-actions">
        <button className="secondary-action" type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setIsCreateBatteryOpen(true)}
          disabled={loading}
        >
          Add New Battery
        </button>
        <button
          className="primary-action"
          type="button"
          onClick={handleApply}
          disabled={loading}
        >
          Apply
        </button>
      </div>

      <CreateBatteryDialog
        isOpen={isCreateBatteryOpen}
        onClose={() => setIsCreateBatteryOpen(false)}
        onCreated={handleBatteryCreated}
        hideSupplier={true}
      />
    </AppModal>
  )
}
