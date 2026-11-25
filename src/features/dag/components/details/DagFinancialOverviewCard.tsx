import { Link } from "@/lib/router"
import { formatCurrency } from "../../utils/dagDetails"
import type { DagTotals } from "../../utils/dagDetails"
import type { InvoiceDetailedRecord } from "../../../invoice/models/invoice"
import { InvoiceStatusBadge } from "../../../invoice/components/InvoiceStatusBadge"

type DagFinancialOverviewCardProps = {
  totals: DagTotals
  invoice?: InvoiceDetailedRecord | null
  loadingInvoice?: boolean
  onGenerateInvoice?: () => void
  isGeneratingInvoice?: boolean
}

export function DagFinancialOverviewCard({
  totals,
  invoice,
  loadingInvoice,
  onGenerateInvoice,
  isGeneratingInvoice,
}: DagFinancialOverviewCardProps) {
  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Financial Overview</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Total Cost</span>
          <span className="detail-card-val">Rs {formatCurrency(totals.totalCost)}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Taken</span>
          <span className="detail-card-val">Rs {formatCurrency(totals.takenAmount)}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Total Paid</span>
          <span className="detail-card-val">Rs {formatCurrency(totals.paidAmount)}</span>
        </div>
        {totals.outstanding > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Amount Due</span>
            <span className="detail-card-val text-danger font-bold">
              Rs {formatCurrency(totals.outstanding)}
            </span>
          </div>
        )}
        <div className="detail-card-row">
          <span className="detail-card-key">Invoice</span>
          <span className="detail-card-val">
            {loadingInvoice ? (
              <span className="text-muted text-xs">Loading…</span>
            ) : invoice ? (
              <span className="dag-invoice-val-group">
                <Link
                  to={`/invoices/${invoice.InvoiceID}`}
                  className="dag-invoice-link"
                >
                  {invoice.InvoiceNumber}
                </Link>
                <InvoiceStatusBadge status={invoice.Status} isOverdue={invoice.IsOverdue} />
              </span>
            ) : (
              <span className="dag-invoice-val-group">
                <span className="text-muted text-xs">Not Invoiced</span>
                {onGenerateInvoice && (
                  <button
                    type="button"
                    className="dag-invoice-generate-btn"
                    onClick={onGenerateInvoice}
                    disabled={isGeneratingInvoice}
                  >
                    {isGeneratingInvoice ? "Generating…" : "Generate Invoice"}
                  </button>
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
