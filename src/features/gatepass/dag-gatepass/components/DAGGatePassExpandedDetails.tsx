import { useNavigate } from "@/lib/router"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import { getStatusName } from "../../../../shared/constants/statusConstants"
import type { DAGGatePassRecord } from "../models/dagGatePass"

type DAGGatePassExpandedDetailsProps = {
  record: DAGGatePassRecord
}

/**
 * Panel revealed by expanding a gate pass row.
 *
 * Every value here is already on the list record (dagGatePassService attaches
 * Tyres when it loads the passes), so the panel renders with no fetch on
 * expand - same as the purchase order line detail this mirrors.
 */
export function DAGGatePassExpandedDetails({ record }: DAGGatePassExpandedDetailsProps) {
  const navigate = useNavigate()
  const tyres = record.Tyres ?? []

  return (
    <div className="expanded-panel">
      <div className="expanded-summary-grid">
        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Delivery Advice Note</span>
          <span className="expanded-summary-value">#{record.DAGID}</span>
          <span className="expanded-summary-meta">Gate pass #{record.ID}</span>
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Customer</span>
          <span className="expanded-summary-value">
            {record.CustomerName || record.CustomerCode || "-"}
          </span>
          {record.CustomerName ? (
            <span className="expanded-summary-meta">{record.CustomerCode}</span>
          ) : null}
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Contractor</span>
          <span className="expanded-summary-value">{record.ContractorName || "Not assigned"}</span>
          {record.ContractorID ? (
            <span className="expanded-summary-meta">Contractor #{record.ContractorID}</span>
          ) : null}
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Status</span>
          <div className="expanded-summary-status-wrap">
            <StatusBadge label={record.StatusName || getStatusName(record.StatusCode)} />
          </div>
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Date</span>
          <span className="expanded-summary-value">{record.Date || "-"}</span>
          <span className="expanded-summary-meta">
            {tyres.reduce((sum, tyre) => sum + tyre.Qty, 0)} tyres total
          </span>
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Delivery Date</span>
          <span className="expanded-summary-value">{record.DeliveryDate || "Not set"}</span>
        </div>

        <div className="expanded-summary-card">
          <span className="expanded-summary-label">Comment</span>
          <span className="expanded-summary-meta">{record.Comment || "No comment"}</span>
        </div>
      </div>

      <div className="expanded-action-bar">
        <button
          type="button"
          className="secondary-action"
          onClick={() => navigate(`/dag/${record.DAGID}`)}
        >
          View DAG #{record.DAGID}
        </button>
      </div>

      {tyres.length === 0 ? (
        <p className="expanded-empty-state">No tyre lines recorded for this gate pass.</p>
      ) : (
        <div className="expanded-table-wrap">
          <div className="tm-table-scroll">
            <table className="product-table expanded-allocation-table">
              <thead>
                <tr>
                  <th>Tyre (Name - Code)</th>
                  <th>Storage Location</th>
                  <th className="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {tyres.map((tyre) => (
                  <tr key={tyre.ID}>
                    <td>
                      <div className="flex-column">
                        <span className="font-medium">{tyre.TyreName || "-"}</span>
                        <span className="secondary-text text-xs">{tyre.TyreCode || "-"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex-column">
                        <span className="font-medium">
                          {tyre.StorageLocationName || tyre.StorageLocationCode || "-"}
                        </span>
                        {tyre.StorageLocationCode &&
                        tyre.StorageLocationCode !== tyre.StorageLocationName ? (
                          <span className="secondary-text text-xs">{tyre.StorageLocationCode}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-right font-bold">{tyre.Qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
