import { useMemo } from "react";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { formatMoney } from "../../../shared/utils/formatters";
import type { ViolationGroup } from "../models/violation";

interface ViolationListProps {
  violations: ViolationGroup[];
  onApprove: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function ViolationList({ violations, onApprove, onViewDetails }: ViolationListProps) {
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      if (v.ViolationTypeCode === "ovmx" || v.ViolationTypeCode === "fsfo") {
        return true;
      }
      return false;
    });
  }, [violations]);

  if (filteredViolations.length === 0) {
    return (
      <div className="empty-state">
        <p>No violations found</p>
      </div>
    );
  }

  return (
    <div className="violation-list">
      <table className="product-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Tyre</th>
            <th>Qty</th>
            <th>Value</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((violation) => (
            <tr key={violation.Id}>
              <td>
                <span
                  className={`violation-type-badge ${violation.ViolationTypeCode}`}
                  title={violation.ViolationTypeName}
                >
                  {violation.ViolationTypeCode?.toUpperCase() || "UNKNOWN"}
                </span>
              </td>
              <td>
                <div>
                  <span className="font-medium">{violation.TyreID}</span>
                  <div className="secondary-text">{formatMoney(violation.Price)}</div>
                </div>
              </td>
              <td className="text-right">{violation.Qty}</td>
              <td className="text-right">{violation.Price ? formatMoney(violation.Price) : "—"}</td>
              <td>
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
              </td>
              <td>{violation.CreatedDateTime ? new Date(violation.CreatedDateTime).toLocaleDateString() : "—"}</td>
              <td>
                <div className="table-actions">
                  {violation.IsApproved === 0 && (
                    <button
                      className="secondary-action table-action"
                      onClick={() => window.confirm(`Approve violation #${violation.Id}?`) && onApprove(violation.Id)}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    className="secondary-action table-action"
                    onClick={() => onViewDetails(violation.Id)}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}