import React, { useState } from "react"
import type { TopProducts } from "../models/salesReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface TopProductsTableProps {
  products: TopProducts
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({ products }) => {
  const [tab, setTab] = useState<"tyres" | "dag" | "consumables">("tyres")

  return (
    <article className="panel panel-strong report-table-card">
      <div className="table-panel-header">
        <div>
          <span className="eyebrow">Product Analytics</span>
          <h2>Top Performing Products &amp; Services</h2>
        </div>

        {/* Sub tabs */}
        <div className="range-toggle" role="tablist">
          <button
            type="button"
            className={tab === "tyres" ? "active" : ""}
            onClick={() => setTab("tyres")}
          >
            Tyres ({products.tyres.length})
          </button>
          <button
            type="button"
            className={tab === "dag" ? "active" : ""}
            onClick={() => setTab("dag")}
          >
            DAG Retreads ({products.dagTyres.length})
          </button>
          <button
            type="button"
            className={tab === "consumables" ? "active" : ""}
            onClick={() => setTab("consumables")}
          >
            Consumables ({products.consumables.length})
          </button>
        </div>
      </div>

      <div className="table-responsive">
        {tab === "tyres" && (
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Pattern</th>
                <th className="text-right">Units Sold</th>
                <th className="text-right">Gross Amount</th>
                <th className="text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.tyres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No tyre sales recorded in this period.
                  </td>
                </tr>
              ) : (
                products.tyres.map((t, idx) => (
                  <tr key={`${t.tyreId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td><strong>{t.brand}</strong></td>
                    <td>{t.size}</td>
                    <td>{t.pattern}</td>
                    <td className="text-right"><strong>{t.unitsSold}</strong></td>
                    <td className="text-right">{formatLKR(t.grossRevenue)}</td>
                    <td className="text-right text-success"><strong>{formatLKR(t.netRevenue)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "dag" && (
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Pattern</th>
                <th className="text-right">Units Retreaded</th>
                <th className="text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.dagTyres.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No DAG retreads recorded in this period.
                  </td>
                </tr>
              ) : (
                products.dagTyres.map((d, idx) => (
                  <tr key={`${d.tyreId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td><strong>{d.brand}</strong></td>
                    <td>{d.size}</td>
                    <td>{d.pattern}</td>
                    <td className="text-right"><strong>{d.unitsRetreaded}</strong></td>
                    <td className="text-right text-success"><strong>{formatLKR(d.netRevenue)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "consumables" && (
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th className="text-right">Units Used</th>
                <th className="text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.consumables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No workshop consumables recorded in this period.
                  </td>
                </tr>
              ) : (
                products.consumables.map((c, idx) => (
                  <tr key={`${c.consumableId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.category}</td>
                    <td>{c.unit}</td>
                    <td className="text-right"><strong>{c.unitsUsed}</strong></td>
                    <td className="text-right text-success"><strong>{formatLKR(c.netRevenue)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </article>
  )
}
