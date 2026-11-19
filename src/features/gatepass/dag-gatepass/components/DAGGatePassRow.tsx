import { ExpandableDetailRow } from "../../../../shared/ui/ExpandableDetailRow"
import { STATUS_CODES } from "../../../../shared/constants/statusConstants"
import type { DAGGatePassRecord } from "../models/dagGatePass"
import { DAGGatePassExpandedDetails } from "./DAGGatePassExpandedDetails"

/**
 * Must match the number of <th> elements in DAGGatePassTable. The toggle lives
 * inside the existing ID cell rather than a new column, so the header is
 * unchanged from the flat table.
 */
const DETAIL_COL_SPAN = 9

type DAGGatePassRowProps = {
  rowKey: string
  record: DAGGatePassRecord
  isExpanded: boolean
  onToggleExpand: (rowKey: string) => void
  deletingId?: number | null
  onDelete: (record: DAGGatePassRecord) => void
  sendingId?: number | null
  onSend?: (record: DAGGatePassRecord) => void
  arrivedId?: number | null
  onArrived?: (record: DAGGatePassRecord) => void
}

export function DAGGatePassRow({
  rowKey,
  record,
  isExpanded,
  onToggleExpand,
  deletingId = null,
  onDelete,
  sendingId = null,
  onSend,
  arrivedId = null,
  onArrived,
}: DAGGatePassRowProps) {
  const isDeleting = deletingId === record.ID
  const isSending = sendingId === record.ID
  const isArrived = arrivedId === record.ID
  const totalQty = record.Tyres?.reduce((sum, tyre) => sum + tyre.Qty, 0) || 0

  return (
    <>
      <tr>
        <td>
          <div className="line-title-cell">
            <button
              type="button"
              className={`line-toggle-button ${isExpanded ? "expanded" : ""}`}
              onClick={() => onToggleExpand(rowKey)}
              aria-label={isExpanded ? "Collapse gate pass details" : "Expand gate pass details"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? "\u2212" : "+"}
            </button>
            <span className="font-medium">#{record.ID}</span>
          </div>
        </td>
        <td>{record.Date}</td>
        <td>{record.DeliveryDate || "-"}</td>
        <td>
          <div className="flex-column">
            <span className="font-medium">{record.CustomerName || record.CustomerCode || "-"}</span>
            {record.CustomerName ? (
              <span className="secondary-text text-xs">{record.CustomerCode}</span>
            ) : null}
          </div>
        </td>
        <td>{record.ContractorName || "-"}</td>
        <td>
          <div className="contractor-tyre-tags">
            {record.Tyres?.map((tyre) => (
              <span key={tyre.ID} className="contractor-tyre-tag">
                {tyre.TyreName} — {tyre.TyreCode} <strong>({tyre.Qty})</strong>
              </span>
            ))}
          </div>
        </td>
        <td className="font-bold">{totalQty}</td>
        <td>{record.StatusName || record.StatusCode || "-"}</td>
        <td>
          <div className="table-actions">
            {record.StatusCode === STATUS_CODES.GP_ISSUED ? (
              <button
                type="button"
                className="primary-action table-action"
                onClick={() => onSend?.(record)}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            ) : null}
            {record.StatusCode === STATUS_CODES.ARRIVING ? (
              <button
                type="button"
                className="primary-action table-action"
                onClick={() => onArrived?.(record)}
                disabled={isArrived}
              >
                {isArrived ? "Updating..." : "Arrived"}
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-action table-action"
              onClick={() => onDelete(record)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </td>
      </tr>

      <ExpandableDetailRow isExpanded={isExpanded} colSpan={DETAIL_COL_SPAN}>
        <DAGGatePassExpandedDetails record={record} />
      </ExpandableDetailRow>
    </>
  )
}
