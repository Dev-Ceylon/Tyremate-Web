import { formatMoney } from "../../../../shared/utils/formatters";
import { formatDate } from "../../../../shared/utils/dateUtils";
import type { ViolationGroup } from "../../models/violation";

interface ViolationBasicInfoProps {
  violation: ViolationGroup;
  onViewSO?: (soId: number) => void;
  onViewLine?: (soId: number, soTyreId: number) => void;
  typeName: string;
  totalValue: number;
}

export function ViolationBasicInfo({
  violation,
  onViewSO,
  onViewLine,
  typeName,
  totalValue,
}: ViolationBasicInfoProps) {
  return (
    <div className="detail-section">
      <h4>Basic Information</h4>
      <dl className="detail-list">
        <div><dt>Type</dt><dd>{typeName}</dd></div>
        <div>
          <dt>Sales Order</dt>
          <dd><button className="link" onClick={() => onViewSO?.(violation.SoID)}>SO-#{violation.SoID}</button></dd>
        </div>
        {violation.SoTyreID && onViewLine && (
          <div>
            <dt>Line Item</dt>
            <dd><button className="link" onClick={() => onViewLine(violation.SoID, violation.SoTyreID!)}>Tyre #{violation.TyreID}</button></dd>
          </div>
        )}
        <div><dt>Tyre</dt><dd>#{violation.TyreID}</dd></div>
        <div><dt>Quantity</dt><dd>{violation.Qty}</dd></div>
        <div><dt>Unit Price</dt><dd>{formatMoney(violation.Price)}</dd></div>
        <div><dt>Total Value</dt><dd className="font-bold">{formatMoney(totalValue)}</dd></div>
        <div><dt>Created</dt><dd>{violation.CreatedDateTime ? formatDate(violation.CreatedDateTime) : "—"}</dd></div>
        <div><dt>Responsible</dt><dd>{violation.ResponsibleUser || "—"}</dd></div>
        {violation.ApprovedBy && <div><dt>Approved By</dt><dd>{violation.ApprovedBy}</dd></div>}
        {violation.ApprovedDateTime && <div><dt>Approved On</dt><dd>{formatDate(violation.ApprovedDateTime)}</dd></div>}
      </dl>
    </div>
  );
}

export default ViolationBasicInfo;