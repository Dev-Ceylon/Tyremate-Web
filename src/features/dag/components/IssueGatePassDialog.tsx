import { AppModal } from "../../../shared/ui/modal/AppModal"
import { StatusBadge } from "../../../shared/ui/StatusBadge"
import { useIssueGatePass } from "../hooks/useIssueGatePass"
import type { DagRecord } from "../models/dag"

type IssueGatePassDialogProps = {
  isOpen: boolean
  dag: DagRecord | null
  onClose: () => void
  onSubmit: (dag: DagRecord) => Promise<void>
}

export function IssueGatePassDialog({
  isOpen,
  dag,
  onClose,
  onSubmit,
}: IssueGatePassDialogProps) {
  const {
    allocation,
    describeDecision,
    loading,
    submitting,
    error,
    handleClose,
    handleSubmit,
  } = useIssueGatePass({
    isOpen,
    dag,
    onSubmit,
    onClose,
  })

  if (!dag) {
    return null
  }

  // The gate pass is issued against the approved contractor, so there is nothing
  // to pick here. This mirrors the backend guard in dagService.issueGatePass.
  const contractorName = allocation?.ContractorName || dag.ContractorName
  const isApproved = allocation?.ApprovalStatus === "approved"

  return (
    <AppModal
      isOpen={isOpen}
      title={`Issue Gate Pass: DAG #${dag.ID}`}
      onClose={handleClose}
    >
      <p className="hero-text modal-hint-text">
        Issuing the gate pass moves this DAG out of pending and draws its tyres from storage.
      </p>

      {error && (
        <p className="hero-text error-text modal-hint-text">
          {error}
        </p>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="detail-card-row">
          <span className="detail-card-key">Contractor</span>
          <span className="detail-card-val">
            {loading ? "Loading..." : contractorName || "Not assigned"}
          </span>
        </div>

        <div className="detail-card-row">
          <span className="detail-card-key">Approval</span>
          <span className="detail-card-val">
            {loading ? (
              "Loading..."
            ) : allocation ? (
              <StatusBadge
                label={describeDecision(allocation.ApprovalStatus)}
                tone={
                  allocation.ApprovalStatus === "approved"
                    ? "approved"
                    : allocation.ApprovalStatus === "rejected"
                      ? "rejected"
                      : "pending"
                }
              />
            ) : (
              <StatusBadge label="Not recorded" tone="pending" />
            )}
          </span>
        </div>

        {!loading && !isApproved && (
          <p className="hero-text error-text modal-hint-text">
            {allocation
              ? allocation.ApprovalStatus === "rejected"
                ? "This contractor assignment was rejected. Reassign and approve a contractor before issuing the gate pass."
                : "Approve the contractor before issuing the gate pass."
              : "Assign and approve a contractor before issuing the gate pass."}
          </p>
        )}

        <div className="header-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="primary-action"
            type="submit"
            disabled={submitting || loading || !isApproved}
          >
            {submitting ? "Issuing..." : "Confirm & Issue Gate Pass"}
          </button>
        </div>
      </form>
    </AppModal>
  )
}