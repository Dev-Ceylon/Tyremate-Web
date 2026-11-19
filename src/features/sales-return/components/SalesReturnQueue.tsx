import type { SalesReturnRecord } from "../models/salesReturn"

interface Props {
  returns: SalesReturnRecord[]
  onSelect: (id: number) => void
}

export function SalesReturnQueue({ returns, onSelect }: Props) {
  if (!returns.length) return <p className="table-empty">No sales returns found.</p>

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead><tr><th>Return</th><th>Date</th><th>Sales Order</th><th>Type</th><th className="text-right">Qty</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr></thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.SalesReturnID}>
              <td className="mono-text">{item.ReturnNo}</td>
              <td className="secondary-text">{item.RequestedDate?.slice(0, 10) || "—"}</td>
              <td className="mono-text">SO-{item.SoID}{item.InvoiceID ? <div className="secondary-text">Invoice #{item.InvoiceID}</div> : null}</td>
              <td>{item.ReturnTypeName || item.ReturnTypeCode || "—"}</td>
              <td className="text-right">{item.TotalQty ?? "—"}</td>
              <td className="text-center"><span className="status-badge">{item.StatusName || item.StatusCode || "—"}</span></td>
              <td className="text-center"><button type="button" className="secondary-action table-action" onClick={() => onSelect(item.SalesReturnID)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
