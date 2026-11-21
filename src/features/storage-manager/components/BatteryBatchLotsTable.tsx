import type { BatteryStorageManagerLocationBatchRecord } from "../models/batteryStorageManager"

export function getBatteryExpiryStatusLabel(daysLeft?: number | null) {
  if (daysLeft === undefined || daysLeft === null) {
    return <span className="status-badge status-draft">No data</span>
  }

  if (daysLeft < 0) {
    return <span className="status-badge status-rejected">Expired</span>
  }

  if (daysLeft <= 30) {
    return <span className="status-badge status-pending">Expiring soon</span>
  }

  return <span className="status-badge status-completed">OK</span>
}

type BatteryBatchLotsTableProps = {
  batches: BatteryStorageManagerLocationBatchRecord[]
}

export function BatteryBatchLotsTable({ batches }: BatteryBatchLotsTableProps) {
  if (batches.length === 0) {
    return <p className="table-empty">No batch lots recorded for this battery.</p>
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Batch Code</th>
            <th>Qty</th>
            <th>Manufacture Date</th>
            <th>Expiry Date</th>
            <th>Days Left</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.Id}>
              <td>{batch.BatchCode || "—"}</td>
              <td>{batch.Qty}</td>
              <td>{batch.MfgDate || batch.ManufactureDate || "—"}</td>
              <td>{batch.ExpiryDate || "—"}</td>
              <td>
                {batch.DaysLeft !== null && batch.DaysLeft !== undefined
                  ? `${batch.DaysLeft} d`
                  : "—"}
              </td>
              <td>{getBatteryExpiryStatusLabel(batch.DaysLeft)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
