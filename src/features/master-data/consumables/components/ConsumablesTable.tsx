import type { ConsumableRecord } from "../../../../shared/models/consumables/consumable"

type ConsumablesTableProps = {
  consumables: ConsumableRecord[]
  deletingId?: number | null
  onEdit?: (consumable: ConsumableRecord) => void
  onDelete?: (consumable: ConsumableRecord) => void
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "-"
  }

  return value.toFixed(2)
}

export function ConsumablesTable({
  consumables,
  deletingId = null,
  onEdit,
  onDelete,
}: ConsumablesTableProps) {
  if (consumables.length === 0) {
    return <p className="table-empty">No consumables found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Cost Price</th>
            <th>Reorder Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {consumables.map((consumable) => (
            <tr key={consumable.Id}>
              <td>{consumable.Name || "-"}</td>
              <td>{consumable.Category || "-"}</td>
              <td>{consumable.Unit || "-"}</td>
              <td>{formatNumber(consumable.CostPrice)}</td>
              <td>{formatNumber(consumable.ReorderLevel)}</td>
              <td>{consumable.IsActive ? "Active" : "Inactive"}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(consumable)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(consumable)}
                    disabled={deletingId === consumable.Id}
                  >
                    {deletingId === consumable.Id ? "Deleting..." : "Delete"}
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
