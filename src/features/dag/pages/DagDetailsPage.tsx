import { useParams, useNavigate } from "@/lib/router"
import { useDagDetails } from "../hooks/useDagDetails"
import { useDagDetailsActions } from "../hooks/useDagDetailsActions"
import { useDagReceiptViewer } from "../hooks/useDagReceiptViewer"
import { PaymentModalController } from "../../../shared/payment/ui/PaymentModalController"
import { ReceiptPreviewModal } from "../../../shared/payment/ui/ReceiptPreviewModal"
import { DagSummaryCard } from "../components/details/DagSummaryCard"
import { DagFinancialOverviewCard } from "../components/details/DagFinancialOverviewCard"
import { DagContractorCard } from "../components/details/DagContractorCard"
import { DagTyresTable } from "../components/details/DagTyresTable"
import { DagPaymentDetailsSection } from "../components/details/DagPaymentDetailsSection"
import { AssignContractorDialog } from "../components/AssignContractorDialog"
import { IssueGatePassDialog } from "../components/IssueGatePassDialog"
import { DeliveryDateDialog } from "../components/DeliveryDateDialog"
import { PrinterModal } from "../../printer/components/PrinterModal"
import { usePrintDagPaymentReceipt } from "../hooks/usePrintDagPaymentReceipt"
import { STATUS_CODES } from "../../../shared/constants/statusConstants"
import { LoadingState } from "../../../shared/ui/progress"
import type { DagPaymentDetail } from "../models/dag"

