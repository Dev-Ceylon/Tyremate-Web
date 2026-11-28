import { Link } from "@/lib/router"
import type { LinkedInquiryRecord } from "../models/inquiryPo"

type Props = {
  inquiries?: LinkedInquiryRecord[]
}

export function LinkedInquiriesCard({ inquiries }: Props) {
  const rows = inquiries ?? []

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <h2>Linked Inquiries</h2>
        <div className="header-actions">
          <span className="stat-badge">
            {rows.length} inquir{rows.length === 1 ? "y" : "ies"}
          </span>
        </div>
      </div>

      <div className="table-scroll tm-table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Inquiry</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Approval</th>
              <th>Converted SO</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No inquiries linked to this purchase order.
                </td>
              </tr>
            ) : (
              rows.map((inquiry) => (
                <tr key={inquiry.InquiryID}>
                  <td>
                    <Link className="link" to={`/inquiries/${inquiry.InquiryID}`}>
                      Inquiry #{inquiry.InquiryID}
                    </Link>
                  </td>
                  <td>
                    {inquiry.CustomerName || (inquiry.CustomerID ? `Customer #${inquiry.CustomerID}` : "Walk-in")}
                  </td>
                  <td>{inquiry.Date || "-"}</td>
                  <td>
                    {inquiry.IsCompleted ? (
                      <span className="status-badge status-completed">Completed</span>
                    ) : inquiry.IsAdminApproved ? (
                      <span className="status-badge status-approved">Approved</span>
                    ) : (
                      <span className="status-badge status-pending">Pending</span>
                    )}
                  </td>
                  <td>
                    {inquiry.ConvertedSOID ? (
                      <Link className="link" to={`/sales-orders/${inquiry.ConvertedSOID}`}>
                        SO #{inquiry.ConvertedSOID}
                      </Link>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
