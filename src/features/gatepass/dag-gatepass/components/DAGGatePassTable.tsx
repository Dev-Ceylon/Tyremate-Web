import type { DAGGatePassRecord } from "../models/dagGatePass"
import { DAGGatePassRow } from "./DAGGatePassRow"

type DAGGatePassTableProps = {
  dagGatePasses: DAGGatePassRecord[]
  expandedRowKey?: string | null
  onToggleExpand: (rowKey: string) => void
  deletingId?: number | null
  onDelete: (record: DAGGatePassRecord) => void
  sendingId?: number | null
  onSend?: (record: DAGGatePassRecord) => void
  arrivedId?: number | null
  onArrived?: (record: DAGGatePassRecord) => void
}

export const DAGGatePassTable = ({
  dagGatePasses,
  expandedRowKey = null,
  onToggleExpand,
  deletingId = null,
  onDelete,
  sendingId = null,
  onSend,
  arrivedId = null,
  onArrived,
}: DAGGatePassTableProps) => {
  if (dagGatePasses.length === 0) {
    return <p className="table-empty">No DAG Gate Pass records found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Delivery Date</th>
            <th>Customer</th>
            <th>Contractor</th>
            <th>Tyres (Name - Code)</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dagGatePasses.map((record) => {
            // Owned here so the React key and the accordion key cannot drift.
            const rowKey = `gatepass-${record.ID}`

            return (
              <DAGGatePassRow
                key={rowKey}
                rowKey={rowKey}
                record={record}
                isExpanded={expandedRowKey === rowKey}
                onToggleExpand={onToggleExpand}
                deletingId={deletingId}
                onDelete={onDelete}
                sendingId={sendingId}
                onSend={onSend}
                arrivedId={arrivedId}
                onArrived={onArrived}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
