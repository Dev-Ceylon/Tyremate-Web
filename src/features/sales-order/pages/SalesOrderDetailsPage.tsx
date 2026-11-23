import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { useSalesOrderDetails } from "../hooks/useSalesOrderDetails"
import { usePrintSalesOrder } from "../hooks/usePrintSalesOrder"
import { usePrintWarehouseDispatch } from "../hooks/usePrintWarehouseDispatch"
import { useSalesOrderDetailsActions } from "../hooks/useSalesOrderDetailsActions"
import { PrinterModal } from "../../printer/components/PrinterModal"
import { WarehouseIssueModal } from "../components/WarehouseIssueModal"
import { PaymentModalController } from "../../../shared/payment/ui/PaymentModalController"
import { ReturnTyreModal } from "../components/ReturnTyreModal"
import { OrderSummaryCard } from "../components/details/OrderSummaryCard"
import { FinancialOverviewCard } from "../components/details/FinancialOverviewCard"
import { OrderLineItemsTable } from "../components/details/OrderLineItemsTable"
import { ReturnHistorySection } from "../components/details/ReturnHistorySection"
import { PaymentDetailsSection } from "../components/details/PaymentDetailsSection"
import { PurchaseOrderSection } from "../components/details/PurchaseOrderSection"
import { DeliveriesSection } from "../components/details/DeliveriesSection"
import { RecordDeliveryModal } from "../components/RecordDeliveryModal"
import { useSalesOrderDeliveries } from "../hooks/useSalesOrderDeliveries"
import { useRecordDeliveryInvoice } from "../hooks/useRecordDeliveryInvoice"
import { useGenerateDeliveryInvoice } from "../hooks/useGenerateDeliveryInvoice"
import { LinkedInquiriesCard } from "../components/LinkedInquiriesCard"
import { useGenerateInvoice } from "../../invoice/hooks/useGenerateInvoice"
import { usePrintSOPaymentReceipt } from "../hooks/usePrintSOPaymentReceipt"

