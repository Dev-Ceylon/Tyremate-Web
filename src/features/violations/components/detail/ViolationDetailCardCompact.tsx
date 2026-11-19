import { StatusBadge } from "../../../../shared/ui/StatusBadge";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatDate } from "../../../../shared/utils/dateUtils";
import type { ViolationGroup } from "../../models/violation";
import { useViolationDetailCard } from "./useViolationDetailCard";

interface ViolationDetailCardCompactProps {
  violation: ViolationGroup;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  className?: string;
}

export function ViolationDetailCardCompact({
  violation,
  onApprove,
  onReject,
  className = "",
}: ViolationDetailCardCompactProps) {
  const { isPending, statusLabel, statusTone, typeLabel, typeName, totalValue } = useViolationDetailCard(violation);

  return (
    <div className={`violation-detail-card compact ${className}`}>
      <div className="card-header">
        <span className={`badge badge-violation ${violation.ViolationTypeCode}`}>{typeLabel}</span>
        <StatusBadge label={statusLabel} tone={statusTone} />
      </div>
      <div className="card-body">
        <div className="info-row">
          <span className="label">SO-#{violation.SoID}</span>
          <span className="value">Tyre #{violation.TyreID}</span>
          <span className="value">{violation.Qty} × {formatMoney(violation.Price)}</span>
        </div>
        <div className="info-row">
          <span className="label">{typeName}</span>
          <span className="value">{formatMoney(totalValue)}</span>
          <span className="value">{formatDate(violation.CreatedDateTime)}</span>
        </div>
        {isPending && onApprove && onReject && (
          <div className="card-actions">
            <button className="btn-icon primary" onClick={() => onApprove(violation.Id)} title="Approve">
              +
            </button>
            <button className="btn-icon danger" onClick={() => onReject(violation.Id)} title="Reject">
              -
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViolationDetailCardCompact;