import type { ViolationGroup } from "../../models/violation";

interface ViolationDOTsTableProps {
  violation: ViolationGroup;
}

export function ViolationDOTsTable({ violation }: ViolationDOTsTableProps) {
  if (!violation.DOTs?.length) return null;

  return (
    <div className="detail-section">
      <h4>FSFO - Offending DOTs ({violation.DOTs.length})</h4>
      <div className="dots-mini-table">
        <div className="tm-table-scroll">
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
                  <td>
                    {dot.StorageManagerID ? `Loc #${dot.StorageManagerID}` : "N/A"}
                    {dot.StorageManagerBatchID ? ` / Batch #${dot.StorageManagerBatchID}` : ""}
                  </td>
                  <td className="text-right">{dot.Qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ViolationDOTsTable;