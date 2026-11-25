import { Link, useNavigate } from "@/lib/router"
import PermissionGate from "../../../shared/components/PermissionGate"
import type { InquiryRecord } from "../models/inquiry"

type InquiryTableProps = {
  data: InquiryRecord[]
  deletingId: number | null
  onDelete: (id: number) => void
}

export const InquiryTable = ({ data, deletingId, onDelete }: InquiryTableProps) => {
  const navigate = useNavigate()
  
  if (data.length === 0) {
    return <p className="table-empty">No inquiries found.</p>
  }

  return (
    <div className="table-scroll tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Category</th>
            <th>Customer</th>
            <th>Notes</th>
            <th className="text-center">Status</th>
            <th className="text-center">Converted SO</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((inquiry) => {
            const isDeleting = deletingId === inquiry.InquiryID
            const isBattery = (inquiry.Category || "tyre").toLowerCase() === "battery"
          
            return (
              <tr key={inquiry.InquiryID}>
                <td className="mono-text">#{inquiry.InquiryID}</td>
                <td className="secondary-text">{inquiry.Date}</td>
                <td>
                  <span className={`status-badge ${isBattery ? "status-pending" : "status-approved"}`}>
                    {isBattery ? "Batteries" : "Tyres"}
                  </span>
                </td>
                <td>
                  <span className="font-medium">
                    {inquiry.Customer?.IsWalkinCustomer
                      ? inquiry.Customer.CustomerName
                      : inquiry.Customer?.CustomerName ||
                        (inquiry.CustomerID ? `Customer #${inquiry.CustomerID}` : "-")}
                  </span>
                  {inquiry.Customer?.IsWalkinCustomer ? (
                    <span className="secondary-text"> (Walk-in)</span>
                  ) : null}
                </td>
                <td className="secondary-text">
                  {inquiry.Notes ? (
                    <span className="text-truncate inq-notes-truncate">
                      {inquiry.Notes}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="text-center">
                  {inquiry.IsCompleted ? (
                    <span className="status-badge status-completed">Completed</span>
                  ) : inquiry.IsAdminApproved ? (
                    <span className="status-badge status-approved">Approved</span>
                  ) : (
                    <span className="status-badge status-pending">Pending</span>
                  )}
                </td>
                <td className="text-center">
                  {inquiry.ConvertedSOID ? (
                    <Link className="link" to={`/sales-orders/${inquiry.ConvertedSOID}`}>
                      <span className="status-badge status-completed">SO #{inquiry.ConvertedSOID}</span>
                    </Link>
                  ) : (
                    <span className="secondary-text text-xs">-</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => navigate(`/inquiries/${inquiry.InquiryID}`)}
                    >
                      View
                    </button>
                    <PermissionGate permission="inquiry.delete">
                      <button
                        type="button"
                        className="secondary-action table-action"
                        onClick={() => onDelete(inquiry.InquiryID)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </PermissionGate>
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