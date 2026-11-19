import { ViolationDetailCard } from "./ViolationDetailCard";
import type { ViolationGroup } from "../../models/violation";

interface ViolationDrawerBodyProps {
  violation: ViolationGroup;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onViewSO?: (soId: number) => void;
  onViewLine?: (soId: number, soTyreId: number) => void;
}

export function ViolationDrawerBody({
  violation,
  onApprove,
  onReject,
  onViewSO,
  onViewLine,
}: ViolationDrawerBodyProps) {
  return (
    <div className="drawer-body">
      <ViolationDetailCard
        violation={violation}
        variant="expanded"
        onApprove={onApprove}
        onReject={onReject}
        onViewSO={onViewSO}
        onViewLine={onViewLine}
      />
    </div>
  );
}

export default ViolationDrawerBody;