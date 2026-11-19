import type { SoDeliveryProgress, SoDeliveryRecord } from "../../models/delivery"
import { INVOICE_STATUS_CODES, type InvoiceRecord } from "../../../invoice/models/invoice"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"

type DeliveriesSectionProps = {
  progress: SoDeliveryProgress | null
  deliveries: SoDeliveryRecord[]
  loading?: boolean
  onRecord?: () => void
  onGenerateInvoice?: (deliveryId: number) => void
  onPayInvoice?: (deliveryId: number) => void
  onWarehouseIssueNote?: (deliveryId: number) => void
  onIssueGatePass?: (deliveryId: number) => void
  issuingGatePassId?: number | null
  deliveryInvoices: ReadonlyMap<number, InvoiceRecord>
  generatingDeliveryId?: number | null
  preparingPaymentDeliveryId?: number | null
  loadingWarehouseNoteDeliveryId?: number | null
  disabled?: boolean
}

/**
 * Read-only view of the collection status for a sales order: what the customer
 * was given at creation, what is still to collect and what is still to order.
 * The Record Delivery action hands over the remaining tyres.
 */
export function DeliveriesSection({
  progress,
  deliveries,
  loading,
  onRecord,
  onGenerateInvoice,
  onPayInvoice,
  onWarehouseIssueNote,
  onIssueGatePass,
  issuingGatePassId,
  deliveryInvoices,
  generatingDeliveryId,
  preparingPaymentDeliveryId,
  loadingWarehouseNoteDeliveryId,
  disabled = false,
}: DeliveriesSectionProps) {
  const canRecord = (progress?.Totals.RemainingCollectable ?? 0) > 0

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Deliveries</p>
          <h3>Collection Status</h3>
        </div>
        <div className="header-actions">
          {progress?.IsFullyDelivered && (
            <span className="status-badge status-completed">Fully Collected</span>
          )}
          {progress && !progress.IsFullyDelivered && (
            <span className="stat-badge">Remaining {progress.Totals.RemainingToCollect}</span>
          )}
          {progress && progress.Totals.RemainingCollectable > 0 && !progress.IsFullyDelivered && (
            <span className="stat-badge status-completed">Ready to Collect {progress.Totals.RemainingCollectable}</span>
          )}
          {progress && progress.Totals.ToOrderQty > 0 && (
            <span className="stat-badge text-danger">To Order {progress.Totals.ToOrderQty}</span>
          )}
          {onRecord && (
            <button
              className="primary-action table-action"
              onClick={onRecord}
              disabled={disabled || !canRecord}
              title={canRecord ? "Hand over the remaining tyres" : "Nothing left to collect"}
            >
              Record Delivery
            </button>
          )}
        </div>
      </div>

      {loading && !progress ? (
        <p className="hero-text">Loading delivery details...</p>
      ) : progress && progress.Lines.length > 0 ? (
        <div className="table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Tyre (Brand / Size - Pattern)</th>
                <th className="text-right">Ordered</th>
                <th className="text-right">Taken Now</th>
                <th className="text-right">Ready to Collect</th>
                <th className="text-right">Remaining to Collect</th>
                <th className="text-right">To Order</th>
              </tr>
            </thead>
            <tbody>
              {progress.Lines.map((line) => (
                <tr key={line.SoTyreID}>
                  <td>
                    <span className="font-medium">
                      {line.Brand || "NA"} / {line.Size || "NA"} - {line.Pattern || "NA"}
                    </span>
                  </td>
                  <td className="text-right">{line.OrderedQty}</td>
                  <td className="text-right font-bold">{line.DeliveredQty}</td>
                  <td className="text-right">
                    {line.RemainingCollectable > 0 ? (
                      <span className="font-bold text-success">{line.RemainingCollectable}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="text-right">
                    {line.IsFullyDelivered ? (
                      <span className="status-badge status-completed">Done</span>
                    ) : (
                      line.RemainingToCollect
                    )}
                  </td>
                  <td className="text-right">
                    <span className={line.ToOrderQty > 0 ? "text-danger font-bold" : ""}>{line.ToOrderQty}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="delivery-history">
        <p className="section-label">Recorded Deliveries</p>
        {deliveries.length === 0 ? (
          <p className="secondary-text">
            {canRecord
              ? "No deliveries recorded yet. Tyres are in stock and ready to collect above."
              : "No deliveries recorded yet."}
          </p>
        ) : (
          <ul className="delivery-record-list">
            {deliveries.map((delivery) => {
              const totalQty = delivery.TotalQty ?? delivery.Lines.reduce((sum, line) => sum + line.Qty, 0)
              const invoice = deliveryInvoices.get(delivery.ID)
              const paymentStatus = invoice ? getInvoicePaymentStatus(invoice.Status) : null
              return (
                <li key={delivery.ID} className="delivery-record">
                  <div className="delivery-record-header">
                    <div className="delivery-record-main">
                      <span className="delivery-record-title">
                        {delivery.DeliveryDate}
                        {delivery.GatePassNo
                          ? ` - Gate Pass ${delivery.GatePassNo}`
                          : delivery.GatePass && !delivery.GatePass.CanIssue
                            ? " - Gate pass withheld"
                            : ""}
                      </span>
                      <span className="delivery-record-sub">
                        {delivery.Lines.length} line{delivery.Lines.length === 1 ? "" : "s"} - {totalQty} tyre(s)
                      </span>
                      {invoice && paymentStatus && (
                        <div className="delivery-record-payment-summary">
                          <span className="delivery-record-invoice-code">
                            {invoice.InvoiceNumber || `Invoice #${invoice.InvoiceID}`}
                          </span>
                          <StatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
                          <span className="delivery-record-sub">
                            Paid ${invoice.AmountPaid.toLocaleString()} | Due ${invoice.BalanceDue.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {delivery.Notes && <span className="delivery-record-note">{delivery.Notes}</span>}
                    </div>
                    {(onGenerateInvoice || onPayInvoice || onWarehouseIssueNote || onIssueGatePass) && (
                      <div className="header-actions">
                        {onIssueGatePass && !delivery.GatePassNo && delivery.GatePass?.CanIssue && (
                          <button
                            className="primary-action table-action"
                            onClick={() => onIssueGatePass(delivery.ID)}
                            disabled={disabled || issuingGatePassId != null}
                            title="Issue a gate pass for this delivery"
                          >
                            {issuingGatePassId === delivery.ID ? "Issuing..." : "Issue Gate Pass"}
                          </button>
                        )}
                        {delivery.GatePass && !delivery.GatePass.Issued && !delivery.GatePass.CanIssue && (
                          <span
                            className="gate-pass-withheld"
                            title={`Settled payments cover ${formatMoney(delivery.GatePass.SettledAmount)} of the ${formatMoney(delivery.GatePass.RequiredCoverage)} handed over so far.`}
                          >
                            Gate pass withheld - {formatMoney(delivery.GatePass.Shortfall)} unpaid
                          </span>
                        )}
                        {onWarehouseIssueNote && (
                          <button
                            className="secondary-action table-action"
                            onClick={() => onWarehouseIssueNote(delivery.ID)}
                            disabled={disabled || loadingWarehouseNoteDeliveryId !== null}
                            title="Print or download a warehouse issue note for this delivery"
                          >
                            {loadingWarehouseNoteDeliveryId === delivery.ID ? "Loading..." : "Warehouse Note"}
                          </button>
                        )}
                        {onPayInvoice && invoice && invoice.BalanceDue > 0 && invoice.Status !== INVOICE_STATUS_CODES.CANCELLED && (
                          <button
                            className="primary-action table-action"
                            onClick={() => onPayInvoice(delivery.ID)}
                            disabled={disabled || preparingPaymentDeliveryId !== null}
                            title="Add a payment to this delivery invoice"
                          >
                            {preparingPaymentDeliveryId === delivery.ID ? "Loading..." : "Add payment"}
                          </button>
                        )}
                        {onGenerateInvoice && (
                          <button
                            className="secondary-action table-action"
                            onClick={() => onGenerateInvoice(delivery.ID)}
                            disabled={disabled || generatingDeliveryId === delivery.ID}
                            title="Open the invoice for this hand-over"
                          >
                            {generatingDeliveryId === delivery.ID ? "Generating..." : "Invoice"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {delivery.Lines.length > 0 && (
                    <div className="table-scroll delivery-record-body">
                      <table className="product-table">
                        <thead>
                          <tr>
                            <th>Tyre (Brand / Size - Pattern)</th>
                            <th>Location</th>
                            <th>DOT</th>
                            <th className="text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {delivery.Lines.map((line) => (
                            <tr key={line.ID}>
                              <td>
                                {line.Brand || "NA"} / {line.Size || "NA"} - {line.Pattern || "NA"}
                              </td>
                              <td>{line.LocationName || "NA"}</td>
                              <td>{line.DOT || "-"}</td>
                              <td className="text-right font-bold">{line.Qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function formatMoney(value: number) {
  return `LKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getInvoicePaymentStatus(status: InvoiceRecord["Status"]) {
  switch (status) {
    case INVOICE_STATUS_CODES.PAID:
      return { label: "Paid", tone: "completed" as const }
    case INVOICE_STATUS_CODES.PARTIALLY_PAID:
      return { label: "Partially Paid", tone: "pending" as const }
    case INVOICE_STATUS_CODES.OVERDUE:
      return { label: "Overdue", tone: "rejected" as const }
    case INVOICE_STATUS_CODES.CANCELLED:
      return { label: "Cancelled", tone: "rejected" as const }
    case INVOICE_STATUS_CODES.DRAFT:
      return { label: "Draft", tone: "pending" as const }
    default:
      return { label: "Unpaid", tone: "pending" as const }
  }
}
