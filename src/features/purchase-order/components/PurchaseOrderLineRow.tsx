import React from "react"
import type { PurchaseOrderDisplayRow, UpdateApprovalHandler, UpdateSupplierDeliveryDateHandler } from "../hooks/usePurchaseOrderDetails"
import type { GoodsReceiptLineRecord } from "../../goods-receipt/models/goodsReceipt"
import { STATUS_CODES, getStatusColorClass, getStatusName, type StatusCode } from "../../../shared/constants/statusConstants"
import { PurchaseOrderLineExpandedDetails } from "./PurchaseOrderLineExpandedDetails"

interface PurchaseOrderLineRowProps {
  row: PurchaseOrderDisplayRow;
  poStatusCode: StatusCode;
  isUpdatingApproval: boolean;
  isUpdatingDeliveryDates: boolean;
  isExpanded: boolean;
  onToggleExpand: (rowKey: string) => void;
  onUpdateApproval: UpdateApprovalHandler;
  onUpdateSupplierDates: UpdateSupplierDeliveryDateHandler;
  onCreateGoodsReceipt: (row: PurchaseOrderDisplayRow) => void;
  goodsReceipts: GoodsReceiptLineRecord[];
}

export const PurchaseOrderLineRow: React.FC<PurchaseOrderLineRowProps> = ({ 
  row, 
  poStatusCode, 
  isUpdatingApproval,
  isUpdatingDeliveryDates,
  isExpanded,
  onToggleExpand,
  onUpdateApproval,
  onUpdateSupplierDates,
  onCreateGoodsReceipt,
  goodsReceipts
}) => {
  const detailsColSpan = poStatusCode === STATUS_CODES.COMPLETED ? 8 : 9
  const lineStatusClass = getStatusColorClass(row.StatusCode || STATUS_CODES.PENDING)
  const lineStatusName = getStatusName(row.StatusCode || STATUS_CODES.PENDING)

  return (
    <>
      <tr className={row.rowClass}>
        <td>
          <div className="line-title-cell">
            <button
              type="button"
              className={`line-toggle-button ${isExpanded ? "expanded" : ""}`}
              onClick={() => onToggleExpand(row.rowKey)}
              aria-label={isExpanded ? "Collapse tyre details" : "Expand tyre details"}
            >
              {isExpanded ? "−" : "+"}
            </button>
            <strong>{row.Brand} / {row.Size} / {row.Pattern}</strong>
          </div>
        </td>
        <td className="text-right">${row.Price.toLocaleString()}</td>
        <td className="text-right">{row.Discount}%</td>
        <td className="text-right font-bold">{row.Qty}</td>
        <td>
          <span className={`status-badge ${lineStatusClass}`}>{lineStatusName}</span>
        </td>
        <td>
          <div className="supplier-tags">
            {row.displaySupplier ? (
              <span className="contractor-tyre-tag">
                {row.displaySupplier.SupplierName}: {row.displaySupplier.Qty}
              </span>
            ) : (
              <span className="secondary-text">No allocations</span>
            )}
          </div>
        </td>
        <td>
          {row.LocationName || <span className="secondary-text">Not allocated</span>}
        </td>
        <td className="text-right font-bold">${row.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        {poStatusCode !== STATUS_CODES.COMPLETED && (
          <td>
            {row.displaySupplier ? (
              row.displaySupplier.IsApproved === null ? (
                <span className="status-badge status-pending">Pending</span>
              ) : row.isApproved ? (
                <span className="status-badge status-approved">Approved</span>
              ) : (
                <span className="status-badge status-rejected">Rejected</span>
              )
            ) : (
              <span className="secondary-text">-</span>
            )}
          </td>
        )}
      </tr>

      <tr className={isExpanded ? "dot-lots-row expanded" : "dot-lots-row"}>
        <td colSpan={detailsColSpan}>
          <div className="dot-lots-content">
            <PurchaseOrderLineExpandedDetails
              row={row}
              isUpdatingApproval={isUpdatingApproval}
              isUpdatingDeliveryDates={isUpdatingDeliveryDates}
              onUpdateApproval={onUpdateApproval}
              onUpdateSupplierDates={onUpdateSupplierDates}
              onCreateGoodsReceipt={onCreateGoodsReceipt}
              goodsReceipts={goodsReceipts}
            />
          </div>
        </td>
      </tr>
    </>
  )
}