import type { StockSnapshotRecord } from "../models/stockSnapshot"

interface StockSnapshotsTableProps {
  data: StockSnapshotRecord[]
  loading: boolean
}

export function StockSnapshotsTable({ data, loading }: StockSnapshotsTableProps) {
  if (loading) return <p className="hero-text">Loading stock snapshots...</p>
  if (data.length === 0) return <p className="hero-text">No stock records found.</p>

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Size</th>
            <th>Pattern</th>
            <th>LL/SR</th>
            <th>PR</th>
            <th>Side Wall</th>
            <th>Supplier Codes</th>
            <th>Supplier Names</th>
            <th className="text-right">On Hand</th>
            <th className="text-right">Allocated</th>
            <th className="text-right">Available</th>
            <th className="text-right">Purchased</th>
            <th className="text-right">Selling</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.TyreID}>
              <td className="font-mono text-small">{record.TyreID}</td>
              <td>{record.Size ?? "-"}</td>
              <td>{record.Pattern ?? "-"}</td>
              <td>{record.LL_SR ?? "-"}</td>
              <td>{record.PR ?? "-"}</td>
              <td>{record.SideWall ?? "-"}</td>
              <td className="text-small">{record.SupplierCodes ?? "-"}</td>
              <td className="text-small">{record.SupplierNames ?? "-"}</td>
              <td className="text-right font-bold">{record.OnHandQty}</td>
              <td className="text-right text-warning">{record.AllocatedSalesQty}</td>
              <td className="text-right text-success font-bold">
                {record.AvailableToSellQty}
              </td>
              <td className="text-right">
                {record.PurchasedPrice != null 
                  ? record.PurchasedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) 
                  : "-"}
              </td>
              <td className="text-right">
                {record.ActualSellingPrice != null 
                  ? record.ActualSellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) 
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}