export default function SalesOrderDetailsPage() {
  const navigate = useNavigate()
  const {
    order,
    loading,
    error,
    makePayment,
    completeChequePayment,
    completeSalesOrder,
    refresh,
    submitting: isHookSubmitting,
  } = useSalesOrderDetails()
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const {
    printingPaymentId: printingReceiptPaymentId,
    downloadingPaymentId: downloadingReceiptPaymentId,
    isPrintingSummary: isPrintingPaymentSummary,
    isDownloadingSummary: isDownloadingPaymentSummary,
    isPrinterModalOpen: isPaymentReceiptPrinterModalOpen,
    handlePrint: handlePrintPaymentReceipt,
    handleDownload: handleDownloadPaymentReceipt,
    handlePrintSummary: handlePrintPaymentSummary,
    handleDownloadSummary: handleDownloadPaymentSummary,
    closePrinterModal: closePaymentReceiptPrinterModal,
  } = usePrintSOPaymentReceipt(order)

  const { isPrinting, isDownloadingPdf, isPrinterModalOpen, handlePrint, handleDownloadPdf, handleClosePrinterModal } = usePrintSalesOrder(order?.SoID ?? null)
  const {
    dispatch: warehouseDispatch,
    isLoading: isLoadingDispatch,
    isPrinting: isPrintingDispatch,
    isDownloadingPdf: isDownloadingDispatch,
    isNoteModalOpen: isWarehouseModalOpen,
    isPrinterModalOpen: isWarehousePrinterModalOpen,
    loadingDeliveryId: loadingWarehouseNoteDeliveryId,
    openNote: openWarehouseNote,
    openDeliveryNote: openWarehouseDeliveryNote,
    closeNote: closeWarehouseNote,
    handlePrint: handlePrintWarehouse,
    handleDownloadPdf: handleDownloadWarehouse,
    closePrinterModal: closeWarehousePrinterModal,
  } = usePrintWarehouseDispatch(order?.SoID ?? null)

  const { isGenerating: isGeneratingInvoice, generate: handleGenerateInvoice } = useGenerateInvoice({
    type: "salesOrder",
    id: order?.SoID ?? null,
  })

  const {
    progress: deliveryProgress,
    deliveries,
    loading: isDeliveryLoading,
    recordDelivery,
    refresh: refreshDeliveries,
  } = useSalesOrderDeliveries(order?.SoID ?? null)

  const {
    isRecordingDelivery,
    isPaymentModalOpen: isDeliveryPaymentModalOpen,
    isPaying: isPayingDeliveryInvoice,
    preparingPaymentDeliveryId,
    deliveryInvoices,
    refreshDeliveryInvoices,
    paymentForm: deliveryPaymentForm,
    handleRecordDelivery,
    handlePayment: handleDeliveryPayment,
    handleClosePayment: handleCloseDeliveryPayment,
    openDeliveryPayment,
  } = useRecordDeliveryInvoice({
    salesOrderId: order?.SoID ?? null,
    recordDelivery,
    refresh,
    deliveries,
    onDeliveryRecorded: () => setIsDeliveryModalOpen(false),
  })

  const {
    netTotal,
    showMakePaymentButton,
    showCompleteSalesOrderButton,
    paymentForm,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isReturnModalOpen,
    tyreToReturn,
    isSubmittingPayment,
    issuingGatePassId,
    handleMakePayment,
    handleOpenReturnModal,
    handleCloseReturnModal,
    handleConfirmReturn,
    handleCompleteCheque,
    handleIssueGatePass,
  } = useSalesOrderDetailsActions({
    order,
    deliveries,
    makePayment,
    completeChequePayment,
    refreshOrder: refresh,
    refreshDeliveries,
    refreshDeliveryInvoices,
  })

  function getMaxReturnQty(tyre: typeof tyreToReturn) {
    if (!tyre) return 0
    const maxFromTyre = (tyre as { maxReturnQty?: number }).maxReturnQty
    if (typeof maxFromTyre === "number" && !Number.isNaN(maxFromTyre)) {
      return maxFromTyre
    }
    return tyre.Qty ?? 0
  }

  const { generatingId: generatingDeliveryId, generate: handleGenerateDeliveryInvoice } =
    useGenerateDeliveryInvoice()

  if (loading) return <main className="app-shell"><p className="hero-text">Loading order details...</p></main>
  if (error || !order) return <main className="app-shell"><p className="hero-text error-text">{error || "Order not found"}</p></main>

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales Order Detail</p>
          <h1>Order #{order.SoID}</h1>
          <p className="hero-text">Detailed breakdown of customer requirements and fulfillment status.</p>
        </div>
        <div className="header-actions">
          {showCompleteSalesOrderButton && (
            <button
              className="primary-action"
              onClick={() => void completeSalesOrder()}
              disabled={isHookSubmitting}
            >
              {isHookSubmitting ? "Processing..." : "Make Sales Order Complete"}
            </button>
          )}
          <button className="secondary-action" onClick={() => void handlePrint()} disabled={isPrinting}>
            {isPrinting ? "Printing..." : "Print"}
          </button>
          <button className="secondary-action" onClick={() => void handleDownloadPdf()} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button className="secondary-action" onClick={() => void openWarehouseNote()} disabled={isLoadingDispatch}>
            {isLoadingDispatch ? "Loading..." : "Warehouse Issue Note"}
          </button>
          <button className="secondary-action" onClick={() => void handleGenerateInvoice()} disabled={isGeneratingInvoice}>
            {isGeneratingInvoice ? "Generating..." : "Invoice"}
          </button>
          <button className="secondary-action" onClick={() => navigate("/sales-orders")}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <OrderSummaryCard order={order} showCompleteSalesOrder={showCompleteSalesOrderButton} deliveryProgress={deliveryProgress} />
        <FinancialOverviewCard order={order} netTotal={netTotal} />
      </section>

      <OrderLineItemsTable
        order={order}
        netTotal={netTotal}
        onReturn={handleOpenReturnModal}
        disabled={isHookSubmitting}
      />

      <ReturnHistorySection order={order} />

      {(paymentsExist(order) || order.IsPaymentCompleted !== 1) && (
        <PaymentDetailsSection
          order={order}
          showMakePayment={showMakePaymentButton}
          onMakePayment={() => setIsPaymentModalOpen(true)}
          onCompleteCheque={handleCompleteCheque}
          onReceiptsChanged={() => void refresh()}
          onPrintCustomerReceipt={handlePrintPaymentReceipt}
          onDownloadCustomerReceipt={handleDownloadPaymentReceipt}
          printingReceiptPaymentId={printingReceiptPaymentId}
          downloadingReceiptPaymentId={downloadingReceiptPaymentId}
          onPrintSummaryReceipt={handlePrintPaymentSummary}
          onDownloadSummaryReceipt={handleDownloadPaymentSummary}
          isPrintingSummaryReceipt={isPrintingPaymentSummary}
          isDownloadingSummaryReceipt={isDownloadingPaymentSummary}
          disabled={isHookSubmitting}
        />
      )}

      {order.PO && <PurchaseOrderSection order={order} />}

      <DeliveriesSection
        progress={deliveryProgress}
        deliveries={deliveries}
        loading={isDeliveryLoading}
        onRecord={() => setIsDeliveryModalOpen(true)}
        onGenerateInvoice={handleGenerateDeliveryInvoice}
        generatingDeliveryId={generatingDeliveryId}
        onPayInvoice={openDeliveryPayment}
        preparingPaymentDeliveryId={preparingPaymentDeliveryId}
        onWarehouseIssueNote={openWarehouseDeliveryNote}
        onIssueGatePass={handleIssueGatePass}
        issuingGatePassId={issuingGatePassId}
        loadingWarehouseNoteDeliveryId={loadingWarehouseNoteDeliveryId}
        deliveryInvoices={deliveryInvoices}
        disabled={isHookSubmitting}
      />

      <LinkedInquiriesCard inquiries={order.LinkedInquiries} />

      <PaymentModalController
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleMakePayment}
        confirmLabel={(deliveries?.length ?? 0) === 0 ? "Confirm Advance Payment" : "Record Payment"}
        submitting={isSubmittingPayment}
        form={paymentForm}
      />

      <PaymentModalController
        isOpen={isDeliveryPaymentModalOpen}
        onClose={handleCloseDeliveryPayment}
        onConfirm={handleDeliveryPayment}
        confirmLabel="Pay & Open Invoice"
        cancelLabel="Skip payment & Return to SO"
        submitting={isPayingDeliveryInvoice}
        form={deliveryPaymentForm}
      />

      <RecordDeliveryModal
        isOpen={isDeliveryModalOpen}
        progress={deliveryProgress}
        onClose={() => setIsDeliveryModalOpen(false)}
        onConfirm={handleRecordDelivery}
        submitting={isRecordingDelivery}
      />

      <ReturnTyreModal
        isOpen={isReturnModalOpen}
        onClose={handleCloseReturnModal}
        onConfirm={handleConfirmReturn}
        tyre={tyreToReturn}
        maxReturnQty={getMaxReturnQty(tyreToReturn)}
        submitting={isSubmittingPayment}
      />

      <PrinterModal
        isOpen={isPrinterModalOpen}
        onClose={handleClosePrinterModal}
      />

      <PrinterModal
        isOpen={isPaymentReceiptPrinterModalOpen}
        onClose={closePaymentReceiptPrinterModal}
      />

      <WarehouseIssueModal
        isOpen={isWarehouseModalOpen}
        dispatch={warehouseDispatch}
        onClose={closeWarehouseNote}
        onPrint={handlePrintWarehouse}
        onDownload={handleDownloadWarehouse}
        isPrinting={isPrintingDispatch}
        isDownloadingPdf={isDownloadingDispatch}
      />

      <PrinterModal
        isOpen={isWarehousePrinterModalOpen}
        onClose={closeWarehousePrinterModal}
      />
    </main>
  )
}

function paymentsExist(order: { Payments?: unknown[] }): boolean {
  return (order.Payments?.length ?? 0) > 0
}
