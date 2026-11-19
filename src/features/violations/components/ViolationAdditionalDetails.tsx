import type { ViolationGroup } from "../models/violation";

interface ViolationAdditionalDetailsProps {
  violation: ViolationGroup;
  isFSFO: boolean;
}

export function ViolationAdditionalDetails({
  violation,
  isFSFO,
}: ViolationAdditionalDetailsProps) {
  if (isFSFO || !violation.Details) return null;

  return (
    <section className="info-panel panel panel-strong mt-6">
      <div className="panel-header">
        <h2>Additional Details</h2>
      </div>
      <div className="detail-notes">{violation.Details}</div>
    </section>
  );
}

export default ViolationAdditionalDetails;