import type { ViolationGroup } from "../models/violation";

interface ViolationMetaSidebarProps {
  violation: ViolationGroup | null;
  formatDate: (date: string | null | undefined) => string;
}

export function ViolationMetaSidebar({
  violation,
  formatDate,
}: ViolationMetaSidebarProps) {
  if (!violation) return null;

  return (
    <section className="info-panel panel panel-strong sticky-top">
      <div className="panel-header">
        <h3>Details</h3>
      </div>
      <dl className="detail-list">
        <div><dt>Created</dt><dd>{formatDate(violation.CreatedDateTime)}</dd></div>
        <div><dt>Responsible</dt><dd>{violation.ResponsibleUser || "—"}</dd></div>
        {violation.ApprovedBy && <div><dt>Approved By</dt><dd>{violation.ApprovedBy}</dd></div>}
        {violation.ApprovedDateTime && <div><dt>Approved On</dt><dd>{formatDate(violation.ApprovedDateTime)}</dd></div>}
        {violation.SoTyreID && (
          <div><dt>SO Line</dt><dd>#{violation.SoTyreID}</dd></div>
        )}
      </dl>
    </section>
  );
}

export default ViolationMetaSidebar;