import React from "react"
import type { TopProcuredTyreItem } from "../models/poReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface TopProcuredTyresTableProps {
  tyres: TopProcuredTyreItem[]
}

export const TopProcuredTyresTable: React.FC<TopProcuredTyresTableProps> = ({ tyres }) => {
  return (
    <article className="panel panel-strong report-table-card">
      <div className="table-panel-header">
        <div>
          <span className="eyebrow">Inventory Analytics</span>
          <h2>Top Procured Tyres &amp; Specifications</h2>
        </div>
        <span className="badge-count">{tyres.length} Top Products</span>
      </div>

      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Brand</th>
              <th>Size</th>
              <th>Pattern</th>
              <th className="text-right">Units Ordered</th>
              <th className="text-right">Avg Unit Cost</th>
              <th className="text-right">Gross Spend</th>
              <th className="text-right">Net Spend</th>
            </tr>
          </thead>
          <tbody>
            {tyres.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No tyre procurement recorded in this period.
                </td>
              </tr>
            ) : (
              tyres.map((t, idx) => (
                <tr key={`${t.tyreId}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td><strong>{t.brand}</strong></td>
                  <td>{t.size}</td>
                  <td>{t.pattern}</td>
                  <td className="text-right"><strong>{t.unitsOrdered.toLocaleString()}</strong></td>
                  <td className="text-right">{formatLKR(t.averageUnitPrice)}</td>
                  <td className="text-right">{formatLKR(t.grossSpend)}</td>
                  <td className="text-right text-success"><strong>{formatLKR(t.netSpend)}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
