import type { ContractorRecord } from "../models/contractor"

type ContractorsTableProps = {
  contractors: ContractorRecord[]
  deletingContractorId?: number | null
  onEdit?: (contractor: ContractorRecord) => void
  onDelete?: (contractor: ContractorRecord) => void
}

export function ContractorsTable({
  contractors,
  deletingContractorId = null,
  onEdit,
  onDelete,
}: ContractorsTableProps) {
  if (contractors.length === 0) {
    return <p className="table-empty">No contractors found.</p>
  }

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Email</th>
          <th>Address</th>
          <th>Rating</th>
          <th>Assigned Tyres</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {contractors.map((contractor) => (
          <tr key={contractor.ID}>
            <td>{contractor.Name}</td>
            <td>{contractor.Contact || "-"}</td>
            <td>{contractor.Email || "-"}</td>
            <td>{contractor.Address || "-"}</td>
            <td>{contractor.Rating ?? "-"}</td>
            <td>{contractor.Tyres?.length ?? contractor.TyreIDs?.length ?? 0}</td>
            <td>
              <div className="table-actions">
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onEdit?.(contractor)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onDelete?.(contractor)}
                  disabled={deletingContractorId === contractor.ID}
                >
                  {deletingContractorId === contractor.ID ? "Deleting..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
