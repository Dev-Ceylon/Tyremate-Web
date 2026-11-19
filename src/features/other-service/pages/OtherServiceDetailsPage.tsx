import { useNavigate } from "@/lib/router"
import { useOtherServiceDetails } from "../hooks/useOtherServiceDetails"
import { useOtherServicePaymentForm } from "../hooks/useOtherServicePaymentForm"
import { PAYMENT_TYPE_CODES } from "../../../shared/payment/constants/paymentTypeConstants"
import { PaymentTypeModal } from "../../../shared/payment/ui/PaymentTypeModal"
import { usePaymentSettlement } from "../../../shared/payment/hooks/usePaymentSettlement"
import { PaymentCard } from "../components/Payments/PaymentCard"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { useGenerateInvoice } from "../../invoice/hooks/useGenerateInvoice"

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

const serviceStatusBadge = (isCompleted: number) => (
  <span className={`status-badge ${isCompleted ? "status-completed" : "status-pending"}`}>
    {isCompleted ? "Completed" : "In Progress"}
  </span>
)

const paymentStatusBadge = (isPaid: boolean) => (
  <span className={`status-badge ${isPaid ? "status-approved" : "status-pending"}`}>
    {isPaid ? "Paid" : "Unpaid"}
  </span>
)

export default function OtherServiceDetailsPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const {
    record,
    loading,
    error,
    makePayment,
    completeChequePayment,
    completeService,
    submitting,
  } = useOtherServiceDetails()

  const totalAmount = record?.TotalAmount ?? 0

  const {
    isModalOpen,
    openModal,
    closeModal,
    selectedPaymentType,
    setSelectedPaymentType,
    cashData,
    setCashData,
    chequeData,
    setChequeData,
    bankTransferData,
    setBankTransferData,
    handleModalConfirm,
  } = useOtherServicePaymentForm({ totalAmount, makePayment })

  const settlement = usePaymentSettlement(totalAmount, cashData, chequeData, bankTransferData)

  const { isGenerating: isGeneratingInvoice, generate: handleGenerateInvoice } = useGenerateInvoice({
    type: "otherService",
    id: record?.OSID ?? null,
  })

  if (loading) return <main className="app-shell"><p className="hero-text">Loading service details...</p></main>
  if (error || !record) return <main className="app-shell"><p className="hero-text error-text">{error || "Service not found"}</p></main>

  const remainingAmount = record.RemainingAmount ?? 0
  const customerLabel = record.CustomerName || record.AdHocCustomerName || "-"
  const customerDetail = record.CustomerCode
    ? `${customerLabel} (${record.CustomerCode})`
    : customerLabel

  const isPaymentFullyCompleted = record.IsPaymentCompleted === 1
  const hasChequePayment = record.Payments?.some((p) => p.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE)
  const showMakePaymentButton = !isPaymentFullyCompleted && !hasChequePayment
  const showCompleteServiceButton = isPaymentFullyCompleted && record.IsCompleted !== 1

  const handleCompleteCheque = async (paymentId?: number) => {
    if (!paymentId) return
    const confirmed = await confirm({
      title: "Mark Cheque as Collected",
      message: "Are you sure you want to mark this cheque as collected?",
      confirmLabel: "Mark Collected",
    })
    if (!confirmed) return
    await completeChequePayment(paymentId)
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Other Service Detail</p>
          <h1>Service #{record.OSID}</h1>
          <p className="hero-text">Details of consumables used and payment status.</p>
        </div>
        <div className="header-actions">
          {showCompleteServiceButton && (
            <button className="primary-action" onClick={() => void completeService()} disabled={submitting}>
              {submitting ? "Processing..." : "Complete Service"}
            </button>
          )}
          <button className="secondary-action" onClick={() => void handleGenerateInvoice()} disabled={isGeneratingInvoice}>
            {isGeneratingInvoice ? "Generating..." : "Invoice"}
          </button>
          <button className="secondary-action" onClick={() => navigate("/other-service")}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="info-panel panel panel-strong">
          <p className="section-label">Service Summary</p>
          <div className="detail-card-grid">
            <div className="detail-card-row">
              <span className="detail-card-key">Customer</span>
              <span className="detail-card-val">{customerDetail}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Date</span>
              <span className="detail-card-val">{record.Date}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Status</span>
              <span className="detail-card-val">{serviceStatusBadge(record.IsCompleted)}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Payment Status</span>
              <span className="detail-card-val">{paymentStatusBadge(isPaymentFullyCompleted)}</span>
            </div>
          </div>
        </div>

        <div className="info-panel panel panel-strong">
          <p className="section-label">Financial Overview</p>
          <div className="detail-card-grid">
            <div className="detail-card-row">
              <span className="detail-card-key">Total Amount</span>
              <span className="detail-card-val">${fmt(totalAmount)}</span>
            </div>
            {remainingAmount > 0 && (
              <div className="detail-card-row">
                <span className="detail-card-key">Amount Due</span>
                <span className="detail-card-val">${fmt(remainingAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <h2>Consumable Lines</h2>
        </div>
        <div className="tm-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Consumable</th>
                <th className="text-right">Price</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {record.Consumables?.map((c) => (
                <tr key={c.ID}>
                  <td>
                    <span className="font-medium">
                      {c.ConsumableName}{c.ConsumableCategory ? ` (${c.ConsumableCategory})` : ""}
                    </span>
                  </td>
                  <td className="text-right">${fmt(c.Price)}</td>
                  <td className="text-right font-bold">{c.Qty}</td>
                  <td className="text-right">${fmt(c.Price * c.Qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {record.Payments && record.Payments.length > 0 && (
        <section className="table-panel panel panel-strong mt-6">
          <div className="table-panel-header">
            <h2>Payment Details</h2>
            <div className="header-actions">
              {paymentStatusBadge(isPaymentFullyCompleted)}
              {showMakePaymentButton && (
                <button className="primary-action" onClick={openModal}>
                  Make payment
                </button>
              )}
            </div>
          </div>
          <div className="so-payment-grid">
            {record.Payments.map((payment, idx) => (
              <PaymentCard
                key={idx}
                payment={payment}
                onCompleteCheque={handleCompleteCheque}
                submitting={submitting}
              />
            ))}
          </div>
        </section>
      )}

      <PaymentTypeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        confirmLabel="Confirm Payment"
        selectedPaymentType={selectedPaymentType}
        onPaymentTypeChange={setSelectedPaymentType}
        needToPay={settlement.needToPay}
        enteredTotal={settlement.enteredTotal}
        remainingDue={settlement.remainingDue}
        overPaid={settlement.overPaid}
        remainingForCash={settlement.remainingForCash}
        cashPaymentData={cashData}
        onCashPaymentChange={setCashData}
        chequePaymentData={chequeData}
        onChequePaymentChange={(data) => setChequeData((prev) => ({ ...prev, ...data }))}
        bankTransferPaymentData={bankTransferData}
        onBankTransferPaymentChange={(data) => setBankTransferData((prev) => ({ ...prev, ...data }))}
        onConfirm={handleModalConfirm}
        submitting={submitting}
      />
    </main>
  )
}