import type { BatteryLocationRecord } from "../models/batteryLocation"

type BatteryLocationsTableProps = {
  locations: BatteryLocationRecord[]
  deletingId?: number | null
  onEdit?: (location: BatteryLocationRecord) => void
  onDelete?: (location: BatteryLocationRecord) => void
}

export function BatteryLocationsTable({
  locations,
  deletingId = null,
  onEdit,
  onDelete,
}: BatteryLocationsTableProps) {
  if (locations.length === 0) {
    return <p className="table-empty">No battery locations found.</p>
  }

  return (
    <div className="tm-table-scroll">
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
    </div>
  )
}
