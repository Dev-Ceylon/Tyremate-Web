import { Fragment } from "react"
import { useNavigate } from "@/lib/router"
import { ExpandableDetailRow } from "../../../../shared/ui/ExpandableDetailRow"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import type { SOGatePassRecord } from "../../../sales-order/models/delivery"

type Props = {
  records: SOGatePassRecord[]
  expandedRowKey: string | null
  onToggleExpand: (key: string) => void
}

function getPaymentOverrideSummary(record: SOGatePassRecord): string | null {
  if (!record.GatePassPaymentOverride) return null

  const unpaidAmount = `LKR ${(record.GatePassPaymentOverrideShortfall ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} unpaid when issued`
  const issuedBy = record.GatePassIssuedBy != null ? `User #${record.GatePassIssuedBy}` : null
  const issuedAt = record.GatePassIssuedAt || null

  return [unpaidAmount, issuedBy, issuedAt].filter(Boolean).join(" · ")
}

export function SOGatePassTable({ records, expandedRowKey, onToggleExpand }: Props) {
  const navigate = useNavigate()

  if (records.length === 0) return <p className="table-empty">No SO Gate Pass records found.</p>

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Gate Pass</th>
            <th>Sales Order</th>
            <th>Date</th>
            <th>Delivery Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th className="text-right">Qty</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const rowKey = `so-gatepass-${record.ID}`
            const expanded = expandedRowKey === rowKey
            const qty = record.TotalQty ?? record.Lines.reduce((total, line) => total + line.Qty, 0)
            const isIssued = Boolean(record.GatePassNo)
            return (
              <Fragment key={rowKey}>
                <tr key={rowKey}>
                  <td>
                    <div className="line-title-cell">
                      <button
                        type="button"
                        className={`line-toggle-button ${expanded ? "expanded" : ""}`}
                        onClick={() => onToggleExpand(rowKey)}
                        aria-label={expanded ? "Collapse gate pass details" : "Expand gate pass details"}
                        aria-expanded={expanded}
                      >
                        {expanded ? "−" : "+"}
                      </button>
                      <span className="font-medium">{record.GatePassNo || "Pending"}</span>
                    </div>
                  </td>
                  <td>SO #{record.SoID}</td>
                  <td>{record.Date}</td>
                  <td>{record.DeliveryDate}</td>
                  <td>
                    <div className="flex-column">
                      <span className="font-medium">{record.CustomerName || "Walk-in customer"}</span>
                      {record.CustomerCode ? <span className="secondary-text text-xs">{record.CustomerCode}</span> : null}
                    </div>
                  </td>
                  <td>
                    <div className="contractor-tyre-tags">
                      {record.Lines.map((line) => (
                        <span key={line.ID} className="contractor-tyre-tag">
                          {line.Size
                            ? `${line.Brand || "NA"} / ${line.Size || "NA"} (${line.Qty})`
                            : `${line.Brand || "NA"} / ${line.Model || "NA"} (${line.Qty})`}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right font-bold">{qty}</td>
                  <td>
                    {isIssued ? (
                      <div className="flex-column">
                        <StatusBadge
                          label={record.GatePassPaymentOverride ? "Issued with override" : "Issued"}
                          tone={record.GatePassPaymentOverride ? "rejected" : "completed"}
                        />
                        {getPaymentOverrideSummary(record) ? (
                          <span className="secondary-text text-xs">
                            {getPaymentOverrideSummary(record)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex-column">
                        <StatusBadge label="Withheld" tone="rejected" />
                        {record.GatePass ? (
                          <span className="secondary-text text-xs">
                            LKR{" "}
                            {record.GatePass.Shortfall.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            unpaid
                          </span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-action table-action"
                        onClick={() => navigate(`/sales-orders/${record.SoID}`)}
                      >
                        View SO
                      </button>
                    </div>
                  </td>
                </tr>
                <ExpandableDetailRow isExpanded={expanded} colSpan={9}>
                  <div className="expanded-panel">
                    <div className="expanded-summary-grid">
                      <div className="expanded-summary-card">
                        <span className="expanded-summary-label">Sales Order</span>
                        <span className="expanded-summary-value">#{record.SoID}</span>
                        <span className="expanded-summary-meta">
                          {record.GatePassNo ? `Gate pass ${record.GatePassNo}` : "Gate pass withheld"}
                        </span>
                      </div>
                      <div className="expanded-summary-card">
                        <span className="expanded-summary-label">Customer</span>
                        <span className="expanded-summary-value">{record.CustomerName || "Walk-in customer"}</span>
                      </div>
                      <div className="expanded-summary-card">
                        <span className="expanded-summary-label">Delivery</span>
                        <span className="expanded-summary-value">#{record.ID}</span>
                        <span className="expanded-summary-meta">{record.DeliveryDate}</span>
                      </div>
                      <div className="expanded-summary-card">
                        <span className="expanded-summary-label">Notes</span>
                        <span className="expanded-summary-meta">{record.Notes || "No notes"}</span>
                      </div>
                    </div>
                    <div className="expanded-table-wrap">
                      <table className="product-table expanded-allocation-table">
                        <thead><tr><th>Item (Brand / Specifications)</th><th>Location</th><th>Batch / DOT</th><th className="text-right">Qty</th></tr></thead>
                        <tbody>
                          {record.Lines.map((line) => (
                            <tr key={line.ID}>
                              <td>
                                {line.Size
                                  ? `${line.Brand || "NA"} / ${line.Size || "NA"} - ${line.Pattern || "NA"}`
                                  : `${line.Brand || "NA"} / ${line.Model || "NA"} (${line.Capacity || "NA"} ${line.Voltage || "NA"})`}
                              </td>
                              <td>{line.LocationName || "-"}</td>
                              <td>{line.BatchCode || line.DOT || "-"}</td>
                              <td className="text-right font-bold">{line.Qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </ExpandableDetailRow>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
