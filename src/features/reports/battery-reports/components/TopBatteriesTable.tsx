import React from "react"
import type { TopBatteryModel } from "../models/batteryReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface TopBatteriesTableProps {
  batteries: TopBatteryModel[]
}

export const TopBatteriesTable: React.FC<TopBatteriesTableProps> = ({ batteries }) => {
  return (
    <article className="panel panel-strong report-table-card">
      <div className="card-header-clean">
        <div>
          <span className="eyebrow">Commercial Volume</span>
          <h3>Top Selling Battery Models</h3>
        </div>
        <span className="badge-count">{batteries.length} Products</span>
      </div>

      {batteries.length === 0 ? (
        <p className="report-empty-message">
          No battery sales recorded in this period.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Specification</th>
                <th>Segment</th>
                <th className="text-right">Units Sold</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">On-Hand Stock</th>
              </tr>
            </thead>
            <tbody>
              {batteries.map((b, idx) => (
                <tr key={b.batteryId}>
                  <td><strong>{idx + 1}</strong></td>
                  <td><strong>{b.brand}</strong></td>
                  <td>{b.model}</td>
                  <td><span className="stat-badge">{b.specification}</span></td>
                  <td>{b.application}</td>
                  <td className="text-right font-semibold">{b.unitsSold}</td>
                  <td className="text-right text-brand-primary font-semibold">
                    {formatLKR(b.revenue)}
                  </td>
                  <td className="text-right">
                    <span className={`status-badge-inline ${b.currentStock <= 5 ? "status-danger" : "status-approved"}`}>
                      {b.currentStock} units
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
