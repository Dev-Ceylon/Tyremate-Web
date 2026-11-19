import type { ViolationGroup } from "../../models/violation";

interface ViolationOVMAXDetailsProps {
  violation: ViolationGroup;
}

export function ViolationOVMAXDetails({ violation }: ViolationOVMAXDetailsProps) {
  if (violation.MaxDiscountAllowed === null) return null;

  return (
    <div className="detail-section">
      <h4>Discount Violation</h4>
      <dl className="detail-list">
        <div><dt>Max Allowed</dt><dd>{violation.MaxDiscountAllowed}%</dd></div>
        <div><dt>Applied</dt><dd>{violation.AppliedDiscount}%</dd></div>
        <div><dt className="text-danger">Excess</dt><dd className="text-danger">{violation.DiscountExcess}%</dd></div>
      </dl>
    </div>
  );
}

export default ViolationOVMAXDetails;