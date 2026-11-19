import type { SalesReturnDetails } from "../models/salesReturn"
import { SALES_RETURN_STATUS_CODES } from "../constants/salesReturnStatusConstants"

interface RefundMethod {
  MethodId: number
  MethodCode: string
  MethodName: string
}

interface Props {
  details: SalesReturnDetails
  busy: boolean
  refundAmount: string
  refundMethodId: string
  refundMethods: RefundMethod[]
  onRefundAmountChange: (amount: string) => void
  onRefundMethodChange: (methodId: string) => void
  onRetryCreditNote: () => void
  onApproveCreditNote: (creditNoteId: number) => void
  onIssueStoreCredit: (creditNoteId: number) => void
  onRecordRefund: (creditNoteId: number, available: number) => void
  onCompleteRefund: (refundId: number) => void
}

export function SalesReturnFinancialActions({
  details, busy, refundAmount, refundMethodId, refundMethods,
  onRefundAmountChange, onRefundMethodChange, onRetryCreditNote,
  onApproveCreditNote, onIssueStoreCredit, onRecordRefund, onCompleteRefund,
}: Props) {
  const creditNotes = details.creditNotes ?? []
  const RETRY_ELIGIBLE_STATUSES = [
    SALES_RETURN_STATUS_CODES.APPROVED,
    SALES_RETURN_STATUS_CODES.RECEIVED_IN_STOCK,
    SALES_RETURN_STATUS_CODES.CREDIT_ISSUED,
  ] as const
  const canRetryCreditNote = details.salesReturn.InvoiceID
    && details.salesReturn.StatusCode
    && RETRY_ELIGIBLE_STATUSES.includes(details.salesReturn.StatusCode as typeof RETRY_ELIGIBLE_STATUSES[number])
    && creditNotes.length === 0

  return (
    <section className="panel panel-strong rounded-lg p-5 space-y-3" aria-label="Credit and refund actions">
      <div><p className="eyebrow">Finance</p><h3 className="font-semibold">Credits & refunds</h3></div>
      {canRetryCreditNote && <button type="button" className="secondary-action" disabled={busy} onClick={onRetryCreditNote}>Retry credit note creation</button>}
      {creditNotes.map((note) => {
        const settled = details.refunds
          .filter((refund) => refund.CreditNoteID === note.CreditNoteID && !["CANCELLED", "FAILED"].includes(refund.StatusCode || ""))
          .reduce((sum, refund) => sum + Number(refund.Amount || 0), 0)
        const available = Math.max(0, Number(note.TotalAmount) - settled)
        return (
          <div className="summary-item" key={`credit-${note.CreditNoteID}`}>
            <span className="label">Credit note:</span>
            <span className="value">{note.CreditNoteNo} · {note.StatusName || note.StatusCode} · LKR {Number(note.TotalAmount).toLocaleString()}</span>
            <div className="flex flex-wrap gap-2">
              {note.StatusCode === "REQUESTED" && <button type="button" className="secondary-action" disabled={busy} onClick={() => onApproveCreditNote(note.CreditNoteID)}>Approve credit note</button>}
              {note.StatusCode === "APPROVED" && details.salesReturn.CustomerID && available > 0 && <button type="button" className="secondary-action" disabled={busy} onClick={() => onIssueStoreCredit(note.CreditNoteID)}>Issue store credit</button>}
            </div>
          </div>
        )
      })}
      {creditNotes.filter((note) => note.StatusCode === "APPROVED").map((note) => {
        const settled = details.refunds
          .filter((refund) => refund.CreditNoteID === note.CreditNoteID && !["CANCELLED", "FAILED"].includes(refund.StatusCode || ""))
          .reduce((sum, refund) => sum + Number(refund.Amount || 0), 0)
        const available = Math.max(0, Number(note.TotalAmount) - settled)
        return (
          <div className="flex flex-wrap items-end gap-2" key={`refund-${note.CreditNoteID}`}>
            <label className="field-label">Refund amount (LKR)
              <input className="text-input" type="number" min="0.01" max={available} step="0.01" value={refundAmount} onChange={(event) => onRefundAmountChange(event.target.value)} />
            </label>
            <label className="field-label">Method
              <select className="text-input" value={refundMethodId} onChange={(event) => onRefundMethodChange(event.target.value)}>
                {refundMethods.map((method) => <option key={method.MethodId} value={method.MethodId}>{method.MethodName}</option>)}
              </select>
            </label>
            <button type="button" className="secondary-action" disabled={busy || available <= 0 || !refundAmount || !refundMethodId} onClick={() => onRecordRefund(note.CreditNoteID, available)}>Record refund</button>
            <span className="secondary-text">Remaining refundable: LKR {available.toLocaleString()}</span>
          </div>
        )
      })}
      {details.refunds.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Refunds</h4>
          <ul className="space-y-1">
            {details.refunds.map((refund) => <li key={refund.RefundID}>{refund.RefundNo || `Refund #${refund.RefundID}`} · LKR {Number(refund.Amount).toLocaleString()} · {refund.StatusName || refund.StatusCode}</li>)}
          </ul>
          {details.refunds.filter((refund) => refund.StatusCode === "PENDING").map((refund) => (
            <button type="button" className="secondary-action mt-2" key={`complete-refund-${refund.RefundID}`} disabled={busy} onClick={() => onCompleteRefund(refund.RefundID)}>Mark refund #{refund.RefundID} paid</button>
          ))}
        </div>
      )}
    </section>
  )
}
