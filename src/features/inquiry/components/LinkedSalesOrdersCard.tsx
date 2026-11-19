import { Link } from "@/lib/router"
import { useInquiryLinkedSos } from "../hooks/useInquiryLinkedSos"

type Props = {
  inquiryId: number
}

export function LinkedSalesOrdersCard({ inquiryId }: Props) {
  const { linkedSos, loading, error } = useInquiryLinkedSos(inquiryId)

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <h2>Linked Sales Orders</h2>
        <div className="header-actions">
          <span className="stat-badge">
            {linkedSos.length} sales order{linkedSos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {error ? <p className="hero-text error-text">{error}</p> : null}

      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>SO</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Approval</th>
              <th className="text-right">Total</th>
              <th className="text-right">Linked On</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Loading linked sales orders...
                </td>
              </tr>
            ) : linkedSos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No sales orders linked to this inquiry.
                </td>
              </tr>
            ) : (
              linkedSos.map((so) => (
                <tr key={so.SoID}>
                  <td>
                    <Link className="link" to={`/sales-orders/${so.SoID}`}>
                      SO #{so.SoID}
                    </Link>
                  </td>
                  <td>
                    {so.CustomerName ||
                      (so.CustomerCode ? `Customer ${so.CustomerCode}` : "-")}
                  </td>
                  <td>{so.Date || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${so.IsAdminApproved ? "status-completed" : "status-pending"}`}
                    >
                      {so.IsAdminApproved ? "Approved" : "Draft"}
                    </span>
                  </td>
                  <td className="text-right">
                    {so.TotalSale !== undefined && so.TotalSale !== null
                      ? `$${(so.TotalSale - (so.TotalDiscount ?? 0)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "-"}
                  </td>
                  <td className="text-right text-muted">{so.LinkedDate || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}