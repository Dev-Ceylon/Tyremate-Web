import type { StorageManagerLocationBatchRecord } from "../models/storageManager"
import { getExpiryStatusLabel } from "./StorageLocationDetailsTable"

type DOTLotsTableProps = {
  batches: StorageManagerLocationBatchRecord[]
}

export function DOTLotsTable({ batches }: DOTLotsTableProps) {
  if (batches.length === 0) {
    return <p className="table-empty">No DOT lots recorded for this tyre.</p>
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>DOT</th>
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
              <td>{batch.DOT || "—"}</td>
              <td>{batch.Qty}</td>
              <td>{batch.ManufactureDate ?? "—"}</td>
              <td>{batch.ExpiryDate ?? "—"}</td>
              <td>{batch.DaysLeft ?? "—"}</td>
              <td>{getExpiryStatusLabel(batch.DaysLeft)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}