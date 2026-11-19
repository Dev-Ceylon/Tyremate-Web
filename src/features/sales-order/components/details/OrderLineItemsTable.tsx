import type { SoDetailedRecord, SoTyreRecord } from "../../models/salesOrder"

type OrderLineItemsTableProps = {
  order: SoDetailedRecord
  netTotal: number
  onReturn: (tyre: SoTyreRecord) => void
  disabled?: boolean
}

export function OrderLineItemsTable({ order, netTotal, onReturn, disabled = false }: OrderLineItemsTableProps) {
  const lines = order.Tyres ?? []
  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <h2>Order Line Items</h2>
        <div className="header-actions">
          <span className="stat-badge">{lines.length} line{lines.length !== 1 ? "s" : ""}</span>
          <span className="stat-badge">${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Tyre (Brand / Size - Pattern)</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Disc %</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Returned Qty</th>
              <th className="text-right">To Order</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((tyre) => (
              <tr key={tyre.ID}>
                <td>
                  <span className="font-medium">
                    {tyre.Brand || "NA"} / {tyre.Size || "NA"} - {tyre.Pattern || "NA"}
                  </span>
                </td>
                <td className="text-right">${tyre.Price.toLocaleString()}</td>
                <td className="text-right">{tyre.Discount}%</td>
                <td className="text-right font-bold">{tyre.Qty}</td>
                <td className="text-right">{tyre.returnedQty ?? 0}</td>
                <td className="text-right">
                  <span className={tyre.NeedToOrderQty > 0 ? "text-danger font-bold" : ""}>
                    {tyre.NeedToOrderQty}
                  </span>
                </td>
                <td className="text-right">
                  {tyre.reTurnCompleted === 1 || tyre.reTurnCompleted === true ? (
                    <span className="status-badge status-completed">Returned</span>
                  ) : (
                    <button
                      className="secondary-action table-action"
                      onClick={() => onReturn(tyre)}
                      disabled={disabled}
                      title="Initiate tyre return"
                    >
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
