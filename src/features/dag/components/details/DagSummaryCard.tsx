import { getStatusColorClass } from "../../../../shared/constants/statusConstants"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type { DagDetailedRecord } from "../../models/dag"

type DagSummaryCardProps = {
  dag: DagDetailedRecord
}

export function DagSummaryCard({ dag }: DagSummaryCardProps) {
  const totalQty = (dag.Tyres ?? []).reduce((sum, tyre) => sum + (tyre.Qty ?? 0), 0)
  const takenQty = (dag.Tyres ?? []).reduce((sum, tyre) => sum + (tyre.SoldQty ?? 0), 0)

  const grnStatus = dag.GrnStatus ?? "none"
  const grnLabel = grnStatus === "completed" ? "Completed" : grnStatus === "partial" ? "Partial" : "Not Received"
  const grnTone = grnStatus === "completed" ? "completed" : "pending"
  const showGrnProgress = grnStatus !== "none" && (dag.GrnRequiredQty ?? 0) > 0

  const customer = dag.Customer
  const isWalkin = Boolean(customer?.IsWalkinCustomer || dag.IsWalkinCustomer)
  const customerLabel = isWalkin
    ? customer?.CustomerName || dag.CustomerName || "Walk-in Customer"
    : dag.CustomerCode
      ? `${dag.CustomerName} (${dag.CustomerCode})`
      : dag.CustomerName || "—"

  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">DAG Summary</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Customer</span>
          <span className="detail-card-val">{customerLabel}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Customer Type</span>
          <span className="detail-card-val">
            <StatusBadge label={isWalkin ? "Walk-in" : "Registered"} tone={isWalkin ? "pending" : "approved"} />
          </span>
        </div>
        {isWalkin && customer?.IsWalkinCustomer && (
          <>
            <div className="detail-card-row">
              <span className="detail-card-key">Phone</span>
              <span className="detail-card-val">{customer.CustomerPhone || dag.WalkinCustomerPhone || "—"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Address</span>
              <span className="detail-card-val">{customer.CustomerAddress || "—"}</span>
            </div>
            {customer.CustomerEmail && (
              <div className="detail-card-row">
                <span className="detail-card-key">Email</span>
                <span className="detail-card-val">{customer.CustomerEmail}</span>
              </div>
            )}
            {customer.VehicleNumber && (
              <div className="detail-card-row">
                <span className="detail-card-key">Vehicle No</span>
                <span className="detail-card-val">{customer.VehicleNumber}</span>
              </div>
            )}
            {customer.TinNo && (
              <div className="detail-card-row">
                <span className="detail-card-key">TIN No</span>
                <span className="detail-card-val">{customer.TinNo}</span>
              </div>
            )}
            {customer.VatNo && (
              <div className="detail-card-row">
                <span className="detail-card-key">VAT No</span>
                <span className="detail-card-val">{customer.VatNo}</span>
              </div>
            )}
          </>
        )}
        <div className="detail-card-row">
          <span className="detail-card-key">Date</span>
          <span className="detail-card-val">{dag.Date}</span>
        </div>
        {dag.DeliveryDate ? (
          <div className="detail-card-row">
            <span className="detail-card-key">Delivery Date</span>
            <span className="detail-card-val">{dag.DeliveryDate}</span>
          </div>
        ) : null}
        <div className="detail-card-row">
          <span className="detail-card-key">Allocated Tyres</span>
          <span className="detail-card-val">{totalQty}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Tyres Taken</span>
          <span className="detail-card-val">
            {takenQty} / {totalQty}
          </span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Status</span>
          <span className="detail-card-val">
            <span className={`status-badge ${getStatusColorClass(dag.StatusCode)}`}>{dag.StatusName}</span>
          </span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Payment Status</span>
          <span className="detail-card-val">
            <StatusBadge
              label={dag.IsPaymentCompleted === 1 ? "Completed" : "Pending"}
              tone={dag.IsPaymentCompleted === 1 ? "completed" : "pending"}
            />
          </span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">GRN Status</span>
          <span className="detail-card-val">
            <StatusBadge label={grnLabel} tone={grnTone} />
            {showGrnProgress && (
              <span className="secondary-text"> ({dag.GrnAcceptedQty ?? 0}/{dag.GrnRequiredQty})</span>
            )}
          </span>
        </div>
      </div>

      <div className="detail-notes-block">
        <p className="section-label">Comment</p>
        <p>{dag.Comment || "No comment provided for this DAG."}</p>
      </div>
    </div>
  )
}