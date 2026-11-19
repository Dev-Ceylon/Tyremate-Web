import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type { SalesReturnRecord } from "../../models/salesReturn"

export function SalesReturnSummaryCard({ salesReturn }: { salesReturn: SalesReturnRecord }) {
  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Return Summary</p>
      <div className="detail-card-grid">
        <div className="detail-card-row"><span className="detail-card-key">Return Number</span><span className="detail-card-val">{salesReturn.ReturnNo}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Return Type</span><span className="detail-card-val">{salesReturn.ReturnTypeName || salesReturn.ReturnTypeCode || "—"}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Status</span><span className="detail-card-val"><StatusBadge label={salesReturn.StatusName || salesReturn.StatusCode || "Unknown"} /></span></div>
        <div className="detail-card-row"><span className="detail-card-key">Sales Order</span><span className="detail-card-val">SO-{salesReturn.SoID}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Invoice</span><span className="detail-card-val">{salesReturn.InvoiceID ? `#${salesReturn.InvoiceID}` : "Not invoiced"}</span></div>
        <div className="detail-card-row"><span className="detail-card-key">Requested Date</span><span className="detail-card-val">{salesReturn.RequestedDate?.slice(0, 10) || "—"}</span></div>
        {salesReturn.WarrantyHandlingName && <div className="detail-card-row"><span className="detail-card-key">Warranty Handling</span><span className="detail-card-val">{salesReturn.WarrantyHandlingName}</span></div>}
      </div>
    </div>
  )
}