export function DagDetailsPage() {
  const navigate = useNavigate()
  const { dagId: dagIdParam } = useParams<{ dagId: string }>()

  // Parse dagId to a number, ensuring it's undefined if not a valid number.
  const id = dagIdParam && !isNaN(parseInt(dagIdParam, 10)) ? parseInt(dagIdParam, 10) : undefined

  const {
    dag,
    loading,
    saving,
    error,
    notFound,
    serialInputs,
    handleSerialInputChange,
    saveCosts,
    refresh,
    approvals,
    approvalsLoading,
    assignContractor,
    updatingApproval,
    updateContractorApproval,
    issuingGatePass,
    issueGatePass,
    markArriving,
    updateDeliveryDate,
    completeChequePayment,
  } = useDagDetails(id)

  const {
    totals,
    showPaymentSection,
    selectedSerialIds,
    selectedCost,
    toggleSerial,
    selectAllUnsold,
    isTakeModalOpen,
    isSubmittingTake,
    handleTakeSelected,
    closeTakeModal,
    confirmTake,
    paymentForm,
    isAssignDialogOpen,
    openAssignDialog,
    closeAssignDialog,
    submitContractorAssignment,
    submitContractorApproval,
    isGatePassDialogOpen,
    openGatePassDialog,
    closeGatePassDialog,
    submitGatePass,
    showMarkArriving,
    showUpdateDeliveryDate,
    deliveryDateMode,
    isArrivingDialogOpen,
    openArrivingDialog,
    openUpdateDeliveryDateDialog,
    closeArrivingDialog,
    submitDeliveryDate,
    handleSerialCostChange,
    handleSaveCosts,
    handleCompleteCheque,
    completingChequeId,
  } = useDagDetailsActions({
    dagId: id,
    dag,
    saveCosts,
    saveCostsError: error,
    handleSerialInputChange,
    refresh,
    assignContractor,
    updateContractorApproval,
    issueGatePass,
    markArriving,
    updateDeliveryDate,
    completeChequePayment,
  })

  // Receipt viewer for existing payments
  const dagPayments = (totals?.payments ?? []) as DagPaymentDetail[]
  const receiptViewer = useDagReceiptViewer({
    payments: dagPayments,
    onReceiptsChanged: () => void refresh(),
  })

  const {
    printingPaymentId,
    downloadingPaymentId,
    isPrintingSummary,
    isDownloadingSummary,
    isPrinterModalOpen,
    handlePrint: handlePrintPaymentReceipt,
    handleDownload: handleDownloadPaymentReceipt,
    handlePrintSummary: handlePrintPaymentSummary,
    handleDownloadSummary: handleDownloadPaymentSummary,
    closePrinterModal,
  } = usePrintDagPaymentReceipt(dag)

  if (loading) {
    return (
      <main className="app-shell">
        <LoadingState message="Loading DAG details…" />
      </main>
    )
  }

  if (error || notFound || !dag) {
    return (
      <main className="app-shell">
        <p className="hero-text error-text">{error || "DAG record not found"}</p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">DAG Detail</p>
          <h1>DAG #{dag.ID}</h1>
          <p className="hero-text">Detailed breakdown of delivery advice note and tyre allocation.</p>
        </div>
        <div className="header-actions">
          {showMarkArriving && (
            <button className="primary-action" onClick={openArrivingDialog}>
              Set Delivery Date
            </button>
          )}
          {showUpdateDeliveryDate && (
            <button className="secondary-action" onClick={openUpdateDeliveryDateDialog}>
              Update Delivery Date
            </button>
          )}
          {/* Only offered while pending: issuing moves the DAG to GP_ISSUED and
              requires the assigned contractor to be approved, which the dialog
              reports on rather than gating here. */}
          {dag.StatusCode === STATUS_CODES.PENDING && (
            <button
              className="primary-action"
              onClick={openGatePassDialog}
              disabled={issuingGatePass}
            >
              Issue Gate Pass
            </button>
          )}
          <button className="secondary-action" onClick={() => navigate("/dag")}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <DagSummaryCard dag={dag} />
        <DagFinancialOverviewCard totals={totals} />
      </section>

      <DagContractorCard
        dag={dag}
        approvals={approvals}
        loading={approvalsLoading}
        updatingApproval={updatingApproval}
        onAssign={openAssignDialog}
        onUpdateApproval={(approvalId, approvalStatus) =>
          void submitContractorApproval(approvalId, approvalStatus)
        }
      />

      <DagTyresTable
        dag={dag}
        serialInputs={serialInputs}
        saving={saving}
        selectedSerialIds={selectedSerialIds}
        selectedCost={selectedCost}
        onToggleSerial={toggleSerial}
        onSelectAllUnsold={selectAllUnsold}
        onTakeSelected={handleTakeSelected}
        onSerialCostChange={handleSerialCostChange}
        onSaveCosts={() => void handleSaveCosts()}
      />

      {showPaymentSection && (
        <DagPaymentDetailsSection
          payments={totals.payments}
          isPaymentCompleted={dag.IsPaymentCompleted}
          onViewReceipts={receiptViewer.openReceipt}
          onCompleteCheque={handleCompleteCheque}
          completingChequeId={completingChequeId}
          onPrintCustomerReceipt={handlePrintPaymentReceipt}
          onDownloadCustomerReceipt={handleDownloadPaymentReceipt}
          printingReceiptPaymentId={printingPaymentId}
          downloadingReceiptPaymentId={downloadingPaymentId}
          onPrintSummaryReceipt={handlePrintPaymentSummary}
          onDownloadSummaryReceipt={handleDownloadPaymentSummary}
          isPrintingSummaryReceipt={isPrintingSummary}
          isDownloadingSummaryReceipt={isDownloadingSummary}
        />
      )}

      <PaymentModalController
        isOpen={isTakeModalOpen}
        onClose={closeTakeModal}
        onConfirm={confirmTake}
        confirmLabel="Confirm Take"
        submitting={isSubmittingTake}
        form={paymentForm}
      />

      <ReceiptPreviewModal
        isOpen={receiptViewer.isOpen}
        onClose={receiptViewer.closeReceipt}
        receipts={receiptViewer.previewReceipts}
        title={receiptViewer.previewTitle}
        manage={receiptViewer.manage}
      />

      <PrinterModal
        isOpen={isPrinterModalOpen}
        onClose={closePrinterModal}
      />

      <AssignContractorDialog
        isOpen={isAssignDialogOpen}
        dagId={dag.ID}
        initialContractorId={dag.ContractorID}
        onClose={closeAssignDialog}
        onSubmit={submitContractorAssignment}
      />

      <IssueGatePassDialog
        isOpen={isGatePassDialogOpen}
        dag={dag}
        onClose={closeGatePassDialog}
        onSubmit={submitGatePass}
      />

      <DeliveryDateDialog
        isOpen={isArrivingDialogOpen}
        mode={deliveryDateMode}
        dag={dag}
        defaultDeliveryDate={dag.DeliveryDate}
        onClose={closeArrivingDialog}
        onSubmit={submitDeliveryDate}
      />
    </main>
  )
}