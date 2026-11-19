import type { SalesReturnDetails, SalesReturnLineInspection } from "../models/salesReturn"
import { SalesReturnExchangeSection } from "./SalesReturnExchangeSection"
import { SalesReturnFinancialActions } from "./SalesReturnFinancialActions"
import { SalesReturnInspectionTable } from "./SalesReturnInspectionTable"
import { SalesReturnStockHistory } from "./SalesReturnStockHistory"

interface RefundMethod {
  MethodId: number
  MethodCode: string
  MethodName: string
}

interface Props {
  details: SalesReturnDetails | null
  inspections: Record<number, SalesReturnLineInspection>
  canInspect: boolean
  busy: boolean
  refundMethods: RefundMethod[]
  refundAmount: string
  refundMethodId: string
  exchangeOrderId: string
  exchangeOrderValue: number | null
  onInspectionChange: (lineId: number, update: Partial<SalesReturnLineInspection>) => void
  onInspectAndApprove: () => void
  onReject: () => void
  onExchangeOrderIdChange: (id: string) => void
  onLinkExchangeOrder: () => void
  onRefundAmountChange: (amount: string) => void
  onRefundMethodChange: (methodId: string) => void
  onRetryCreditNote: () => void
  onApproveCreditNote: (creditNoteId: number) => void
  onIssueStoreCredit: (creditNoteId: number) => void
  onRecordRefund: (creditNoteId: number, available: number) => void
  onCompleteRefund: (refundId: number) => void
}

export function SalesReturnDetailsPanel({
  details, inspections, canInspect, busy, refundMethods, refundAmount, refundMethodId,
  exchangeOrderId, exchangeOrderValue, onInspectionChange, onInspectAndApprove, onReject,
  onExchangeOrderIdChange, onLinkExchangeOrder, onRefundAmountChange, onRefundMethodChange,
  onRetryCreditNote, onApproveCreditNote, onIssueStoreCredit, onRecordRefund, onCompleteRefund,
}: Props) {
  return (
    <div className="space-y-5">
      {!details ? (
        <section className="panel panel-strong rounded-lg p-6 text-center">
          <p className="font-semibold">Choose a return</p>
          <p className="secondary-text mt-1">Select a record from the queue to review its tyres, inspection, and credit activity.</p>
        </section>
      ) : (
        <>
          <section className="panel panel-strong rounded-lg p-5">
            <div className="table-panel-header">
              <div><p className="eyebrow">Quarantine inspection</p><h2>Returned tyre lines</h2></div>
              <span className="stat-badge">{details.lines.length} line{details.lines.length === 1 ? "" : "s"}</span>
            </div>
            <SalesReturnInspectionTable lines={details.lines} inspections={inspections} canInspect={canInspect} busy={busy} onChange={onInspectionChange} />
            {canInspect && (
              <div className="modal-actions mt-4">
                <button type="button" className="primary-action" disabled={busy} onClick={onInspectAndApprove}>{busy ? "Saving..." : "Save inspection & approve"}</button>
                <button type="button" className="secondary-action" disabled={busy} onClick={onReject}>Reject return</button>
              </div>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <SalesReturnExchangeSection
              details={details}
              exchangeOrderId={exchangeOrderId}
              exchangeOrderValue={exchangeOrderValue}
              busy={busy}
              onExchangeOrderIdChange={onExchangeOrderIdChange}
              onLinkExchangeOrder={onLinkExchangeOrder}
            />
            <SalesReturnFinancialActions
              details={details}
              busy={busy}
              refundAmount={refundAmount}
              refundMethodId={refundMethodId}
              refundMethods={refundMethods}
              onRefundAmountChange={onRefundAmountChange}
              onRefundMethodChange={onRefundMethodChange}
              onRetryCreditNote={onRetryCreditNote}
              onApproveCreditNote={onApproveCreditNote}
              onIssueStoreCredit={onIssueStoreCredit}
              onRecordRefund={onRecordRefund}
              onCompleteRefund={onCompleteRefund}
            />
          </div>
          <SalesReturnStockHistory movements={details.stockMovements} />
        </>
      )}
    </div>
  )
}
