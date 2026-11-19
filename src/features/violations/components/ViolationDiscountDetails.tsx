import type { ViolationGroup } from "../models/violation";

interface ViolationDiscountDetailsProps {
  violation: ViolationGroup;
  isOVMAX: boolean;
}

export function ViolationDiscountDetails({
  violation,
  isOVMAX,
}: ViolationDiscountDetailsProps) {
  if (!isOVMAX || violation.MaxDiscountAllowed === null) return null;

  return (
    <section className="info-panel panel panel-strong mt-6">
      <div className="panel-header">
        <h2>Discount Violation</h2>
      </div>
      <dl className="detail-list">
        <div><dt>Max Allowed</dt><dd>{violation.MaxDiscountAllowed}%</dd></div>
        <div><dt>Applied</dt><dd>{violation.AppliedDiscount}%</dd></div>
        <div><dt className="text-danger">Excess</dt><dd className="text-danger">{violation.DiscountExcess}%</dd></div>
      </dl>
    </section>
  );
}

export default ViolationDiscountDetails;