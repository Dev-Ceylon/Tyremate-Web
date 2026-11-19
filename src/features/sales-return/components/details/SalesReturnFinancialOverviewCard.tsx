import type { SalesReturnDetails } from "../../models/salesReturn"

const formatMoney = (amount: number) => `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function SalesReturnFinancialOverviewCard({ details }: { details: SalesReturnDetails }) {
  const creditNotes = details.creditNotes ?? []
  const returnedValue = details.lines.reduce((sum, line) => sum + Number(line.LineAmount || 0), 0)
  const returnedQuantity = details.lines.reduce((sum, line) => sum + Number(line.ReturnedQty || 0), 0)
  const creditTotal = creditNotes.reduce((sum, note) => sum + Number(note.TotalAmount || 0), 0)
  const refunded = details.refunds
    .filter((refund) => !["CANCELLED", "FAILED"].includes(refund.StatusCode || ""))
    .reduce((sum, refund) => sum + Number(refund.Amount || 0), 0)
  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Financial Overview</p>
      <div className="detail-card-grid">
        <div className="detail-card-row"><span className="detail-card-key">Returned Quantity</span><span className="detail-card-val">{returnedQuantity}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Returned Tyre Value</span><span className="detail-card-val">{formatMoney(returnedValue)}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Credit Notes</span><span className="detail-card-val">{formatMoney(creditTotal)}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Refunds Recorded</span><span className="detail-card-val">{formatMoney(refunded)}</span></div>
      </div>
    </div>
  )
}
