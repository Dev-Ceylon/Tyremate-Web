import type { SoDetailedRecord, SoTyreRecord, SoBatteryRecord } from "../../models/salesOrder"

type OrderLineItemsTableProps = {
  order: SoDetailedRecord
  netTotal: number
  onReturn: (item: any) => void
  disabled?: boolean
}

export function OrderLineItemsTable({ order, netTotal, onReturn, disabled = false }: OrderLineItemsTableProps) {
  const isBattery = order.Category === "battery"
  const lines = isBattery ? (order.Batteries ?? []) : (order.Tyres ?? [])
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
              <th>{isBattery ? "Battery (Brand / Model - Capacity Voltage)" : "Tyre (Brand / Size - Pattern)"}</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Disc %</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Returned Qty</th>
              <th className="text-right">To Order</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((item: any) => (
              <tr key={item.ID}>
                <td>
                  <span className="font-medium">
                    {isBattery
                      ? `${item.Brand || "NA"} / ${item.Model || "NA"} - ${item.Capacity || "NA"} ${item.Voltage || "NA"}`
                      : `${item.Brand || "NA"} / ${item.Size || "NA"} - ${item.Pattern || "NA"}`}
                  </span>
                </td>
                <td className="text-right">${item.Price.toLocaleString()}</td>
                <td className="text-right">{item.Discount}%</td>
                <td className="text-right font-bold">{item.Qty}</td>
                <td className="text-right">{item.returnedQty ?? 0}</td>
                <td className="text-right">
                  <span className={item.NeedToOrderQty > 0 ? "text-danger font-bold" : ""}>
                    {item.NeedToOrderQty}
                  </span>
                </td>
                <td className="text-right">
                  {item.reTurnCompleted === 1 || item.reTurnCompleted === true ? (
                    <span className="status-badge status-completed">Returned</span>
                  ) : (
                    <button
                      className="secondary-action table-action"
                      onClick={() => onReturn(item)}
                      disabled={disabled}
                      title={isBattery ? "Initiate battery return" : "Initiate tyre return"}
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
