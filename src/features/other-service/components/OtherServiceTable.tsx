import { useNavigate } from "@/lib/router"
import type { OtherServiceRecord } from "../models/otherService"

type OtherServiceTableProps = {
  data: OtherServiceRecord[]
  deletingId: number | null
  onDelete: (id: number) => void
}

export const OtherServiceTable = ({ data, deletingId, onDelete }: OtherServiceTableProps) => {
  const navigate = useNavigate()

  if (data.length === 0) {
    return <p className="table-empty">No other services found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th className="text-right">Total Amount</th>
            <th className="text-center">Service Status</th>
            <th className="text-center">Payment Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((os) => {
            const isDeleting = deletingId === os.OSID
            const customerLabel = os.CustomerName || os.AdHocCustomerName || "-"

            return (
              <tr key={os.OSID}>
                <td className="mono-text">#{os.OSID}</td>
                <td className="secondary-text">{os.Date}</td>
                <td>
                  <span className="font-medium">{customerLabel}</span>
                </td>
                <td className="text-right font-bold">
                  Rs {(os.TotalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="text-center">
                  {os.IsCompleted ? (
                    <span className="status-badge status-completed">Completed</span>
                  ) : (
                    <span className="status-badge status-pending">In Progress</span>
                  )}
                </td>
                <td className="text-center">
                  {os.IsPaymentCompleted ? (
                    <span className="status-badge status-approved">Paid</span>
                  ) : (
                    <span className="status-badge status-pending">Unpaid</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => navigate(`/other-service/${os.OSID}`)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => onDelete(os.OSID)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
