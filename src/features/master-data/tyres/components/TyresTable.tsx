import type { TyreRecord } from "../models/tyre"

type TyresTableProps = {
  tyres: TyreRecord[]
  deletingTyreId?: number | null
  onEdit?: (tyre: TyreRecord) => void
  onDelete?: (tyre: TyreRecord) => void
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "-"
  }

  return value.toFixed(2)
}

export function TyresTable({
  tyres,
  deletingTyreId = null,
  onEdit,
  onDelete,
}: TyresTableProps) {
  if (tyres.length === 0) {
    return <p className="table-empty">No tyres found.</p>
  }

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Size</th>
          <th>Brand</th>
          <th>Pattern</th>
          <th>LL/SR</th>
          <th>PR</th>
          <th>Supplier</th>
          <th>MRP (With VAT)</th>
          <th>DAG Cost</th>
          <th>Selling Price</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tyres.map((tyre) => (
          <tr key={tyre.Id}>
            <td>{tyre.Size || "-"}</td>
            <td>{tyre.Brand || "-"}</td>
            <td>{tyre.Pattern || "-"}</td>
            <td>{tyre.LL_SR || "-"}</td>
            <td>{tyre.PR || "-"}</td>
            <td>{tyre.SupplierCodes || tyre.SupplierNames || "-"}</td>
            <td>{formatNumber(tyre.MRP_WithVAT)}</td>
            <td>{formatNumber(tyre.DAGCost)}</td>
            <td>{formatNumber(tyre.ActualSellingPrice)}</td>
            <td>
              <div className="table-actions">
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onEdit?.(tyre)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-action table-action"
                  onClick={() => onDelete?.(tyre)}
                  disabled={deletingTyreId === tyre.Id}
                >
                  {deletingTyreId === tyre.Id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
