import React from "react"

interface ProcurementValueCardProps {
  totals: {
    subtotal: number;
    totalDiscount: number;
    netTotal: number;
  }
}

export const ProcurementValueCard: React.FC<ProcurementValueCardProps> = ({ totals }) => (
  <div className="info-panel panel panel-strong">
    <p className="section-label">Procurement Value</p>
    <div className="detail-card-grid">
      <div className="detail-card-row">
        <span className="detail-card-key">Subtotal</span>
        <span className="detail-card-val">Rs {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="detail-card-row">
        <span className="detail-card-key">Applied Discounts</span>
        <span className="detail-card-val">-Rs {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="detail-card-row">
        <span className="detail-card-key">Net Payable</span>
        <span className="detail-card-val font-bold">Rs {totals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>
)