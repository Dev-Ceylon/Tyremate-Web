import type { ConsumableLocationRecord } from "../../../../shared/models/consumables/consumableLocation"

type ConsumableLocationsTableProps = {
  locations: ConsumableLocationRecord[]
  deletingId?: number | null
  onEdit?: (location: ConsumableLocationRecord) => void
  onDelete?: (location: ConsumableLocationRecord) => void
}

export function ConsumableLocationsTable({
  locations,
  deletingId = null,
  onEdit,
  onDelete,
}: ConsumableLocationsTableProps) {
  if (locations.length === 0) {
    return <p className="table-empty">No consumable locations found.</p>
  }

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Type</th>
          <th>Branch</th>
          <th>Capacity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {locations.map((location) => (
          <tr key={location.Id}>
            <td>{location.LocationCode || "-"}</td>
            <td>{location.LocationName || "-"}</td>
            <td>{location.LocationType || "-"}</td>
            <td>{location.Branch || "-"}</td>
            <td>{location.Capacity ?? 0}</td>
            <td>
              <div className="table-actions">
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onEdit?.(location)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onDelete?.(location)}
                  disabled={deletingId === location.Id}
                >
                  {deletingId === location.Id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
