import { Link, useNavigate } from "@/lib/router"
import { InvoiceStatusBadge } from "../components/InvoiceStatusBadge"
import { CreditNoteDialog } from "../components/CreditNoteDialog"
import { CancelInvoiceDialog } from "../components/CancelInvoiceDialog"
import { PrinterModal } from "../../printer/components/PrinterModal"
import { PaymentModalController } from "../../../shared/payment/ui/PaymentModalController"
import { ReceiptPreviewModal } from "../../../shared/payment/ui/ReceiptPreviewModal"
import { LoadingState } from "../../../shared/ui/progress"
import { useInvoiceDetailsPage } from "../hooks/useInvoiceDetailsPage"

export default function InvoiceDetailsPage() {
  const {
    record,
    loading,
    error,
    submitting,
    isPrinting,
    isDownloadingPdf,
    isPrinterModalOpen,
    handlePrint,
    handleDownloadPdf,
    handleClosePrinterModal,
    isCreditNoteOpen,
    isCancelOpen,
    isPaymentModalOpen,
    isPaying,
    paymentForm,
    receiptViewer,
    sourceText,
    sourceLabel,
    sourceLink,
    isCancelled,
    isCreditNote,
    canCreditNote,
    canRecordPayment,
    handleCreditNote,
    handleCancel,
    handleBack,
    handleRecordPayment,
    openPaymentModal,
    closePaymentModal,
    openCreditNote,
    closeCreditNote,
    openCancel,
    closeCancel,
    fmt,
  } = useInvoiceDetailsPage()

  const navigate = useNavigate()

  if (loading) return <main className="app-shell"><LoadingState message="Loading invoice details…" /></main>
  if (error || !record) return <main className="app-shell"><p className="hero-text error-text">{error || "Invoice not found"}</p></main>

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">{isCreditNote ? "Credit Note" : "Invoice"} Detail</p>
          <h1>{record.InvoiceNumber}</h1>
          <p className="hero-text">
            {record.InvoiceDate}
            {record.DueDate ? ` | Due ${record.DueDate}` : ""}
          </p>
        </div>
        <div className="header-actions">
          {sourceLink && (
            <button
              type="button"
              className="secondary-action"
              onClick={() => navigate(sourceLink)}
            >
              View {sourceLabel}
            </button>
          )}
          {canRecordPayment && (
            <button className="primary-action" onClick={openPaymentModal}>
              Record Payment
            </button>
          )}
          <button className="secondary-action" onClick={() => void handleDownloadPdf()} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? "Preparing..." : "Download PDF"}
          </button>
          <button className="primary-action" onClick={() => void handlePrint()} disabled={isPrinting}>
            {isPrinting ? "Printing..." : "Print"}
          </button>
          {canCreditNote && (
            <button className="secondary-action" onClick={openCreditNote}>
              Credit Note
            </button>
          )}
          {!isCancelled && !isCreditNote && (
            <button className="secondary-action" onClick={openCancel}>
              Cancel
            </button>
          )}
          <button className="secondary-action" onClick={handleBack}>
            Back
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="info-panel panel panel-strong">
          <p className="section-label">Billing To</p>
          <div className="detail-card-grid">
            <div className="detail-card-row">
              <span className="detail-card-key">Customer</span>
              <span className="detail-card-val">{record.CustomerName || "Walk-in"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Address</span>
              <span className="detail-card-val">{record.CustomerAddress || "-"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Phone</span>
              <span className="detail-card-val">{record.CustomerPhone || "-"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">VAT No</span>
              <span className="detail-card-val">{record.CustomerVatNo || "-"}</span>
            </div>
          </div>
        </div>

        <div className="info-panel panel panel-strong">
          <p className="section-label">Financial Overview</p>
          <div className="detail-card-grid">
            <div className="detail-card-row">
              <span className="detail-card-key">Source</span>
              <span className="detail-card-val">
                {sourceLink ? (
                  <Link to={sourceLink} className="invoice-source-link">
                    {sourceText}
                  </Link>
                ) : (
                  sourceText
                )}
              </span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Status</span>
              <span className="detail-card-val">
                <InvoiceStatusBadge status={record.Status} isOverdue={record.IsOverdue} />
              </span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Subtotal</span>
              <span className="detail-card-val">${fmt(record.Subtotal)}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Discount</span>
              <span className="detail-card-val">- ${fmt(record.DiscountTotal)}</span>
            </div>
            {record.TaxAmount > 0 && (
              <div className="detail-card-row">
                <span className="detail-card-key">{record.TaxLabel || "Tax"}</span>
                <span className="detail-card-val">${fmt(record.TaxAmount)}</span>
              </div>
            )}
            <div className="detail-card-row">
              <span className="detail-card-key">Total</span>
              <span className="detail-card-val font-bold">${fmt(record.Total)}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Amount Paid</span>
              <span className="detail-card-val">${fmt(record.AmountPaid)}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Balance Due</span>
              <span className="detail-card-val font-bold">${fmt(record.BalanceDue)}</span>
            </div>
          </div>
        </div>
      </section>

      {record.Notes && (
        <section className="info-panel panel panel-strong mt-6">
          <p className="section-label">Notes</p>
          <p className="hero-text">{record.Notes}</p>
        </section>
      )}

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <h2>Line Items</h2>
        </div>
        <div className="tm-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Disc %</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {record.Lines?.map((line) => {
                const isBatteryLine = line.LineType === "battery" || Boolean(line.BatteryID)
                const specText = isBatteryLine
                  ? [line.Brand, line.Model, line.Capacity, line.Voltage].filter(Boolean).join(" / ")
                  : [line.Brand, line.Size, line.Pattern].filter(Boolean).join(" / ")

                return (
                  <tr key={line.InvoiceLineID}>
                    <td>
                      <span className="font-medium">
                        {line.Description || specText || "-"}
                      </span>
                      {line.SerialNo && <span className="notification-code">SN {line.SerialNo}</span>}
                    </td>
                    <td className="text-right">{line.Qty}</td>
                    <td className="text-right">${fmt(line.UnitPrice)}</td>
                    <td className="text-right">{line.Discount}</td>
                    <td className="text-right font-bold">${fmt(line.LineTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {record.CreditNotes && record.CreditNotes.length > 0 && (
        <section className="table-panel panel panel-strong mt-6">
          <div className="table-panel-header">
            <h2>Credit Notes</h2>
          </div>
          <div className="tm-table-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Credit Note #</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {record.CreditNotes.map((cn) => (
                  <tr key={cn.InvoiceID}>
                    <td className="mono-text">{cn.InvoiceNumber}</td>
                    <td className="secondary-text">{cn.InvoiceDate}</td>
                    <td className="text-right font-bold">${fmt(cn.Total)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="secondary-action table-action"
                        onClick={() => navigate(`/invoices/${cn.InvoiceID}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PaymentModalController
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        onConfirm={handleRecordPayment}
        confirmLabel="Record Payment"
        submitting={isPaying}
        form={paymentForm}
      />

      <ReceiptPreviewModal
        isOpen={receiptViewer.isOpen}
        onClose={receiptViewer.closeReceipt}
        receipts={receiptViewer.previewReceipts}
        title={receiptViewer.previewTitle}
        manage={receiptViewer.manage}
      />

      <CreditNoteDialog
        isOpen={isCreditNoteOpen}
        invoiceNumber={record.InvoiceNumber}
        submitting={submitting}
        onClose={closeCreditNote}
        onSubmit={handleCreditNote}
      />

      <CancelInvoiceDialog
        isOpen={isCancelOpen}
        invoiceNumber={record.InvoiceNumber}
        submitting={submitting}
        onClose={closeCancel}
        onSubmit={handleCancel}
      />

      <PrinterModal isOpen={isPrinterModalOpen} onClose={handleClosePrinterModal} />
    </main>
  )
}
