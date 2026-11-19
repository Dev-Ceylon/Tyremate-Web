import { useNavigate } from "@/lib/router"
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
    <table className="product-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
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
          
          return (
            <tr key={inquiry.InquiryID}>
              <td className="mono-text">#{inquiry.InquiryID}</td>
              <td className="secondary-text">{inquiry.Date}</td>
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
                  <span className="text-truncate" style={{ maxWidth: "200px", display: "inline-block" }}>
                    {inquiry.Notes}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="text-center">
                {inquiry.IsAdminApproved ? (
                  <span className="status-badge status-approved">Approved</span>
                ) : (
                  <span className="status-badge status-pending">Draft</span>
                )}
              </td>
              <td className="text-center">
                {inquiry.ConvertedSOID ? (
                  <span className="status-badge status-completed">SO #{inquiry.ConvertedSOID}</span>
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
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete(inquiry.InquiryID)}
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
  )
}