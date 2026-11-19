import { useCallback, useState } from "react"
import { useNavigate, useSearchParams } from "@/lib/router"
import { CreateCustomerDialog } from "../../master-data/customers/components/CreateCustomerDialog"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import { CreateTyreDialog } from "../../master-data/tyres/components/CreateTyreDialog"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { SalesOrderForm } from "../components/SalesOrderForm"
import { QuantitySelectModal } from "../components/QuantitySelectModal"
import { PaymentModalController } from "../../../shared/payment/ui/PaymentModalController"
import { GatePassPaymentOverrideModal } from "../components/GatePassPaymentOverrideModal"
import type { StorageAllocationInput } from "../models/salesOrder"
import { useSalesOrderForm } from "../hooks/useSalesOrderForm"
import { useSalesOrderPaymentForm } from "../hooks/useSalesOrderPaymentForm"
import { useSalesOrderCreateWorkflow } from "../hooks/useSalesOrderCreateWorkflow"

export default function SalesOrderCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inquiryIdParam = searchParams.get("inquiryId")
  const inquiryId = inquiryIdParam ? Number(inquiryIdParam) : null
  const { showToast } = useToast()
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [isCreateTyreOpen, setIsCreateTyreOpen] = useState(false)
  const [manageRowId, setManageRowId] = useState<number | null>(null)

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: "Failed to create sales order",
      message,
    })
  }, [showToast])

  const {
    formData,
    lines,
    customers,
    tyres,
    initializing,
    submitting,
    error,
    totalAmount,
    updateField,
    addLine,
    removeLine,
    updateLine,
    onChangeLineQty,
    onChangeLineTakeNow,
    setLineAllocations,
    setLineTyre,
    reloadCustomers,
    reloadTyres,
    selectCustomer,
    setCustomerMode,
    updateWalkinCustomer,
    walkinCustomerErrors,
    selectTyreForOrder,
    submitOrder,
  } = useSalesOrderForm({
    inquiryId,
    onError: handleError,
  })

  const {
    takingAmount,
    paymentTargetAmount,
    hasTakingNow,
    isPaymentTypeModalOpen,
    setIsPaymentTypeModalOpen,
    pendingGatePass,
    isIssuingOverride,
    handleFormSubmit,
    handleOpenAdvancePaymentModal,
    handleModalConfirm,
    handleSkipPayment,
    finishWithGatePassWithheld,
    handleIssueGatePassOverride,
  } = useSalesOrderCreateWorkflow({ lines, totalAmount, submitOrder })
  const paymentForm = useSalesOrderPaymentForm({ totalAmount: paymentTargetAmount })

  const handleCustomerCreated = useCallback(async (customer: CustomerRecord) => {
    await reloadCustomers()
    selectCustomer(customer.CustomerID)
    showToast({
      variant: "success",
      title: "Customer created",
      message: "New customer is ready and selected for this sales order.",
    })
  }, [reloadCustomers, selectCustomer, showToast])

  const handleTyreCreated = useCallback(async (tyre: TyreRecord) => {
    await reloadTyres()
    selectTyreForOrder(tyre.Id)
    showToast({
      variant: "success",
      title: "Tyre created",
      message: "New tyre is ready and added to this sales order.",
    })
  }, [reloadTyres, selectTyreForOrder, showToast])

  const managedLine =
    manageRowId !== null ? lines.find((line) => line.RowId === manageRowId) ?? null : null

  const getTyreLabel = (tyreId: number) => {
    const tyre = tyres.find((tyre) => tyre.Id === tyreId)
    return tyre ? `${tyre.Brand || "NA"} / ${tyre.Size || "NA"}` : ""
  }

  const handleManageClose = useCallback(() => {
    setManageRowId(null)
  }, [])

  const handleManageConfirm = useCallback(
    (allocations: StorageAllocationInput[]) => {
      if (manageRowId !== null) {
        setLineAllocations(manageRowId, allocations)
      }
      setManageRowId(null)
    },
    [manageRowId, setLineAllocations],
  )

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Sales Order</p>
          <h2>Create Sales Order{inquiryId ? ` from Inquiry #${inquiryId}` : ""}</h2>
        </div>
      </div>

      {initializing ? <p className="hero-text">Loading options...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}

      <SalesOrderForm
        state={{
          formData,
          lines,
          customers,
          tyres,
          totalAmount,
          takingAmount,
          submitting: submitting || initializing,
          walkinCustomerErrors,
        }}
        actions={{
          onChangeDate: (value) => updateField("Date", value),
          onChangeCustomerMode: setCustomerMode,
          onChangeCustomer: (value) => updateField("CustomerID", value),
          onChangeWalkinCustomer: updateWalkinCustomer,
          onOpenCreateCustomer: () => setIsCreateCustomerOpen(true),
          onOpenCreateTyre: () => setIsCreateTyreOpen(true),
          onAddLine: addLine,
          onRemoveLine: removeLine,
          onChangeLineTyre: (rowId, value) => setLineTyre(rowId, value),
          onChangeLinePrice: (rowId, value) => updateLine(rowId, "Price", value),
          onChangeLineDiscount: (rowId, value) => updateLine(rowId, "Discount", value),
          onChangeLineQty,
          onChangeLineTakeNow,
          onManageStock: (rowId) => setManageRowId(rowId),
          onChangeLineTotal: (rowId, value) => updateLine(rowId, "LineTotal", value),
          onSubmit: handleFormSubmit,
          onOpenAdvancePayment: handleOpenAdvancePaymentModal,
          onCancel: () => (inquiryId ? navigate(`/inquiries/${inquiryId}`) : navigate("/sales-orders")),
        }}
      />

      <CreateCustomerDialog
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onCreated={handleCustomerCreated}
      />

      <CreateTyreDialog
        isOpen={isCreateTyreOpen}
        onClose={() => setIsCreateTyreOpen(false)}
        onCreated={handleTyreCreated}
      />

      <PaymentModalController
        isOpen={isPaymentTypeModalOpen}
        onClose={() => setIsPaymentTypeModalOpen(false)}
        onConfirm={handleModalConfirm}
        confirmLabel={hasTakingNow ? "Pay & Create Invoice" : "Confirm Advance Payment & Create SO"}
        onSkip={handleSkipPayment}
        skipLabel={hasTakingNow ? "Skip payment & Create SO" : "Create SO (No Advance)"}
        submitting={submitting}
        form={paymentForm}
      />

      <GatePassPaymentOverrideModal
        isOpen={pendingGatePass !== null}
        shortfall={pendingGatePass?.eligibility.Shortfall ?? 0}
        settledAmount={pendingGatePass?.eligibility.SettledAmount ?? 0}
        requiredCoverage={pendingGatePass?.eligibility.RequiredCoverage ?? 0}
        submitting={isIssuingOverride}
        onIssueAnyway={handleIssueGatePassOverride}
        onKeepWithheld={finishWithGatePassWithheld}
      />

      <QuantitySelectModal
        isOpen={manageRowId !== null && managedLine !== null}
        tyreId={managedLine && managedLine.TyreID !== "" ? managedLine.TyreID : null}
        tyreLabel={managedLine && managedLine.TyreID !== "" ? getTyreLabel(managedLine.TyreID) : ""}
        initialAllocations={managedLine?.Allocations ?? []}
        onClose={handleManageClose}
        onConfirm={handleManageConfirm}
      />
    </section>
  )
}
