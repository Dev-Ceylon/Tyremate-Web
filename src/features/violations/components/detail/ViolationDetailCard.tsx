import { StatusBadge } from "../../../../shared/ui/StatusBadge";
import { ViolationDetailCardCompact } from "./ViolationDetailCardCompact";
import { ViolationBasicInfo } from "./ViolationBasicInfo";
import { ViolationOVMAXDetails } from "./ViolationOVMAXDetails";
import { ViolationDOTsTable } from "./ViolationDOTsTable";
import { ViolationFSFODetails } from "./ViolationFSFODetails";
import { ViolationAdditionalDetails } from "./ViolationAdditionalDetails";
import { useViolationDetailCard } from "./useViolationDetailCard";
import type { ViolationGroup } from "../../models/violation";

interface ViolationDetailCardProps {
  violation: ViolationGroup;
  variant?: "default" | "compact" | "expanded";
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onViewSO?: (soId: number) => void;
  onViewLine?: (soId: number, soTyreId: number) => void;
  className?: string;
}

export function ViolationDetailCard({
  violation,
  variant = "default",
  onApprove,
  onReject,
  onViewSO,
  onViewLine,
  className = "",
}: ViolationDetailCardProps) {
  if (variant === "compact") {
    return (
      <ViolationDetailCardCompact
        violation={violation}
        onApprove={onApprove}
        onReject={onReject}
        className={className}
      />
    );
  }

  const {
    isPending,
    isFSFO,
    statusLabel,
    statusTone,
    typeLabel,
    typeName,
    totalValue,
  } = useViolationDetailCard(violation);

  return (
    <div className={`violation-detail-card ${variant} ${className}`}>
      <div className="card-header">
        <div className="header-main">
          <div className="violation-identity">
            <span className={`badge badge-violation ${violation.ViolationTypeCode}`}>{typeLabel}</span>
            <h3>Violation #{violation.Id}</h3>
          </div>
          <div className="header-meta">
            <StatusBadge label={statusLabel} tone={statusTone} />
            <span className="secondary-text">SO-#{violation.SoID}</span>
          </div>
        </div>
        {isPending && (onApprove || onReject) && (
          <div className="header-actions">
            {onApprove && <button className="btn primary sm" onClick={() => onApprove(violation.Id)}>Approve</button>}
            {onReject && <button className="btn danger sm" onClick={() => onReject(violation.Id)}>Reject</button>}
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="detail-grid">
          <ViolationBasicInfo
            violation={violation}
            onViewSO={onViewSO}
            onViewLine={onViewLine}
            typeName={typeName}
            totalValue={totalValue}
          />

          <ViolationOVMAXDetails violation={violation} />

          <ViolationDOTsTable violation={violation} />

          <ViolationFSFODetails violation={violation} />

          <ViolationAdditionalDetails violation={violation} isFSFO={isFSFO} />
        </div>
      </div>
    </div>
  );
}

export default ViolationDetailCard;