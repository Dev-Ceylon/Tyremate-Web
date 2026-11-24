import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import { formatBatteryLabel } from "../../../shared/battery/models/batteryDisplay"

type BatteryLocationDetailsCreateRowProps = {
  selectedBatteryId: number | null
  qty: number
  batchCode: string
  mfgDate: string
  expiryDate: string
  batteries: BatteryRecord[]
  availableBatteries: BatteryRecord[]
  loading: boolean
  submitting: boolean
  canSaveCreateRow: boolean
  updateField: (
    field: "selectedBatteryId" | "qty" | "batchCode" | "mfgDate" | "expiryDate",
    value: string | number | null,
  ) => void
  handleCreateStorageRow: () => Promise<void>
}

export function BatteryLocationDetailsCreateRow({
  selectedBatteryId,
  qty,
  batchCode,
  mfgDate,
  expiryDate,
  batteries,
  availableBatteries,
  loading,
  submitting,
  canSaveCreateRow,
  updateField,
  handleCreateStorageRow,
}: BatteryLocationDetailsCreateRowProps) {
  const selectedBattery = batteries.find((b) => b.Id === selectedBatteryId)

  return (
    <tr>
      <td>
        <select
          className="text-input"
          value={selectedBatteryId ?? ""}
          onChange={(event) =>
            updateField("selectedBatteryId", Number(event.target.value) || null)
          }
          disabled={loading || submitting}
        >
          <option value="">
            {availableBatteries.length > 0 ? "Select battery" : "No available batteries"}
          </option>
          {availableBatteries.map((battery) => (
            <option key={battery.Id} value={battery.Id}>
              {formatBatteryLabel(battery, { preset: "full" })}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="text-input"
          type="text"
          inputMode="numeric"
          defaultValue={qty}
          onChange={(event) =>
            updateField("qty", event.target.value === "" ? 0 : Number(event.target.value))
          }
          disabled={loading || submitting}
        />
      </td>
      <td>
        <input
          className="text-input"
          type="text"
          value={batchCode}
          onChange={(event) => updateField("batchCode", event.target.value)}
          placeholder="Batch code (opt)"
          disabled={loading || submitting}
        />
      </td>
      <td>
        <input
          className="text-input"
          type="date"
          value={mfgDate}
          onChange={(event) => updateField("mfgDate", event.target.value)}
          disabled={loading || submitting}
        />
      </td>
      <td>
        <input
          className="text-input"
          type="date"
          value={expiryDate}
          onChange={(event) => updateField("expiryDate", event.target.value)}
          disabled={loading || submitting}
        />
      </td>
      <td>{selectedBattery?.Voltage ?? "—"}</td>
      <td>{selectedBattery?.Capacity ?? "—"}</td>
      <td>{selectedBattery?.Application ?? "—"}</td>
      <td>Manual</td>
      <td>
        <button
          className="primary-action"
          type="button"
          onClick={() => void handleCreateStorageRow()}
          disabled={loading || submitting || !canSaveCreateRow}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  )
}
