import { StatusBadge } from "../../../shared/ui/StatusBadge";
import type { ViolationGroup } from "../models/violation";

interface ViolationSummaryCardProps {
  violation: ViolationGroup;
  violationTypeLabel: string;
  violationTypeName: string;
  totalValue: number;
  formatMoney: (amount: number) => string;
  formatDate: (date: string | null | undefined) => string;
  getStatusLabel: (isApproved: number) => string;
  onViewSO?: (soId: number) => void;
  onViewLine?: (soId: number, soTyreId: number) => void;
}

export function ViolationSummaryCard({
  violation,
  violationTypeLabel,
  violationTypeName,
  totalValue,
  formatMoney,
  formatDate,
  getStatusLabel,
  onViewSO,
  onViewLine,
}: ViolationSummaryCardProps) {
  const statusLabel = getStatusLabel(violation.IsApproved);

  const getBadgeTone = (status: string) => {
    if (status === "Approved") return "approved" as const;
    if (status === "Rejected") return "rejected" as const;
    return "pending" as const;
  };

  const soTyreId = violation.SoTyreID ?? undefined;

  return (
    <section className="info-panel panel panel-strong">
      <div className="panel-header">
        <div className="violation-identity">
          <span className={`badge badge-violation ${violation.ViolationTypeCode}`}>{violationTypeLabel}</span>
          <h2>Violation #{violation.Id}</h2>
        </div>
        <div className="header-meta">
          <StatusBadge label={statusLabel} tone={getBadgeTone(statusLabel)} />
          <span className="secondary-text">SO-#{violation.SoID}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="detail-grid">
          <div className="detail-section">
            <h4>Basic Information</h4>
            <dl className="detail-list">
              <div><dt>Type</dt><dd>{violationTypeName}</dd></div>
              <div>
                <dt>Sales Order</dt>
                <dd>
                  <button className="link" onClick={() => onViewSO?.(violation.SoID)}>SO-#{violation.SoID}</button>
                </dd>
              </div>
              {soTyreId && onViewLine && (
                <div>
                  <dt>Line Item</dt>
                  <dd>
                    <button className="link" onClick={() => onViewLine(violation.SoID, soTyreId)}>
                      Tyre #{violation.TyreID}
                    </button>
                  </dd>
                </div>
              )}
              <div><dt>Tyre</dt><dd>#{violation.TyreID}</dd></div>
              <div><dt>Quantity</dt><dd>{violation.Qty}</dd></div>
              <div><dt>Unit Price</dt><dd>{formatMoney(violation.Price)}</dd></div>
              <div><dt>Total Value</dt><dd className="font-bold">{formatMoney(totalValue)}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(violation.CreatedDateTime)}</dd></div>
              <div><dt>Responsible</dt><dd>{violation.ResponsibleUser || "—"}</dd></div>
              {violation.ApprovedBy && <div><dt>Approved By</dt><dd>{violation.ApprovedBy}</dd></div>}
              {violation.ApprovedDateTime && <div><dt>Approved On</dt><dd>{formatDate(violation.ApprovedDateTime)}</dd></div>}
            </dl>
          </div>

          {violation.MaxDiscountAllowed !== null && violation.AppliedDiscount !== null && violation.DiscountExcess !== null && (
            <div className="detail-section">
              <h4>Discount Violation</h4>
              <dl className="detail-list">
                <div><dt>Max Allowed</dt><dd>{violation.MaxDiscountAllowed}%</dd></div>
                <div><dt>Applied</dt><dd>{violation.AppliedDiscount}%</dd></div>
                <div><dt className="text-danger">Excess</dt><dd className="text-danger">{violation.DiscountExcess}%</dd></div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ViolationSummaryCard;