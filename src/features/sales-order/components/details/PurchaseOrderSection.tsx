import {
  STATUS_CODES,
  getStatusName,
  getStatusColorClass,
} from "../../../../shared/constants/statusConstants"
import type { SoDetailedRecord } from "../../models/salesOrder"

type PurchaseOrderSectionProps = {
  order: SoDetailedRecord
}

export function PurchaseOrderSection({ order }: PurchaseOrderSectionProps) {
  const po = order.PO
  if (!po) return null

  const isBattery = po.Category === "battery"
  const items = isBattery ? (po.Batteries ?? []) : (po.Tyres ?? [])
  const hasPartialReceipt =
    po.IsPartiallyReceived ||
    items.some((t: any) => (t.ReceivedQty ?? 0) > 0 && (t.ReceivedQty ?? 0) < t.Qty)
  const isPoCompletedOrArrived =
    po.StatusCode === STATUS_CODES.COMPLETED || po.StatusCode === STATUS_CODES.ARRIVED

  return (
    <section className="table-panel panel panel-strong mt-6 border-accent">
      <div className="table-panel-header">
        <div>
          <p className="section-label text-accent">Linked Fulfillment</p>
          <h2>Automatic Purchase Order #{po.ID}</h2>
        </div>
        <div className="header-actions">
          {po.TotalReceived !== undefined && po.TotalReceived > 0 && (
            <span
              className={`stat-badge ${
                po.TotalReceived >= (po.TotalOrdered ?? 0) ? "status-completed" : "text-accent"
              }`}
            >
              {po.TotalReceived} / {po.TotalOrdered ?? 0} {isBattery ? "Batteries" : "Tyres"} Received
            </span>
          )}
          <span
            className={`status-badge ${
              hasPartialReceipt && !isPoCompletedOrArrived
                ? "status-arriving"
                : getStatusColorClass(po.StatusCode ?? "")
            }`}
          >
            {hasPartialReceipt && !isPoCompletedOrArrived
              ? "Partially Arrived"
              : getStatusName(po.StatusCode ?? "")}
          </span>
        </div>
      </div>
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>{isBattery ? "Battery (Brand / Model - Specs)" : "Tyre (Size - Pattern)"}</th>
              <th className="text-right">Ordered Qty</th>
              <th className="text-right">Received Qty</th>
              <th className="text-right">Pending Qty</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((pItem: any) => {
              const received = pItem.ReceivedQty ?? 0
              const pending = pItem.PendingQty ?? Math.max(0, pItem.Qty - received)
              const isLineFullyArrived = received >= pItem.Qty
              const isLinePartiallyArrived = received > 0 && received < pItem.Qty

              return (
                <tr key={pItem.ID}>
                  <td>
                    <span className="font-medium">
                      {isBattery
                        ? `${pItem.Brand || "NA"} / ${pItem.Model || "NA"} (${pItem.Capacity || "NA"} ${pItem.Voltage || "NA"})`
                        : `${pItem.Size} - ${pItem.Pattern}`}
                    </span>
                  </td>
                  <td className="text-right">{pItem.Qty}</td>
                  <td className="text-right font-bold">
                    <span className={received > 0 ? "text-success" : ""}>
                      {received}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={pending > 0 ? "text-danger font-bold" : ""}>
                      {pending}
                    </span>
                  </td>
                  <td className="text-center">
                    {isLineFullyArrived ? (
                      <span className="status-badge status-completed">Arrived</span>
                    ) : isLinePartiallyArrived ? (
                      <span className="status-badge status-arriving">Partially Arrived</span>
                    ) : (
                      <span
                        className={`status-badge ${getStatusColorClass(
                          pItem.StatusCode ?? po.StatusCode ?? ""
                        )}`}
                      >
                        {getStatusName(pItem.StatusCode ?? po.StatusCode ?? "")}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
