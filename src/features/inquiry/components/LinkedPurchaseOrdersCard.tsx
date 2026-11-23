import { Link } from "@/lib/router"
import type { LinkedPoRecord } from "../models/inquiryPo"

type Props = {
  pos?: LinkedPoRecord[]
}

export function LinkedPurchaseOrdersCard({ pos }: Props) {
  const rows = pos ?? []

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <h2>Linked Purchase Orders</h2>
        <div className="header-actions">
          <span className="stat-badge">
            {rows.length} purchase order{rows.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th>Admin Approval</th>
              <th className="text-right">Lines</th>
              <th className="text-right">Linked On</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No purchase orders linked to this inquiry.
                </td>
              </tr>
            ) : (
              rows.map((po) => {
                const isBattery = (po.Category || "tyre").toLowerCase() === "battery"
                return (
                  <tr key={po.ID}>
                    <td>
                      <Link className="link" to={`/purchase-orders/${po.ID}`}>
                        PO #{po.ID}
                      </Link>
                    </td>
                    <td>
                      <span className={`status-badge ${isBattery ? "status-pending" : "status-approved"}`}>
                        {isBattery ? "Batteries" : "Tyres"}
                      </span>
                    </td>
                    <td>{po.Date || "-"}</td>
                    <td>
                      <span className="font-medium">{po.StatusName || po.StatusCode || "-"}</span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${po.IsAdminApproved ? "status-completed" : "status-pending"}`}
                      >
                        {po.IsAdminApproved ? "Approved" : "Draft"}
                      </span>
                    </td>
                    <td className="text-right font-medium">{po.LineCount ?? 0}</td>
                    <td className="text-right text-muted">{po.LinkedDate || "-"}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
