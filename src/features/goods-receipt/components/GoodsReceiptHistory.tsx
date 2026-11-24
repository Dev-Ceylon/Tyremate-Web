import type { GoodsReceiptLineRecord } from "../models/goodsReceipt"

interface GoodsReceiptHistoryProps {
  supplierAllocationId: number
  receipts: GoodsReceiptLineRecord[]
}

export function GoodsReceiptHistory({ supplierAllocationId, receipts }: GoodsReceiptHistoryProps) {
  const allocationReceipts = receipts.filter(
    (receipt) =>
      receipt.PoTyresSupplierID === supplierAllocationId ||
      receipt.PoBatterySupplierID === supplierAllocationId
  )
  const isBattery = allocationReceipts.some((r) => r.PoBatteriesID || r.PoBatterySupplierID)

  return (
    <section className="grn-history-section">
      <h3>Goods Receipt History</h3>
      {allocationReceipts.length > 0 ? (
        <div className="expanded-table-wrap">
          <div className="tm-table-scroll">
            <table className="product-table expanded-allocation-table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Date</th>
                  <th>Delivery note</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Accepted</th>
                  <th className="text-right">Damaged</th>
                  <th className="text-right">Short / over</th>
                  <th>{isBattery ? "Batches" : "DOT batches"}</th>
                </tr>
              </thead>
              <tbody>
                {allocationReceipts.map((receipt) => (
                  <tr key={receipt.GoodsReceiptLineID}>
                    <td>{receipt.GRNNumber}</td>
                    <td>{receipt.ReceiptDate}</td>
                    <td>{receipt.DeliveryNoteNumber || "-"}</td>
                    <td className="text-right">{receipt.ReceivedQty}</td>
                    <td className="text-right">{receipt.AcceptedQty}</td>
                    <td className="text-right">{receipt.DamagedQty}</td>
                    <td className="text-right">{receipt.ShortageQty} / {receipt.OverReceiptQty}</td>
                    <td>
                      {receipt.Batches.length > 0
                        ? receipt.Batches.map(
                            (batch) =>
                              `${batch.BatchCode || batch.DOT || (isBattery ? "No Batch" : "No DOT")}: ${batch.AcceptedQty}/${batch.ReceivedQty}`
                          ).join(", ")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="secondary-text expanded-empty-state">No goods receipts posted for this supplier allocation.</p>
      )}
    </section>
  )
}
