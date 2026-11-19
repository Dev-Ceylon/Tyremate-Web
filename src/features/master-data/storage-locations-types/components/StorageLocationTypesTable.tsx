import type { StorageLocationTypeRecord } from "../models/storageLocationType"

type StorageLocationTypesTableProps = {
  storageLocationTypes: StorageLocationTypeRecord[]
  deletingId?: number | null
  onEdit?: (storageLocationType: StorageLocationTypeRecord) => void
  onDelete?: (storageLocationType: StorageLocationTypeRecord) => void
}

export function StorageLocationTypesTable({
  storageLocationTypes,
  deletingId = null,
  onEdit,
  onDelete,
}: StorageLocationTypesTableProps) {
  if (storageLocationTypes.length === 0) {
    return <p className="table-empty">No storage location types found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {storageLocationTypes.map((type) => (
            <tr key={type.Id}>
              <td>{type.LocationTypeCode || "-"}</td>
              <td>{type.LocationTypeName || "-"}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(type)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(type)}
                    disabled={deletingId === type.Id}
                  >
                    {deletingId === type.Id ? "Deleting..." : "Delete"}
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