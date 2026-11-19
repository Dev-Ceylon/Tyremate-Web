import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { formatMoney } from "../../../shared/utils/formatters";
import { VIOLATION_TYPE_CODES, getStatusBadgeTone } from "../constants/violationConstants";
import type { ViolationGroup, PolicyViolationDOTRecord } from "../models/violation";

interface ViolationCardProps {
  violation: ViolationGroup;
  onApprove: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function ViolationCard({ violation, onApprove, onViewDetails }: ViolationCardProps) {
  const isApprovedViolation = violation.IsApproved === 1;

  return (
    <div className={`violation-card panel panel-strong ${violation.ViolationTypeCode}`}>
      <div className="violation-header">
        <div className="violation-type">
          <span
            className={`violation-type-badge ${violation.ViolationTypeCode}`}
            title={violation.ViolationTypeName}
          >
            {violation.ViolationTypeCode?.toUpperCase() || "UNKNOWN"}
          </span>
          <span className="violation-type-name">{violation.ViolationTypeName}</span>
        </div>
        <StatusBadge label={violation.IsApproved === 1 ? "Approved" : violation.IsApproved === 0 ? "Rejected" : "Pending"} tone={getStatusBadgeTone(violation.IsApproved)} />
      </div>

      <div className="violation-details">
        <div className="detail-row">
          <span className="detail-label">Tyre:</span>
          <span className="detail-value">
            {violation.TyreID} - {formatMoney(violation.Price)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Quantity:</span>
          <span className="detail-value">{violation.Qty}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Value:</span>
          <span className="detail-value">{formatMoney(violation.Price * violation.Qty)}</span>
        </div>

        {violation.ViolationTypeCode === VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT && (
          <div className="violation-specific">
            <div className="detail-row">
              <span className="detail-label">Max Discount:</span>
              <span className="detail-value">{violation.MaxDiscountAllowed}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Applied Discount:</span>
              <span className="detail-value">{violation.AppliedDiscount}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Excess:</span>
              <span className="detail-value text-danger">{violation.DiscountExcess}%</span>
            </div>
          </div>
        )}

        {violation.ViolationTypeCode === VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK && violation.DOTs && violation.DOTs.length > 0 && (
          <div className="violation-specific">
            <div className="detail-row">
              <span className="detail-label">Offending DOTs:</span>
              <span className="detail-value">{violation.DOTs.length} batch(es)</span>
            </div>
            <div className="dots-table">
              <div className="tm-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>DOT</th>
                      <th>Oldest Available</th>
                      <th>Location</th>
                      <th className="text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violation.DOTs.map((dot: PolicyViolationDOTRecord) => (
                      <tr key={dot.Id}>
                        <td>
                          <span className="dot-badge">{dot.DOT || "N/A"}</span>
                        </td>
                        <td>
                          <span className="dot-badge">{dot.OldestAvailableDOT || "N/A"}</span>
                        </td>
                        <td>
                          {dot.StorageManagerID ? `Loc #${dot.StorageManagerID}` : "N/A"}
                          {dot.StorageManagerBatchID ? ` / Batch #${dot.StorageManagerBatchID}` : ""}
                        </td>
                        <td className="text-right">{dot.Qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {violation.Details && (
          <div className="violation-notes">
            <strong>Details:</strong> {violation.Details}
          </div>
        )}
      </div>

      <div className="violation-footer">
        <div className="violation-meta">
          <span className="secondary-text">
            {violation.CreatedDateTime ? new Date(violation.CreatedDateTime).toLocaleDateString() : "—"}
          </span>
          {violation.ResponsibleUser && (
            <span className="secondary-text">By: {violation.ResponsibleUser}</span>
          )}
        </div>
        <div className="violation-actions">
          {!isApprovedViolation && (
            <button
              className="primary-action"
              onClick={() => violation.Id && window.confirm(`Approve this violation?`) && onApprove(violation.Id)}
            >
              Approve
            </button>
          )}
          <button
            className="secondary-action"
            onClick={() => violation.Id && onViewDetails(violation.Id)}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}