import React from "react"
import { Building2} from "lucide-react"
import type { TopSupplierItem } from "../models/poReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface TopSuppliersTableProps {
  suppliers: TopSupplierItem[]
  totalNetSpend: number
}

export const TopSuppliersTable: React.FC<TopSuppliersTableProps> = ({ suppliers, totalNetSpend }) => {
  return (
    <article className="panel panel-strong report-table-card">
      <div className="table-panel-header">
        <div>
          <span className="eyebrow">Supplier Leaderboard</span>
          <h2>Top Suppliers by Procurement Spend</h2>
        </div>
        <span className="badge-count">{suppliers.length} Major Suppliers</span>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Supplier Name</th>
              <th>Supplier Code</th>
              <th className="text-right">Purchase Orders</th>
              <th className="text-right">Units Supplied</th>
              <th className="text-right">On-Time Fulfillment</th>
              <th className="text-right">Total Net Spend</th>
              <th className="text-right">Share of Spend</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No supplier procurement activity recorded in this period.
                </td>
              </tr>
            ) : (
              suppliers.map((s, idx) => {
                const sharePercent = totalNetSpend > 0 ? (s.totalSpend / totalNetSpend) * 100 : 0
                const isHighPromptness = s.onTimeDeliveryRate >= 90

                return (
                  <tr key={`${s.supplierId || s.supplierCode}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="customer-cell">
                        <Building2 size={14} className="text-muted mr-1" />
                        <strong>{s.supplierName}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="code-tag">{s.supplierCode || "SUPPLIER"}</span>
                    </td>
                    <td className="text-right">
                      <strong>{s.totalPOs}</strong> PO{s.totalPOs === 1 ? "" : "s"}
                    </td>
                    <td className="text-right">
                      <strong>{s.totalUnitsSupplied.toLocaleString()}</strong> units
                    </td>
                    <td className="text-right">
                      <span className={`status-badge-inline ${isHighPromptness ? "status-approved" : "status-pending"}`}>
                        {s.onTimeDeliveryRate}% on-time
                      </span>
                    </td>
                    <td className="text-right text-success">
                      <strong>{formatLKR(s.totalSpend)}</strong>
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
