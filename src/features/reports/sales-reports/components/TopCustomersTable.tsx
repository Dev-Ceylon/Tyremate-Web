import React from "react"
import { Users } from "lucide-react"
import type { CustomerLeaderboardItem } from "../models/salesReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface TopCustomersTableProps {
  customers: CustomerLeaderboardItem[]
  totalNetRevenue: number
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({ customers, totalNetRevenue }) => {
  return (
    <article className="panel panel-strong report-table-card">
      <div className="table-panel-header">
        <div>
          <span className="eyebrow">Client Leaderboard</span>
          <h2>Top Accounts by Revenue</h2>
        </div>
        <span className="badge-count">{customers.length} Top Accounts</span>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer Name</th>
              <th>Customer Code</th>
              <th className="text-right">Total Orders</th>
              <th className="text-right">Total Revenue</th>
              <th className="text-right">Share of Revenue</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No customer activity recorded in this period.
                </td>
              </tr>
            ) : (
              customers.map((c, idx) => {
                const sharePercent = totalNetRevenue > 0 ? (c.totalRevenue / totalNetRevenue) * 100 : 0
                return (
                  <tr key={`${c.customerId || c.customerName}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="customer-cell">
                        <Users size={14} className="text-muted mr-1" />
                        <strong>{c.customerName}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="code-tag">{c.customerCode || "WALK-IN"}</span>
                    </td>
                    <td className="text-right">
                      <strong>{c.totalOrders}</strong> order{c.totalOrders === 1 ? "" : "s"}
                    </td>
                    <td className="text-right text-success">
                      <strong>{formatLKR(c.totalRevenue)}</strong>
                    </td>
                    <td className="text-right">
                      <span className="report-share-pill">{sharePercent.toFixed(1)}%</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
