import type { ViolationGroup } from "../models/violation";

interface ViolationActionsSidebarProps {
  isPending: boolean;
  handleApprove: () => Promise<void>;
  handleReject: (id: number, reason: string) => Promise<void>;
  setShowRejectModal: (show: boolean) => void;
  violation: ViolationGroup | null;
  navigate: (path: string) => void;
}

export function ViolationActionsSidebar({
  isPending,
  handleApprove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleReject: _handleReject,
  setShowRejectModal,
  violation,
  navigate,
}: ViolationActionsSidebarProps) {
  return (
    <section className="info-panel panel panel-strong sticky-top">
      <div className="panel-header">
        <h3>Quick Actions</h3>
      </div>
      <div className="sidebar-actions">
        {isPending && violation && (
          <>
            <button className="primary-action w-full" onClick={handleApprove}>
              Approve Violation
            </button>
            <button className="secondary-action danger w-full" onClick={() => setShowRejectModal(true)}>
              Reject Violation
            </button>
          </>
        )}
        <button className="secondary-action w-full" onClick={() => navigate("/violations")}>
          Back to List
        </button>
      </div>
    </section>
  );
}

export default ViolationActionsSidebar;