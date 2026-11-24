import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { usePurchaseOrderDetails } from "../hooks/usePurchaseOrderDetails"
import { useDeletePurchaseOrder } from "../hooks/useDeletePurchaseOrder"
import { usePrintPurchaseOrder } from "../hooks/usePrintPurchaseOrder"
import { PrinterModal } from "../../printer/components/PrinterModal"
import { STATUS_CODES, type StatusCode } from "../../../shared/constants/statusConstants"
import { PO_EDITABLE_STATUSES, PO_LOCATION_ALLOCATABLE_STATUSES, PO_DELETABLE_STATUSES } from "../constants/poStatusConstants"
import { OrderSummaryCard } from "../components/OrderSummaryCard"
import { ProcurementValueCard } from "../components/ProcurementValueCard"
import { PurchaseOrderLineRow } from "../components/PurchaseOrderLineRow"
import { GoodsReceiptModal } from "../../goods-receipt/components/GoodsReceiptModal"
import { LinkedInquiriesCard } from "../../inquiry/components/LinkedInquiriesCard"
import { formatOrderItemLabel } from "../../../shared/item/models/itemDisplay"
import { LoadingState } from "../../../shared/ui/progress"
import type { PurchaseOrderDisplayRow } from "../hooks/usePurchaseOrderDetails"

export default function PurchaseOrderDetailsPage() {
  const navigate = useNavigate()
  const [goodsReceiptTarget, setGoodsReceiptTarget] = useState<PurchaseOrderDisplayRow | null>(null)
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null)
  const { 
    order, 
    loading, 
    error, 
    displayRows, 
    goodsReceipts,
    totals, 
    isUpdatingApproval,
    isUpdatingDeliveryDates,
    isPostingGoodsReceipt,
    actions 
  } = usePurchaseOrderDetails()
  const { isDeleting, handleDelete: handleDeletePoClick } = useDeletePurchaseOrder(order?.ID ?? null)
  const { isPrinting, isDownloadingPdf, isPrinterModalOpen, handlePrint, handleDownloadPdf, handleClosePrinterModal } = usePrintPurchaseOrder(order?.ID ?? null)

  if (loading) return <main className="app-shell"><LoadingState message="Loading order details…" /></main>
  if (error || !order) return <main className="app-shell"><p className="hero-text error-text">{error || "Purchase order not found"}</p></main>

  const statusCode = (order.StatusCode as StatusCode) ?? STATUS_CODES.PENDING

  const handleEditPoClick = () => navigate(`/purchase-orders/${order.ID}/edit`)
  const handleAllocateLocationClick = () => navigate(`/purchase-orders/${order.ID}/allocate`)
  const handleBackToListClick = () => navigate("/purchase-orders")
  const handleToggleExpansion = (rowKey: string) => {
    setExpandedRowKey((current) => current === rowKey ? null : rowKey)
  }
  const handleCreateGoodsReceipt = (row: PurchaseOrderDisplayRow) => setGoodsReceiptTarget(row)
  const handleCloseGoodsReceipt = () => setGoodsReceiptTarget(null)
  const goodsReceiptAllocationId = goodsReceiptTarget?.displaySupplier?.ID ?? null
  const goodsReceiptReceivedToDate = goodsReceiptAllocationId
    ? goodsReceipts
      .filter((receipt) => (receipt.PoBatterySupplierID ?? receipt.PoTyresSupplierID) === goodsReceiptAllocationId)
      .reduce((total, receipt) => total + receipt.ReceivedQty, 0)
    : 0
  const goodsReceiptItemLabel = formatOrderItemLabel(goodsReceiptTarget, order.Category)

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Purchase Order Detail</p>
          <h1>PO #{order.ID}</h1>
          <p className="hero-text">Overview of supplier procurement requirements and allocation status.</p>
        </div>
        <div className="header-actions">
          {statusCode === STATUS_CODES.PENDING && !order.SupplierFeedback && (
            <span className="secondary-text">Awaiting supplier feedback before sending</span>
          )}
          {PO_EDITABLE_STATUSES.includes(statusCode) && (
            <button className="secondary-action" onClick={handleEditPoClick}>
              Edit PO
            </button>
          )}
          {PO_LOCATION_ALLOCATABLE_STATUSES.includes(statusCode) && (
            <button className="secondary-action" onClick={handleAllocateLocationClick}>
              Allocate Location
            </button>
          )}
          {PO_DELETABLE_STATUSES.includes(statusCode) && (
            <button
              className="danger-action"
              onClick={handleDeletePoClick}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete PO"}
            </button>
          )}
          <button className="secondary-action" onClick={() => handlePrint()} disabled={isPrinting}>
            {isPrinting ? "Printing..." : "Print"}
          </button>
          <button className="secondary-action" onClick={() => handleDownloadPdf()} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button className="secondary-action" onClick={handleBackToListClick}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <OrderSummaryCard order={order} />
        <ProcurementValueCard totals={totals} />
      </section>

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <h2>{order.Category === "battery" ? "Battery Line Items" : "Tyre Line Items"}</h2>
          <div className="header-actions">
            <span className="stat-badge">{displayRows.length} allocation{displayRows.length !== 1 ? "s" : ""}</span>
            <span className="stat-badge">${totals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>{order.Category === "battery" ? "Battery (Brand / Model / Spec)" : "Tyre (Brand / Size / Pattern)"}</th>
                <th className="text-right">Price</th>
                <th className="text-right">Disc %</th>
                <th className="text-right">Qty</th>
                <th>Line Status</th>
                <th>Supplier Allocations</th>
                <th>Location</th>
                <th className="text-right">Line Total</th>
                {order.StatusCode !== STATUS_CODES.COMPLETED && <th>Supplier Status</th>}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <PurchaseOrderLineRow 
                  key={row.rowKey} 
                  row={row} 
                  poStatusCode={(order.StatusCode as StatusCode) ?? STATUS_CODES.PENDING} 
                  isUpdatingApproval={isUpdatingApproval} 
                  isUpdatingDeliveryDates={isUpdatingDeliveryDates}
                  isExpanded={expandedRowKey === row.rowKey}
                  onToggleExpand={handleToggleExpansion}
                  onUpdateApproval={actions.updateApproval}
                  onUpdateSupplierDates={actions.updateSupplierDates}
                  onCreateGoodsReceipt={handleCreateGoodsReceipt}
                  goodsReceipts={goodsReceipts}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LinkedInquiriesCard inquiries={order.LinkedInquiries} />

      <PrinterModal
        isOpen={isPrinterModalOpen}
        onClose={handleClosePrinterModal}
      />
      <GoodsReceiptModal
        isOpen={goodsReceiptTarget !== null}
        poId={order.ID}
        category={order.Category}
        supplierAllocationId={goodsReceiptAllocationId}
        supplierName={goodsReceiptTarget?.displaySupplier?.SupplierName ?? ""}
        tyreLabel={goodsReceiptItemLabel}
        allocationQty={goodsReceiptTarget?.displaySupplier?.Qty ?? 0}
        receivedToDate={goodsReceiptReceivedToDate}
        locationName={goodsReceiptTarget?.LocationName ?? ""}
        isSaving={isPostingGoodsReceipt}
        onClose={handleCloseGoodsReceipt}
        onPost={actions.postGoodsReceipt}
      />
    </main>
  )
}