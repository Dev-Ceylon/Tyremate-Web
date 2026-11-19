import type { ViolationGroup } from "../models/violation";

interface ViolationFSFOTableProps {
  violation: ViolationGroup;
  isFSFO: boolean;
}

export function ViolationFSFOTable({
  violation,
  isFSFO,
}: ViolationFSFOTableProps) {
  if (!isFSFO || !violation.DOTs?.length) return null;

  return (
    <section className="info-panel panel panel-strong mt-6">
      <div className="panel-header">
        <h2>FSFO - Offending DOTs ({violation.DOTs.length})</h2>
      </div>
      <div className="dots-mini-table">
        <table>
          <thead>
            <tr>
              <th>DOT</th>
              <th>Oldest Available</th>
              <th>Location</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {violation.DOTs.map((dot) => (
              <tr key={dot.Id}>
                <td><span className="badge badge-violation fsfo">{dot.DOT || "N/A"}</span></td>
                <td><span className="badge badge-violation fsfo">{dot.OldestAvailableDOT || "N/A"}</span></td>
                <td>{dot.StorageManagerID ? `Loc #${dot.StorageManagerID}` : "N/A"}{dot.StorageManagerBatchID ? ` / Batch #${dot.StorageManagerBatchID}` : ""}</td>
                <td className="text-right">{dot.Qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ViolationFSFOTable;