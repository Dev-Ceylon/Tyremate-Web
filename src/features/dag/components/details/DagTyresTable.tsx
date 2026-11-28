import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type { DagSerialInput } from "../../hooks/useDagDetails"
import type { DagDetailedRecord } from "../../models/dag"
import { formatCurrency } from "../../utils/dagDetails"

type DagTyresTableProps = {
  dag: DagDetailedRecord
  serialInputs: Record<number, DagSerialInput[]>
  saving: boolean
  selectedSerialIds: number[]
  selectedCost: number
  onToggleSerial: (serialId: number) => void
  onSelectAllUnsold: () => void
  onTakeSelected: () => void
  onSerialCostChange: (tyreId: number, serialIndex: number, value: string) => void
  onSaveCosts: () => void
}

export function DagTyresTable({
  dag,
  serialInputs,
  saving,
  selectedSerialIds,
  selectedCost,
  onToggleSerial,
  onSelectAllUnsold,
  onTakeSelected,
  onSerialCostChange,
  onSaveCosts,
}: DagTyresTableProps) {
  const tyres = dag.Tyres ?? []
  const totalQty = tyres.reduce((sum, tyre) => sum + (tyre.Qty ?? 0), 0)
  const takenQty = tyres.reduce((sum, tyre) => sum + (tyre.SoldQty ?? 0), 0)
  const unsoldQty = totalQty - takenQty
  const selectionCount = selectedSerialIds.length

  return (
    <section className="table-panel panel panel-strong allocated-tyres">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Tyres</p>
          <h2>Allocated Tyres</h2>
        </div>
        <div className="header-actions">
          {unsoldQty > 0 && (
            <button className="secondary-action" type="button" onClick={onSelectAllUnsold}>
              Select all
            </button>
          )}
          <button
            className="secondary-action"
            type="button"
            onClick={onSaveCosts}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save costs"}
          </button>
        </div>
      </div>

      <div className="allocated-tyres-stats">
        <div className="allocated-tyres-stat">
          <span className="allocated-tyres-stat-label">Total tyres</span>
          <span className="allocated-tyres-stat-value">{totalQty}</span>
        </div>
        <div className="allocated-tyres-stat is-taken">
          <span className="allocated-tyres-stat-label">Taken</span>
          <span className="allocated-tyres-stat-value">{takenQty}</span>
        </div>
        <div className="allocated-tyres-stat is-remaining">
          <span className="allocated-tyres-stat-label">Remaining</span>
          <span className="allocated-tyres-stat-value">{unsoldQty}</span>
        </div>
      </div>

      <div className="allocated-tyres-table-wrap">
        <div className="tm-table-scroll">
          <table className="product-table allocated-tyres-table">
            <thead>
              <tr>
                <th>Tyre</th>
                <th>Storage Location</th>
                <th className="text-right">Qty</th>
                <th>Serial Numbers</th>
              </tr>
            </thead>
            <tbody>
              {tyres.length === 0 ? (
                <tr>
                  <td colSpan={4} className="allocated-tyres-empty">
                    No tyres allocated to this DAG.
                  </td>
                </tr>
              ) : (
                tyres.map((item) => {
                  const rowSerials = serialInputs[item.ID] ?? []
                  const soldQty = item.SoldQty ?? 0
                  const progress = item.Qty > 0 ? Math.round((soldQty / item.Qty) * 100) : 0

                  return (
                    <tr key={item.ID}>
                      <td>
                        <div className="tyre-cell">
                          <span className="tyre-monogram">
                            {(item.TyreName || "?").charAt(0)}
                          </span>
                          <div className="tyre-cell-text">
                            <div className="font-semibold">{item.TyreName || "Unknown Tyre"}</div>
                            <div className="cell-sub">{item.TyreCode || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{item.StorageLocationName || "N/A"}</div>
                        <div className="cell-sub">{item.StorageLocationCode || "-"}</div>
                      </td>
                      <td className="text-right">
                        <div className="qty-cell">
                          <span className="qty-value">{item.Qty}</span>
                          <span className="qty-meta">{soldQty} taken</span>
                        </div>
                        <div className="qty-progress">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                      <td>
                        {rowSerials.length > 0 ? (
                          <div className="serial-chip-list">
                            {rowSerials.map((serial, serialIndex) => {
                              const isTaken = !!serial.SoldAt
                              const isSelected = selectedSerialIds.includes(serial.ID)
                              const chipClass = `serial-chip${isTaken ? " is-taken" : ""}${
                                isSelected ? " is-selected" : ""
                              }`
                              const serialLabel = serial.SerialNumber || serialIndex + 1

                              return (
                                <div key={serial.ID} className={chipClass}>
                                  {isTaken ? (
                                    <StatusBadge label="Taken" tone="completed" />
                                  ) : (
                                    <label className="serial-chip-check">
                                      <input
                                        type="checkbox"
                                        aria-label={`Select serial ${serialLabel}`}
                                        checked={isSelected}
                                        onChange={() => onToggleSerial(serial.ID)}
                                      />
                                    </label>
                                  )}
                                  <span className="serial-chip-code">{serial.SerialNumber || "-"}</span>
                                  <div className="serial-chip-cost">
                                    <span className="serial-chip-currency">Rs</span>
                                    <input
                                      className="serial-chip-input"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      aria-label={`DAG cost for serial ${serialLabel}`}
                                      value={serial.DAGCost ?? ""}
                                      disabled={isTaken}
                                      onChange={(event) =>
                                        onSerialCostChange(item.ID, serialIndex, event.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="cell-sub">Not allocated</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectionCount > 0 && (
        <div className="allocated-tyres-take-bar">
          <div className="allocated-tyres-take-summary">
            <span className="stat-badge">{selectionCount} selected</span>
            <span className="allocated-tyres-take-total">Rs {formatCurrency(selectedCost)}</span>
          </div>
          <button className="primary-action" type="button" onClick={onTakeSelected}>
            Take Selected
          </button>
        </div>
      )}
    </section>
  )
}
