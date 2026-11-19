import { X } from "lucide-react";

interface ViolationDrawerHeaderProps {
  violationId: number;
  onClose: () => void;
}

export function ViolationDrawerHeader({
  violationId,
  onClose,
}: ViolationDrawerHeaderProps) {
  return (
    <div className="drawer-header">
      <h2 id="drawer-title">Violation #{violationId}</h2>
      <button className="btn-icon" onClick={onClose} aria-label="Close drawer">
        <X size={20} />
      </button>
    </div>
  );
}

export default ViolationDrawerHeader;