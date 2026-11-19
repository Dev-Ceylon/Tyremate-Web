import { createPortal } from "react-dom";
import { useViolationDetailDrawer } from "./useViolationDetailDrawer";
import { ViolationDrawerHeader } from "./ViolationDrawerHeader";
import { ViolationDrawerBody } from "./ViolationDrawerBody";
import { ViolationDrawerOverlay } from "./ViolationDrawerOverlay";
import type { ViolationGroup } from "../../models/violation";

interface ViolationDetailDrawerProps {
  violation: ViolationGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onViewSO?: (soId: number) => void;
  onViewLine?: (soId: number, soTyreId: number) => void;
}

export function ViolationDetailDrawer({
  violation,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onViewSO,
  onViewLine,
}: ViolationDetailDrawerProps) {
  const { drawerRef } = useViolationDetailDrawer(isOpen, onClose);

  if (!isOpen || !violation) return null;

  const drawer = (
    <div
      ref={drawerRef}
      className="drawer violation-detail-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <ViolationDrawerHeader violationId={violation.Id} onClose={onClose} />
      <ViolationDrawerBody
        violation={violation}
        onApprove={onApprove}
        onReject={onReject}
        onViewSO={onViewSO}
        onViewLine={onViewLine}
      />
    </div>
  );

  const overlay = <ViolationDrawerOverlay onClose={onClose} />;

  return createPortal([overlay, drawer], document.body);
}

export default ViolationDetailDrawer;