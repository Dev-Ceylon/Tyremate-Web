interface ViolationDrawerOverlayProps {
  onClose: () => void;
}

export function ViolationDrawerOverlay({ onClose }: ViolationDrawerOverlayProps) {
  return (
    <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
  );
}

export default ViolationDrawerOverlay;