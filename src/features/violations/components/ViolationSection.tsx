import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { formatMoney } from "../../../shared/utils/formatters";
import { VIOLATION_TYPE_CODES, VIOLATION_TYPE_NAMES, VIOLATION_TYPE_LABELS } from "../constants/violationConstants";
import type { ViolationGroup } from "../models/violation";

const OVMAX_CODE = VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT;
const FSFO_CODE = VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK;

interface ViolationSectionProps {
  violations: ViolationGroup[];
  onApprove: (id: number) => void;
  onViewDetails: (id: number) => void;
}

function renderDiscountViolations(violations: ViolationGroup[], onApprove: (id: number) => void, onViewDetails: (id: number) => void) {
  const discountViolations = violations.filter((v) => v.ViolationTypeCode === OVMAX_CODE);
  if (discountViolations.length === 0) return null;

  return (
    <section className="violation-type-section">
      <div className="violation-type-header">
        <h3>
          <span className={`violation-type-badge ${OVMAX_CODE}`}>{VIOLATION_TYPE_LABELS[OVMAX_CODE]}</span>
          {VIOLATION_TYPE_NAMES[OVMAX_CODE]}
        </h3>
      </div>
      <div className="violation-list">
        {discountViolations.map((violation) => (
          <div key={violation.Id} className="violation-item">
            <div className="violation-header">
              <div className="violation-info">
                <span className={`violation-type-badge ${OVMAX_CODE}`}>{VIOLATION_TYPE_LABELS[OVMAX_CODE]}</span>
                <span className="violation-tyre">Tyre #{violation.TyreID}</span>
                <span className="violation-qty">Qty: {violation.Qty}</span>
                <span className="violation-price">{formatMoney(violation.Price)}</span>
              </div>
              <div className="violation-meta">
                <span className="violation-status">
                  <StatusBadge
                    label={
                      violation.IsApproved === 1
                        ? "Approved"
                        : violation.IsApproved === -1
                        ? "Rejected"
                        : "Pending"
                    }
                    tone={
                      violation.IsApproved === 1
                        ? "approved"
                        : violation.IsApproved === -1
                        ? "rejected"
                        : "pending"
                    }
                  />
                </span>
                <span className="violation-date">
                  {violation.CreatedDateTime
                    ? new Date(violation.CreatedDateTime).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
            <div className="violation-details">
              <div className="detail-row">
                <span className="detail-label">Max Discount:</span>
                <span className="detail-value">{violation.MaxDiscountAllowed}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Applied:</span>
                <span className="detail-value">{violation.AppliedDiscount}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Excess:</span>
                <span className="detail-value text-danger">{violation.DiscountExcess}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Value:</span>
                <span className="detail-value">{formatMoney(violation.Price * violation.Qty)}</span>
              </div>
            </div>
            <div className="violation-actions">
              {violation.IsApproved === 0 && (
                <button
                  className="primary-action"
                  onClick={() => window.confirm(`Approve this violation?`) && onApprove(violation.Id)}
                >
                  Approve
                </button>
              )}
              <button
                className="secondary-action"
                onClick={() => onViewDetails(violation.Id)}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderFSFOViolations(violations: ViolationGroup[], onApprove: (id: number) => void, onViewDetails: (id: number) => void) {
  const fsfoViolations = violations.filter((v) => v.ViolationTypeCode === FSFO_CODE);
  if (fsfoViolations.length === 0) return null;

  return (
    <section className="violation-type-section">
      <div className="violation-type-header">
        <h3>
          <span className={`violation-type-badge ${FSFO_CODE}`}>{VIOLATION_TYPE_LABELS[FSFO_CODE]}</span>
          {VIOLATION_TYPE_NAMES[FSFO_CODE]}
        </h3>
      </div>
      <div className="violation-list">
        {fsfoViolations.map((violation) => (
          <div key={violation.Id} className="violation-item">
            <div className="violation-header">
              <div className="violation-info">
                <span className={`violation-type-badge ${FSFO_CODE}`}>{VIOLATION_TYPE_LABELS[FSFO_CODE]}</span>
                <span className="violation-tyre">Tyre #{violation.TyreID}</span>
                <span className="violation-qty">Qty: {violation.Qty}</span>
                <span className="violation-price">{formatMoney(violation.Price)}</span>
              </div>
              <div className="violation-meta">
                <span className="violation-status">
                  <StatusBadge
                    label={
                      violation.IsApproved === 1
                        ? "Approved"
                        : violation.IsApproved === -1
                        ? "Rejected"
                        : "Pending"
                    }
                    tone={
                      violation.IsApproved === 1
                        ? "approved"
                        : violation.IsApproved === -1
                        ? "rejected"
                        : "pending"
                    }
                  />
                </span>
                <span className="violation-date">
                  {violation.CreatedDateTime
                    ? new Date(violation.CreatedDateTime).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
            <div className="violation-details">
              {violation.DOTs && violation.DOTs.length > 0 && (
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
                        {violation.DOTs.map((dot: any) => (
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
              )}
            </div>
            <div className="violation-actions">
              {violation.IsApproved === 0 && (
                <button
                  className="primary-action"
                  onClick={() => window.confirm(`Approve this violation?`) && onApprove(violation.Id)}
                >
                  Approve
                </button>
              )}
              <button
                className="secondary-action"
                onClick={() => onViewDetails(violation.Id)}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ViolationSection({ violations, onApprove, onViewDetails }: ViolationSectionProps) {
  if (violations.length === 0) return null;

  return (
    <section className="table-panel panel panel-strong mt-6">
      <div className="table-panel-header">
        <div>
          <p className="eyebrow">Policy Violations</p>
          <h2>Violations</h2>
        </div>
        <div className="header-actions">
          <span className="stat-badge">{violations.length} total</span>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="violation-summary">
          <div className="violation-summary-item discount">
            <span className="label">{VIOLATION_TYPE_NAMES[OVMAX_CODE]}</span>
            <span className="value">{violations.filter((v) => v.ViolationTypeCode === OVMAX_CODE).length}</span>
          </div>
          <div className="violation-summary-item fsfo">
            <span className="label">{VIOLATION_TYPE_NAMES[FSFO_CODE]}</span>
            <span className="value">{violations.filter((v) => v.ViolationTypeCode === FSFO_CODE).length}</span>
          </div>
        </div>
      )}

      <div className="violation-sections">
        {renderDiscountViolations(violations, onApprove, onViewDetails)}
        {renderFSFOViolations(violations, onApprove, onViewDetails)}
      </div>
    </section>
  );
}