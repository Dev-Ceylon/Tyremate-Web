import type { BranchRecord } from "../models/branch"

type BranchesTableProps = {
  branches: BranchRecord[]
  deletingBranchId?: number | null
  onEdit?: (branch: BranchRecord) => void
  onDelete?: (branch: BranchRecord) => void
}

export function BranchesTable({
  branches,
  deletingBranchId = null,
  onEdit,
  onDelete,
}: BranchesTableProps) {
  if (branches.length === 0) {
    return <p className="table-empty">No branches found.</p>
  }

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Contact</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {branches.map((branch) => (
          <tr key={branch.Id}>
            <td>{branch.BranchCode}</td>
            <td>{branch.BranchName}</td>
            <td>{branch.Contact || "—"}</td>
            <td>{branch.Address || "—"}</td>
            <td>
              <div className="table-actions">
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onEdit?.(branch)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onDelete?.(branch)}
                  disabled={deletingBranchId === branch.Id}
                >
                  {deletingBranchId === branch.Id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
