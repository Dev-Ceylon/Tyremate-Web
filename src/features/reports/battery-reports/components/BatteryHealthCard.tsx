import React from "react"
import type { BatteryHealthAlert } from "../models/batteryReport"

interface BatteryHealthCardProps {
  alerts: BatteryHealthAlert[]
}

export const BatteryHealthCard: React.FC<BatteryHealthCardProps> = ({ alerts }) => {
  const getBadgeClass = (status: BatteryHealthAlert["status"]) => {
    switch (status) {
      case "EXPIRED":
        return "status-badge-inline status-danger"
      case "CRITICAL":
        return "status-badge-inline status-pending"
      case "WARNING":
        return "status-badge-inline status-draft"
      case "GOOD":
      default:
        return "status-badge-inline status-approved"
    }
  }

  return (
    <article className="panel panel-strong report-table-card">
      <div className="card-header-clean">
        <div>
          <span className="eyebrow">Inventory Health &amp; Expiry Control</span>
          <h3>Battery Batches Shelf-Life &amp; Maintenance Status</h3>
        </div>
        <span className="badge-count">{alerts.length} Batches</span>
      </div>

      {alerts.length === 0 ? (
        <p className="report-empty-message">
          All battery batches are within healthy shelf-life intervals. No maintenance alerts.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Battery</th>
                <th>Location</th>
                <th>Stock Qty</th>
                <th>Mfg Date</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.batchId}>
                  <td><code>{a.batchCode}</code></td>
                  <td><strong>{a.brand}</strong> {a.model} ({a.specification})</td>
                  <td>{a.locationName}</td>
                  <td><strong>{a.qty} units</strong></td>
                  <td>{a.mfgDate || "-"}</td>
                  <td>{a.expiryDate}</td>
                  <td>
                    {a.daysUntilExpiry < 0 ? (
                      <span className="text-danger font-semibold">
                        Expired {Math.abs(a.daysUntilExpiry)} days ago
                      </span>
                    ) : (
                      <span>{a.daysUntilExpiry} days</span>
                    )}
                  </td>
                  <td>
                    <span className={getBadgeClass(a.status)}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}
