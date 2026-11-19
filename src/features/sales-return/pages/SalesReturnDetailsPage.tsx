import { Navigate, useNavigate, useParams } from "@/lib/router"
import { SalesReturnDetailsPanel } from "../components/SalesReturnDetailsPanel"
import { SalesReturnFinancialOverviewCard } from "../components/details/SalesReturnFinancialOverviewCard"
import { SalesReturnSummaryCard } from "../components/details/SalesReturnSummaryCard"
import { useSalesReturnList } from "../hooks/useSalesReturnList"
import type { SalesReturnLineInspection } from "../models/salesReturn"

export default function SalesReturnDetailsPage() {
  const { salesReturnId: rawId } = useParams()
  const salesReturnId = Number(rawId)

  if (!Number.isInteger(salesReturnId) || salesReturnId <= 0) {
    return <Navigate to="/sales-returns" replace />
  }

  return <SalesReturnDetailsContent salesReturnId={salesReturnId} />
}

function SalesReturnDetailsContent({ salesReturnId }: { salesReturnId: number }) {
  const navigate = useNavigate()
  const salesReturn = useSalesReturnList(salesReturnId)

  const updateInspection = (lineId: number, update: Partial<SalesReturnLineInspection>) => {
    salesReturn.setInspections((current) => ({
      ...current,
      [lineId]: { ...current[lineId], ...update },
    }))
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Customer Sales / Sales Returns / Details</p>
          <h1>{salesReturn.details?.salesReturn.ReturnNo || "Sales Return Details"}</h1>
          <p className="hero-text">Review the return, inspect tyres received into quarantine, and manage its customer settlement.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-action" onClick={() => navigate("/sales-returns")}>Back to Sales Returns</button>
          <button type="button" className="secondary-action" onClick={() => void salesReturn.refresh()} disabled={salesReturn.loading || salesReturn.busy}>
            {salesReturn.loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {salesReturn.error && <p className="error-text" role="alert">{salesReturn.error}</p>}
      {salesReturn.loading && !salesReturn.details ? (
        <section className="table-panel panel panel-strong"><p className="p-4 secondary-text">Loading return details...</p></section>
      ) : !salesReturn.details ? (
        <section className="table-panel panel panel-strong"><p className="p-4 secondary-text">Sales return #{salesReturnId} could not be loaded.</p></section>
      ) : (
        <>
          <section className="content-grid">
            <SalesReturnSummaryCard salesReturn={salesReturn.details.salesReturn} />
            <SalesReturnFinancialOverviewCard details={salesReturn.details} />
          </section>

          <SalesReturnDetailsPanel
            details={salesReturn.details}
            inspections={salesReturn.inspections}
            canInspect={Boolean(salesReturn.canInspect)}
            busy={salesReturn.busy}
            refundMethods={salesReturn.refundMethods}
            refundAmount={salesReturn.refundAmount}
            refundMethodId={salesReturn.refundMethodId}
            exchangeOrderId={salesReturn.exchangeOrderId}
            exchangeOrderValue={salesReturn.exchangeOrderValue}
            onInspectionChange={updateInspection}
            onInspectAndApprove={salesReturn.inspectAndApprove}
            onReject={salesReturn.rejectReturn}
            onExchangeOrderIdChange={salesReturn.setExchangeOrderId}
            onLinkExchangeOrder={salesReturn.linkExchangeOrder}
            onRefundAmountChange={salesReturn.setRefundAmount}
            onRefundMethodChange={salesReturn.setRefundMethodId}
            onRetryCreditNote={salesReturn.retryCreditNote}
            onApproveCreditNote={salesReturn.approveCreditNote}
            onIssueStoreCredit={salesReturn.issueStoreCredit}
            onRecordRefund={salesReturn.recordRefund}
            onCompleteRefund={salesReturn.completeRefund}
          />
        </>
      )}
    </main>
  )
}
