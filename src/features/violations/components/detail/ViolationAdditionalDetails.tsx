import type { ViolationGroup } from "../../models/violation";

interface ViolationAdditionalDetailsProps {
  violation: ViolationGroup;
  isFSFO: boolean;
}

export function ViolationAdditionalDetails({ violation, isFSFO }: ViolationAdditionalDetailsProps) {
  if (isFSFO || !violation.Details) return null;

  return (
    <div className="detail-section full-width">
      <h4>Additional Details</h4>
      <pre className="detail-notes">{violation.Details}</pre>
    </div>
  );
}

export default ViolationAdditionalDetails;