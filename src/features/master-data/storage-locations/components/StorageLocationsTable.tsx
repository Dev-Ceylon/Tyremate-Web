import type { StorageLocationRecord } from "../models/storageLocation"

type StorageLocationsTableProps = {
  storageLocations: StorageLocationRecord[]
  deletingStorageLocationId?: number | null
  onEdit?: (storageLocation: StorageLocationRecord) => void
  onDelete?: (storageLocation: StorageLocationRecord) => void
}

export function StorageLocationsTable({
  storageLocations,
  deletingStorageLocationId = null,
  onEdit,
  onDelete,
}: StorageLocationsTableProps) {
  if (storageLocations.length === 0) {
    return <p className="table-empty">No storage locations found.</p>
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
          {storageLocations.map((storageLocation) => (
            <tr key={storageLocation.Id}>
              <td>{storageLocation.LocationCode || "-"}</td>
              <td>{storageLocation.LocationName || "-"}</td>
              <td>{storageLocation.LocationType || "-"}</td>
              <td>{storageLocation.Branch || "-"}</td>
              <td>{storageLocation.Capacity ?? 0}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(storageLocation)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(storageLocation)}
                    disabled={deletingStorageLocationId === storageLocation.Id}
                  >
                    {deletingStorageLocationId === storageLocation.Id ? "Deleting..." : "Delete"}
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
