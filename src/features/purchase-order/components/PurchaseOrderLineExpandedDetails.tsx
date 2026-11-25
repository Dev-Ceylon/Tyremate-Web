import React, { useMemo, useState } from "react"
import { STATUS_CODES, getStatusColorClass, getStatusName } from "../../../shared/constants/statusConstants"
import type { PurchaseOrderDisplayRow, UpdateApprovalHandler, UpdateSupplierDeliveryDateHandler } from "../hooks/usePurchaseOrderDetails"
import type { GoodsReceiptLineRecord } from "../../goods-receipt/models/goodsReceipt"
import { GoodsReceiptHistory } from "../../goods-receipt/components/GoodsReceiptHistory"

interface PurchaseOrderLineExpandedDetailsProps {
  row: PurchaseOrderDisplayRow
  isUpdatingApproval: boolean
  isUpdatingDeliveryDates: boolean
  onUpdateApproval: UpdateApprovalHandler
  onUpdateSupplierDates: UpdateSupplierDeliveryDateHandler
  onCreateGoodsReceipt: (row: PurchaseOrderDisplayRow) => void
  goodsReceipts: GoodsReceiptLineRecord[]
}

export const PurchaseOrderLineExpandedDetails: React.FC<PurchaseOrderLineExpandedDetailsProps> = ({
  row,
  isUpdatingApproval,
  isUpdatingDeliveryDates,
  onUpdateApproval,
  onUpdateSupplierDates,
  onCreateGoodsReceipt,
  goodsReceipts,
}) => {
  const [dateDrafts, setDateDrafts] = useState<Record<number, string>>({})
  const lineStatusClass = getStatusColorClass(row.StatusCode || STATUS_CODES.PENDING)
  const lineStatusName = getStatusName(row.StatusCode || STATUS_CODES.PENDING)
  const isBattery = Boolean((row as any).BatteryID || (row as any).PoBatteriesID)

  const allocationRows = useMemo(() => row.displaySupplier ? [{
    id: row.displaySupplier.ID,
    supplierName: row.displaySupplier.SupplierName || "Unknown supplier",
    supplierCode: row.displaySupplier.SupplierCode || "-",
    qty: row.displaySupplier.Qty,
    expectedDate: row.displaySupplier.ExpectedDeliveryDate ?? "",
    isApproved: row.displaySupplier.IsApproved === 1 || row.displaySupplier.IsApproved === true,
    isRejected: row.displaySupplier.IsApproved !== null && row.displaySupplier.IsApproved !== 1 && row.displaySupplier.IsApproved !== true,
  }] : [], [row.displaySupplier])
  const handleExpectedDateChange = (supplierId: number, value: string) => {
    setDateDrafts((current) => ({ ...current, [supplierId]: value }))
  }

  return (
    <div className="purchase-order-expanded-panel">
      <div className="expanded-summary-grid">
        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Line total</span>
          <strong className="expanded-summary-value">Rs {row.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          <span className="expanded-summary-meta">Location: {row.LocationName || "Not allocated"}</span>
        </div>
        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Allocated qty</span>
          <strong className="expanded-summary-value">{row.Qty}</strong>
          <span className="expanded-summary-meta">
            {row.displaySupplier ? `${row.displaySupplier.SupplierName} (${row.displaySupplier.Qty})` : "No allocation"}
          </span>
        </div>
        <div className="expanded-summary-card">
          <span className="expanded-summary-label">{isBattery ? "Battery line status" : "Tyre line status"}</span>
          <div className="expanded-summary-status-wrap">
            <span className={`status-badge ${lineStatusClass}`}>{lineStatusName}</span>
          </div>
          <span className="expanded-summary-meta">Lifecycle state for this {isBattery ? "battery" : "tyre"} line</span>
        </div>
      </div>

      <div className="expanded-action-bar">
        {row.isApproved && row.StatusCode === STATUS_CODES.ARRIVING && row.displaySupplier && (
          <button
            className="table-action secondary-action"
            onClick={() => onCreateGoodsReceipt(row)}
          >
            Receive Goods
          </button>
        )}
        {row.displaySupplier?.IsApproved === null && (
          <>
            <button className="table-action primary-action" onClick={() => onUpdateApproval(row.displaySupplier!.ID, true, 'Approved')} disabled={isUpdatingApproval}>Approve</button>
            <button className="table-action secondary-action" onClick={() => onUpdateApproval(row.displaySupplier!.ID, false, 'Rejected')} disabled={isUpdatingApproval}>Reject</button>
          </>
        )}
      </div>

      {allocationRows.length > 0 ? (
        <div className="expanded-table-wrap">
          <div className="tm-table-scroll">
            <table className="product-table expanded-allocation-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Code</th>
                  <th>Qty</th>
                  <th>Supplier Status</th>
                  <th>Expected date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocationRows.map((allocation) => {
                  const expectedValue = dateDrafts[allocation.id] ?? allocation.expectedDate

                  return (
                    <tr key={`${row.rowKey}-${allocation.id}`}>
                      <td>{allocation.supplierName}</td>
                      <td>{allocation.supplierCode}</td>
                      <td>{allocation.qty}</td>
                      <td>
                        {allocation.isApproved ? (
                          <span className="status-badge status-completed">Approved</span>
                        ) : allocation.isRejected ? (
                          <span className="status-badge status-rejected">Rejected</span>
                        ) : (
                          <span className="status-badge status-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        {allocation.isApproved ? (
                          <div className="delivery-date-field">
                            <input
                              className="delivery-date-input"
                              type="date"
                              value={expectedValue}
                              aria-label={`Expected delivery date for ${allocation.supplierName}`}
                              onChange={(event) => handleExpectedDateChange(allocation.id, event.target.value)}
                              disabled={isUpdatingDeliveryDates}
                            />
                          </div>
                        ) : (
                          <span className="secondary-text">—</span>
                        )}
                      </td>
                      <td className="delivery-date-action-cell">
                        {allocation.isApproved ? (
                          <button
                            className="table-action primary-action"
                            onClick={() => onUpdateSupplierDates(allocation.id, {
                              ExpectedDeliveryDate: expectedValue || null,
                            })}
                            disabled={isUpdatingDeliveryDates}
                          >
                            {isUpdatingDeliveryDates ? "Saving..." : "Save expected date"}
                          </button>
                        ) : (
                          <span className="secondary-text">Awaiting approval</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="secondary-text expanded-empty-state">No supplier allocations for this {isBattery ? "battery" : "tyre"} line.</p>
      )}

      {row.displaySupplier && (
        <GoodsReceiptHistory
          supplierAllocationId={row.displaySupplier.ID}
          receipts={goodsReceipts}
        />
      )}
    </div>
  )
}
