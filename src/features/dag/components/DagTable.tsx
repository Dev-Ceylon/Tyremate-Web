import type { DagRecord } from "../models/dag"
import { STATUS_CODES } from "../../../shared/constants/statusConstants"

type DagTableProps = {
  dags: DagRecord[]
  deletingDagId?: number | null
  onView?: (dag: DagRecord) => void
  onDelete?: (dag: DagRecord) => void
  onIssueGatePass?: (dag: DagRecord) => void
  issuingId?: number | null
}

export function DagTable({ dags, deletingDagId = null, onView, onDelete, onIssueGatePass, issuingId = null }: DagTableProps) {
  if (dags.length === 0) {
    return <p className="table-empty">No DAG records found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Contractor</th>
            <th>Status</th>
            <th>Comment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dags.map((dag) => (
            <tr key={dag.ID}>
              <td>{dag.ID}</td>
              <td>{dag.Date}</td>
              <td>
                <div className="flex-column">
                  <span className="font-medium">{dag.CustomerName || "-"}</span>
                  {dag.CustomerCode ? <span className="secondary-text text-xs">{dag.CustomerCode}</span> : null}
                </div>
              </td>
              <td>{dag.ContractorName || "-"}</td>
              <td>{dag.StatusName || dag.StatusCode || "-"}</td>
              <td>{dag.Comment || "-"}</td>
              <td>
                <div className="table-actions">
                  {dag.StatusCode === STATUS_CODES.PENDING && (
                    <button
                      type="button"
                      className="primary-action table-action"
                      onClick={() => onIssueGatePass?.(dag)}
                      disabled={issuingId === dag.ID}
                    >
                      {issuingId === dag.ID ? "Issuing..." : "Issue Gate Pass"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onView?.(dag)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(dag)}
                    disabled={deletingDagId === dag.ID}
                  >
                    {deletingDagId === dag.ID ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
