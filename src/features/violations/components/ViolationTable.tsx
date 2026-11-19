import { formatMoney } from "../../../shared/utils/formatters";
import { formatDate } from "../../../shared/utils/dateUtils";
import {
  VIOLATION_TYPE_LABELS,
} from "../constants/violationConstants";
import type { ViolationGroup } from "../models/violation";

interface ViolationTableProps {
  violations: ViolationGroup[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onViewDetails: (id: number) => void;
}

export function ViolationTable({
  violations,
  onApprove,
  onReject,
  onViewDetails,
}: ViolationTableProps) {
  const getStatusClass = (isApproved: number) => {
    if (isApproved === 1) return "status-approved";
    if (isApproved === -1) return "status-rejected";
    return "status-pending";
  };

  const getStatusLabel = (isApproved: number) => {
    if (isApproved === 1) return "Approved";
    if (isApproved === -1) return "Rejected";
    return "Pending";
  };

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Tyre</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Value</th>
            <th>Status</th>
            <th>SO</th>
            <th>Date</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((violation) => (
            <tr key={violation.Id}>
              <td>
                <span className={`badge badge-violation ${violation.ViolationTypeCode}`}>
                  {VIOLATION_TYPE_LABELS[violation.ViolationTypeCode as keyof typeof VIOLATION_TYPE_LABELS] || violation.ViolationTypeCode?.toUpperCase()}
                </span>
              </td>
              <td>
                <div className="flex-column">
                  <span className="font-medium">Tyre #{violation.TyreID}</span>
                  <span className="secondary-text text-xs">{formatMoney(violation.Price)}/unit</span>
                </div>
              </td>
              <td className="text-right">{violation.Qty}</td>
              <td className="text-right font-medium">{formatMoney(violation.Price * violation.Qty)}</td>
              <td className="text-center">
                <span className={`status-badge ${getStatusClass(violation.IsApproved)}`}>
                  {getStatusLabel(violation.IsApproved)}
                </span>
              </td>
              <td>
                <span className="text-link" onClick={() => onViewDetails(violation.Id)} title="View details">
                  SO-#{violation.SoID}
                </span>
              </td>
              <td className="text-center">{violation.CreatedDateTime ? formatDate(violation.CreatedDateTime) : "—"}</td>
              <td className="text-center">
                <div className="table-actions">
                  {violation.IsApproved === 0 && (
                    <>
                      <button
                        className="secondary-action table-action"
                        onClick={() => onApprove(violation.Id)}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        className="secondary-action table-action"
                        onClick={() => onReject(violation.Id)}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className="secondary-action table-action"
                    onClick={() => onViewDetails(violation.Id)}
                    title="View Details"
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