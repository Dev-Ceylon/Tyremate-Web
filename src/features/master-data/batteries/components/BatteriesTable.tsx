import type { BatteryRecord } from "../models/battery"

type BatteriesTableProps = {
  batteries: BatteryRecord[]
  deletingBatteryId?: number | null
  onEdit?: (battery: BatteryRecord) => void
  onDelete?: (battery: BatteryRecord) => void
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "-"
  }

  return value.toFixed(2)
}

export function BatteriesTable({
  batteries,
  deletingBatteryId = null,
  onEdit,
  onDelete,
}: BatteriesTableProps) {
  if (batteries.length === 0) {
    return <p className="table-empty">No batteries found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Brand</th>
            <th>Capacity</th>
            <th>Voltage</th>
            <th>Series</th>
            <th>Warranty</th>
            <th>Supplier</th>
            <th>MRP (With VAT)</th>
            <th>Purchased Price</th>
            <th>Selling Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batteries.map((battery) => (
            <tr key={battery.Id}>
              <td className="font-semibold">{battery.Model || "-"}</td>
              <td>{battery.Brand || "-"}</td>
              <td>{battery.Capacity || "-"}</td>
              <td>{battery.Voltage || "12V"}</td>
              <td>{battery.Series || "-"}</td>
              <td>{battery.WarrantyMonths ? `${battery.WarrantyMonths} Mos` : "-"}</td>
              <td>{battery.SupplierCodes || battery.SupplierNames || "-"}</td>
              <td>{formatNumber(battery.MRP_WithVAT)}</td>
              <td>{formatNumber(battery.PurchasedPrice)}</td>
              <td>{formatNumber(battery.ActualSellingPrice)}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(battery)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(battery)}
                    disabled={deletingBatteryId === battery.Id}
                  >
                    {deletingBatteryId === battery.Id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
