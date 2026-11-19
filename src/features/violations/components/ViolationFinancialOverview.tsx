import type { ViolationGroup } from "../models/violation";

interface ViolationFinancialOverviewProps {
  violation: ViolationGroup;
  totalValue: number;
  formatMoney: (amount: number) => string;
}

export function ViolationFinancialOverview({
  violation,
  totalValue,
  formatMoney,
}: ViolationFinancialOverviewProps) {
  return (
    <section className="info-panel panel panel-strong mt-6">
      <div className="panel-header">
        <h2>Financial Overview</h2>
      </div>
      <dl className="detail-list">
        <div><dt>Unit Price</dt><dd>{formatMoney(violation.Price)}</dd></div>
        <div><dt>Quantity</dt><dd>{violation.Qty}</dd></div>
        <div className="font-bold"><dt>Line Total</dt><dd>{formatMoney(totalValue)}</dd></div>
      </dl>
    </section>
  );
}

export default ViolationFinancialOverview;