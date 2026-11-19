import { Link } from "@/lib/router"
import type { SoLinkedInquiryRecord } from "../../inquiry/models/inquirySo"

type Props = {
  inquiries?: SoLinkedInquiryRecord[]
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

      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Inquiry</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Approval</th>
              <th className="text-right">Linked On</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No inquiries linked to this sales order.
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
                    {inquiry.CustomerName ||
                      (inquiry.CustomerID ? `Customer #${inquiry.CustomerID}` : "Walk-in")}
                  </td>
                  <td>{inquiry.Date || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${inquiry.IsAdminApproved ? "status-completed" : "status-pending"}`}
                    >
                      {inquiry.IsAdminApproved ? "Approved" : "Draft"}
                    </span>
                  </td>
                  <td className="text-right text-muted">{inquiry.LinkedDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}