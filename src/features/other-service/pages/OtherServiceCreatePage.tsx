import { useCallback } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { PaymentTypeModal } from "../../../shared/payment/ui/PaymentTypeModal"
import { usePaymentSettlement } from "../../../shared/payment/hooks/usePaymentSettlement"
import { OtherServiceForm } from "../components/OtherServiceForm"
import { useOtherServiceForm } from "../hooks/useOtherServiceForm"
import { useOtherServicePayment } from "../hooks/useOtherServicePayment"

export default function OtherServiceCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "Other service created",
      message: "The other service was saved successfully.",
    })
    navigate("/other-service")
  }, [navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: "Failed to create other service",
      message,
    })
  }, [showToast])

  const {
    formData,
    lines,
    consumables,
    initializing,
    submitting,
    error,
    totalAmount,
    updateField,
    addLine,
    removeLine,
    updateLine,
    setLineConsumable,
    buildPaymentPayload,
    submitOrder,
  } = useOtherServiceForm({
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const {
    isPaymentModalOpen,
    selectedPaymentType,
    setSelectedPaymentType,
    cashPaymentData,
    setCashPaymentData,
    chequePaymentData,
    setChequePaymentData,
    bankTransferPaymentData,
    setBankTransferPaymentData,
    closePaymentModal,
    openPaymentModal,
    handleModalConfirm,
  } = useOtherServicePayment({
    totalAmount,
    buildPaymentPayload,
    submitOrder,
  })

  const settlement = usePaymentSettlement(totalAmount, cashPaymentData, chequePaymentData, bankTransferPaymentData)

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Other Service</p>
          <h2>Create Other Service</h2>
        </div>
      </div>

      {initializing ? <p className="hero-text">Loading options...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}

      <OtherServiceForm
        state={{
          formData,
          lines,
          consumables,
          totalAmount,
          submitting: submitting || initializing,
        }}
        actions={{
          onChangeCustomerName: (value) => updateField("CustomerName", value),
          onChangeCustomerPhone: (value) => updateField("CustomerPhone", value),
          onChangeCustomerEmail: (value) => updateField("CustomerEmail", value),
          onAddLine: addLine,
          onRemoveLine: removeLine,
          onChangeLineConsumable: (rowId, value) => setLineConsumable(rowId, value),
          onChangeLinePrice: (rowId, value) => updateLine(rowId, "Price", value),
          onChangeLineQty: (rowId, value) => updateLine(rowId, "Qty", value),
          onMakePayment: openPaymentModal,
          onCancel: () => navigate("/other-service"),
        }}
      />

      <PaymentTypeModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        confirmLabel="Confirm Payment"
        selectedPaymentType={selectedPaymentType}
        onPaymentTypeChange={setSelectedPaymentType}
        needToPay={settlement.needToPay}
        enteredTotal={settlement.enteredTotal}
        remainingDue={settlement.remainingDue}
        overPaid={settlement.overPaid}
        remainingForCash={settlement.remainingForCash}
        cashPaymentData={cashPaymentData}
        onCashPaymentChange={(data) => setCashPaymentData((prev) => ({ ...prev, ...data }))}
        chequePaymentData={chequePaymentData}
        onChequePaymentChange={(data) => setChequePaymentData((prev) => ({ ...prev, ...data }))}
        bankTransferPaymentData={bankTransferPaymentData}
        onBankTransferPaymentChange={(data) => setBankTransferPaymentData((prev) => ({ ...prev, ...data }))}
        onConfirm={handleModalConfirm}
        submitting={submitting}
      />
    </section>
  )
}
