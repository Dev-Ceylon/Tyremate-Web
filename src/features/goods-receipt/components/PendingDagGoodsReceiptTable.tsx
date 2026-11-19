import { ActionMenu } from "../../../shared/ui/actionMenu/ActionMenu"
import { formatTyreLabel } from "../../../shared/tyre/models/tyreDisplay"
import type { PendingDagGoodsReceiptRecord } from "../models/goodsReceipt"

type PendingDagGoodsReceiptTableProps = {
  data: PendingDagGoodsReceiptRecord[]
  onReceive: (row: PendingDagGoodsReceiptRecord) => void
  onOpenDag: (dagId: number) => void
}

export function PendingDagGoodsReceiptTable({ data, onReceive, onOpenDag }: PendingDagGoodsReceiptTableProps) {
  if (data.length === 0) {
    return <p className="table-empty">No pending goods receipts.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>DAG</th>
            <th>Customer</th>
            <th>Tyre line</th>
            <th>In quarantine</th>
            <th>Quarantine location</th>
            <th>Receiving location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.SourceStorageManagerID}>
              <td>
                <button type="button" className="text-link" onClick={() => onOpenDag(row.DAGID)}>
                  #{row.DAGID}
                </button>
              </td>
              <td>{row.CustomerName ?? "-"}</td>
              <td>{formatTyreLabel(row)}</td>
              <td className="mono-text">{row.PendingQty}</td>
              <td>
                <div>{row.QuarantineLocationName ?? "-"}</div>
                {row.QuarantineLocationCode && <div className="secondary-text">{row.QuarantineLocationCode}</div>}
              </td>
              <td>
                {row.DestinationLocationId ? (
                  <>
                    <div>{row.DestinationLocationName ?? "-"}</div>
                    {row.DestinationLocationCode && <div className="secondary-text">{row.DestinationLocationCode}</div>}
                  </>
                ) : (
                  <span className="status-badge status-rejected">No location</span>
                )}
              </td>
              <td>
                <div className="table-actions">
                  <ActionMenu
                    label="Receive"
                    items={[
                      ...(row.DestinationLocationId
                        ? [{ label: "Post GRN", onClick: () => onReceive(row) }]
                        : []),
                      { label: "Open DAG", onClick: () => onOpenDag(row.DAGID) },
                    ]}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
