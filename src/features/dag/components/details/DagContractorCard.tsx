import { STATUS_CODES } from "../../../../shared/constants/statusConstants"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type {
  DagContractorApprovalRecord,
  DagContractorApprovalStatus,
  DagDetailedRecord,
} from "../../models/dag"

type DagContractorCardProps = {
  dag: DagDetailedRecord
  approvals: DagContractorApprovalRecord[]
  loading: boolean
  updatingApproval: boolean
  onAssign: () => void
  onUpdateApproval: (approvalId: number, approvalStatus: DagContractorApprovalStatus) => void
}

const describeDecision = (status: DagContractorApprovalRecord["ApprovalStatus"]) => {
  if (status === "approved") {
    return "Approved"
  }
  if (status === "rejected") {
    return "Rejected"
  }
  return "Pending"
}

const toneForDecision = (status: DagContractorApprovalRecord["ApprovalStatus"]) => {
  if (status === "approved") {
    return "approved"
  }
  if (status === "rejected") {
    return "rejected"
  }
  return "pending"
}

const formatDecisionTime = (value: string | null) => value || "Not recorded"

export function DagContractorCard({
  dag,
  approvals,
  loading,
  updatingApproval,
  onAssign,
  onUpdateApproval,
}: DagContractorCardProps) {
  // The service rejects assignment once the gate pass is issued, so mirror that
  // here instead of letting the user fill in a form that cannot be saved.
  const canAssign = dag.StatusCode === STATUS_CODES.PENDING
  const latest = approvals[0]
  const isReassignment = dag.ContractorID !== null
  // A decision is only possible while the latest allocation is still pending,
  // matching the IsApproved === null guard in PurchaseOrderLineExpandedDetails.
  const isPending = Boolean(latest) && latest!.ApprovalStatus === null

  return (
    <div className="info-panel panel panel-strong detail-card-section">
      <p className="section-label">Contractor Approval</p>

      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Contractor</span>
          <span className="detail-card-val">{dag.ContractorName || "Not assigned"}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Approval</span>
          <span className="detail-card-val">
            {loading ? (
              "Loading..."
            ) : latest ? (
              <StatusBadge
                label={describeDecision(latest.ApprovalStatus)}
                tone={toneForDecision(latest.ApprovalStatus)}
              />
            ) : (
              <StatusBadge label="Not recorded" tone="pending" />
            )}
          </span>
        </div>
        {latest && latest.ApprovalStatus !== null && (
          <div className="detail-card-row">
            <span className="detail-card-key">Decided On</span>
            <span className="detail-card-val">{formatDecisionTime(latest.ApprovedDateTime)}</span>
          </div>
        )}
      </div>

      {approvals.length > 1 && (
        <div className="detail-notes-block">
          <p className="section-label">Approval History</p>
          {approvals.slice(1).map((approval) => (
            <p key={approval.ID}>
              {approval.ContractorName || `Contractor #${approval.ContractorID}`} &middot;{" "}
              {describeDecision(approval.ApprovalStatus)} on{" "}
              {formatDecisionTime(approval.ApprovedDateTime)}
            </p>
          ))}
        </div>
      )}

      {isPending && (
        <div className="detail-card-actions">
          <button
            className="primary-action"
            onClick={() => onUpdateApproval(latest!.ID, "approved")}
            disabled={updatingApproval}
          >
            Approve
          </button>
          <button
            className="secondary-action"
            onClick={() => onUpdateApproval(latest!.ID, "rejected")}
            disabled={updatingApproval}
          >
            Reject
          </button>
        </div>
      )}

      <div className="detail-card-actions">
        <button
          className="primary-action"
          onClick={onAssign}
          disabled={!canAssign || loading}
        >
          {isReassignment ? "Reassign Contractor" : "Assign Contractor"}
        </button>
        {!canAssign && (
          <p className="hero-text">
            A contractor can only be assigned while the DAG is pending.
          </p>
        )}
      </div>
    </div>
  )
}