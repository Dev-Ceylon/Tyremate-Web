import type { ViolationGroup } from "../../models/violation";

interface ViolationFSFODetailsProps {
  violation: ViolationGroup;
}

export function ViolationFSFODetails({ violation }: ViolationFSFODetailsProps) {
  if (!violation.Details) return null;

  try {
    const details = JSON.parse(violation.Details);

    return (
      <div className="fsfo-details">
        {details.OffendingBatchCount && (
          <div className="fsfo-detail-row">
            <span className="fsfo-detail-label">Offending Batches</span>
            <span className="fsfo-detail-value">{details.OffendingBatchCount}</span>
          </div>
        )}
        {details.AvailableBatches && details.AvailableBatches.length > 0 && (
          <div className="fsfo-available-batches">
            <h5>Available Older Batches</h5>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>DOT</th>
                  <th className="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {details.AvailableBatches.map((batch: { BatchID: number; DOT: string; Qty: number }) => (
                  <tr key={batch.BatchID}>
                    <td>{batch.BatchID}</td>
                    <td><span className="badge badge-violation fsfo">{batch.DOT}</span></td>
                    <td className="text-right">{batch.Qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch {
    return <pre className="detail-notes">{violation.Details}</pre>;
  }
}

export default ViolationFSFODetails;