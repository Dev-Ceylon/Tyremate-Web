import type { BankDetailRecord } from "../models/bankDetail"

type BankDetailsTableProps = {
  bankDetails: BankDetailRecord[]
  deletingId?: string | number | null
  onEdit?: (record: BankDetailRecord) => void
  onDelete?: (record: BankDetailRecord) => void
}

export function BankDetailsTable({
  bankDetails,
  deletingId = null,
  onEdit,
  onDelete,
}: BankDetailsTableProps) {
  if (bankDetails.length === 0) {
    return <p className="table-empty">No bank details found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Bank Name</th>
            <th>Account Number</th>
            <th>Account Name</th>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bankDetails.map((item) => (
            <tr key={item.ID}>
              <td>{item.BankName}</td>
              <td>{item.AccountNumber}</td>
              <td>{item.AccountName}</td>
              <td>{item.Branch}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(item)}
                    disabled={deletingId === item.ID}
                  >
                    {deletingId === item.ID ? "Deleting..." : "Delete"}
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