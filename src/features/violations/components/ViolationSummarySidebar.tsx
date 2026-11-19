import { StatusBadge } from "../../../shared/ui/StatusBadge";
import type { ViolationGroup } from "../models/violation";

interface ViolationSummarySidebarProps {
  violation: ViolationGroup | null;
  totalValue: number;
  isFSFO: boolean;
  formatMoney: (amount: number) => string;
  getStatusLabel: (isApproved: number) => string;
}

export function ViolationSummarySidebar({
  violation,
  totalValue,
  isFSFO,
  formatMoney,
  getStatusLabel,
}: ViolationSummarySidebarProps) {
  if (!violation) return null;

  const statusLabel = getStatusLabel(violation.IsApproved);

  const getBadgeTone = (status: string) => {
    if (status === "Approved") return "approved" as const;
    if (status === "Rejected") return "rejected" as const;
    return "pending" as const;
  };

  return (
    <section className="info-panel panel panel-strong sticky-top">
      <div className="panel-header">
        <h3>Summary</h3>
      </div>
      <dl className="detail-list">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge label={statusLabel} tone={getBadgeTone(statusLabel)} />
          </dd>
        </div>
        <div><dt>Type</dt><dd>{isFSFO ? "FSFO (Skipped Old Stock)" : "OVMAX (Over Max Discount)"}</dd></div>
        <div><dt>Line Total</dt><dd className="font-bold">{formatMoney(totalValue)}</dd></div>
        <div><dt>Quantity</dt><dd>{violation.Qty}</dd></div>
        <div><dt>Unit Price</dt><dd>{formatMoney(violation.Price)}</dd></div>
      </dl>
    </section>
  );
}

export default ViolationSummarySidebar;