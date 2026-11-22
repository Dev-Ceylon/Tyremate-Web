import { ActionMenu } from "../../../shared/ui/actionMenu/ActionMenu"
import { TyreIcon, BatteryIcon } from "../../../shared/ui/icons"
import { formatOrderItemLabel } from "../../../shared/item/models/itemDisplay"
import type { PendingGoodsReceiptRecord } from "../models/goodsReceipt"

type PendingGoodsReceiptTableProps = {
  data: PendingGoodsReceiptRecord[]
  onReceive: (row: PendingGoodsReceiptRecord) => void
  onOpenPurchaseOrder: (poId: number) => void
}

const localToday = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
}

const formatDate = (value: string | null) => {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export const PendingGoodsReceiptTable = ({
  data,
  onReceive,
  onOpenPurchaseOrder,
}: PendingGoodsReceiptTableProps) => {
  if (data.length === 0) {
    return <p className="table-empty">No pending goods receipts.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>PO</th>
            <th>Supplier</th>
            <th>Item</th>
            <th className="text-center">Allocated</th>
            <th className="text-center">Received</th>
            <th className="text-center">Pending</th>
            <th>Expected</th>
            <th>Location</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isOverdue = !!row.ExpectedDeliveryDate && row.ExpectedDeliveryDate < localToday()

            return (
              <tr key={`${row.Category ?? "tyre"}-${row.PoBatterySupplierID ?? row.PoTyresSupplierID}`}>
                <td>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => onOpenPurchaseOrder(row.POID)}
                  >
                    #{row.POID}
                  </button>
                </td>
                <td>
                  <span className="mono-text">{row.SupplierCode}</span>
                  <div className="secondary-text">{row.SupplierName}</div>
                </td>
                <td>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      title={row.Category === "battery" ? "Battery" : "Tyre"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: row.Category === "battery" ? "#3b82f6" : "#64748b",
                        width: 18,
                        height: 18,
                        flexShrink: 0,
                      }}
                    >
                      {row.Category === "battery" ? <BatteryIcon /> : <TyreIcon />}
                    </span>
                    <span>{formatOrderItemLabel(row)}</span>
                  </div>
                </td>
                <td className="text-center mono-text">{row.AllocatedQty}</td>
                <td className="text-center mono-text">
                  {row.AcceptedToDateQty}
                  {row.GoodsReceiptCount > 0 && (
                    <div className="secondary-text">
                      {row.GoodsReceiptCount} GRN{row.GoodsReceiptCount === 1 ? "" : "s"}
                    </div>
                  )}
                </td>
                <td className="text-center mono-text">
                  <strong>{row.PendingQty}</strong>
                </td>
                <td>
                  {isOverdue ? (
                    <span className="status-badge status-pending">{formatDate(row.ExpectedDeliveryDate)}</span>
                  ) : (
                    formatDate(row.ExpectedDeliveryDate)
                  )}
                </td>
                <td>
                  {row.AllocatedLocationName ? (
                    <>
                      {row.AllocatedLocationName}
                      {row.AllocatedLocationCode && (
                        <div className="secondary-text">{row.AllocatedLocationCode}</div>
                      )}
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
                        ...(row.AllocatedLocationId
                          ? [{ label: "Post GRN", onClick: () => onReceive(row) }]
                          : []),
                        { label: "Open Purchase Order", onClick: () => onOpenPurchaseOrder(row.POID) },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}