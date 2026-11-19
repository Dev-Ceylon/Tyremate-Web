import type { SoDetailedRecord } from "../../models/salesOrder"

const formatMoney = (amount: number) => `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type ReturnHistorySectionProps = {
  order: SoDetailedRecord
}

export function ReturnHistorySection({ order }: ReturnHistorySectionProps) {
  const salesReturns = order.SalesReturns ?? []
  const legacyReturns = order.Returns ?? []

  // Filter out legacy returns that are already linked to a SalesReturn
  // (they're already represented by the SalesReturn record above)
  const unlinkedLegacyReturns = legacyReturns.filter(
    (item) => !item.SalesReturnID
  )

  if (salesReturns.length === 0 && unlinkedLegacyReturns.length === 0) return null

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header"><h2>Return History</h2></div>
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr><th>Record</th><th>Date</th><th>Type</th><th>Quantity</th><th>Value</th><th>Refunded</th><th>Status</th></tr>
          </thead>
          <tbody>
            {salesReturns.map((item) => (
              <tr key={`sales-return-${item.SalesReturnID}`}>
                <td>{item.ReturnNo}</td>
                <td>{item.RequestedDate || "—"}</td>
                <td>{item.ReturnTypeName || "Sales Return"}</td>
                <td>{item.TotalQty}</td>
                <td>—</td>
                <td>{item.RefundedAmount != null ? formatMoney(item.RefundedAmount) : "—"}</td>
                <td>{item.StatusName || item.StatusCode || "—"}</td>
              </tr>
            ))}
            {unlinkedLegacyReturns.map((item) => {
              const returnValue = (item.Qty || 0) * (item.Price || 0)
              return (
                <tr key={`legacy-return-${item.ID}`}>
                  <td>Legacy return #{item.ID}</td>
                  <td>{item.ReturnDate}</td>
                  <td>Pre workflow</td>
                  <td>{item.Qty}</td>
                  <td>{formatMoney(returnValue)}</td>
                  <td>—</td>
                  <td>{item.StatusName || item.StatusCode || "Historical record"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
