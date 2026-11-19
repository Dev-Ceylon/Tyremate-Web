import {
  SALES_RETURN_CONDITION_CODES,
  SALES_RETURN_CONDITION_OPTIONS,
  SALES_RETURN_DISPOSITION_CODES,
  SALES_RETURN_DISPOSITION_OPTIONS,
  type SalesReturnConditionCode,
  type SalesReturnDispositionCode,
} from "../constants/salesReturnInspectionConstants"
import type { SalesReturnLineInspection, SalesReturnLineRecord } from "../models/salesReturn"

interface Props {
  lines: SalesReturnLineRecord[]
  inspections: Record<number, SalesReturnLineInspection>
  canInspect: boolean
  busy: boolean
  onChange: (lineId: number, update: Partial<SalesReturnLineInspection>) => void
}

export function SalesReturnInspectionTable({ lines, inspections, canInspect, busy, onChange }: Props) {
  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead><tr><th>Tyre</th><th>DOT</th><th>Qty</th><th>Condition / disposition</th><th>Inspection notes</th></tr></thead>
        <tbody>
          {lines.map((line) => {
            const inspection = inspections[line.SalesReturnLineID] || {
              condition: SALES_RETURN_CONDITION_CODES.OTHER,
              disposition: SALES_RETURN_DISPOSITION_CODES.QUARANTINE,
              notes: "",
            }
            return (
              <tr key={line.SalesReturnLineID}>
                <td>
                  <span className="font-semibold">{[line.Brand, line.Size].filter(Boolean).join(" / ") || `Tyre #${line.TyreID}`}{line.Pattern ? ` - ${line.Pattern}` : ""}</span>
                  <div className="secondary-text">{line.SerialNo ? `Serial: ${line.SerialNo}` : line.ReturnReason || "No serial or return reason"}</div>
                </td>
                <td><span className="dot-badge">{line.DOT || "—"}</span></td>
                <td>{line.ReturnedQty}</td>
                <td>
                  {canInspect ? (
                    <div className="space-y-2">
                      <select className="text-input" value={inspection.condition} disabled={busy} onChange={(event) => onChange(line.SalesReturnLineID, { condition: event.target.value as SalesReturnConditionCode })}>
                        {SALES_RETURN_CONDITION_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
                      </select>
                      <select className="text-input" value={inspection.disposition} disabled={busy} onChange={(event) => onChange(line.SalesReturnLineID, { disposition: event.target.value as SalesReturnDispositionCode })}>
                        {SALES_RETURN_DISPOSITION_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
                      </select>
                    </div>
                  ) : <>{line.ConditionName || "Pending inspection"}<div className="secondary-text">{line.DispositionName || "Quarantine"}</div></>}
                </td>
                <td>{canInspect ? (
                  <textarea className="text-input" rows={2} value={inspection.notes} disabled={busy} onChange={(event) => onChange(line.SalesReturnLineID, { notes: event.target.value })} />
                ) : line.InspectionNotes || "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
