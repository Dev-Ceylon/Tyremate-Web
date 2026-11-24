import { getSupplierTypeBadgeClass, getSupplierTypeName } from "../constants/supplierTypeConstants"
import type { SupplierRecord } from "../models/supplier"

type SuppliersTableProps = {
  suppliers: SupplierRecord[]
  deletingSupplierId?: number | null
  onEdit?: (supplier: SupplierRecord) => void
  onDelete?: (supplier: SupplierRecord) => void
}

export function SuppliersTable({
  suppliers,
  deletingSupplierId = null,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  if (suppliers.length === 0) {
    return <p className="table-empty">No suppliers found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Contact</th>
            <th>Address</th>
            <th>TIN</th>
            <th>VAT</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.SupplierID}>
              <td>{supplier.SupplierCode}</td>
              <td>{supplier.Name}</td>
              <td>
                <span className={getSupplierTypeBadgeClass(supplier.SupplierTypeCode)}>
                  {supplier.SupplierTypeName || getSupplierTypeName(supplier.SupplierTypeCode)}
                </span>
              </td>
              <td>{supplier.Contact || "-"}</td>
              <td>{supplier.Address || "-"}</td>
              <td>{supplier.TinNo || "-"}</td>
              <td>{supplier.VatNo || "-"}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(supplier)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(supplier)}
                    disabled={deletingSupplierId === supplier.SupplierID}
                  >
                    {deletingSupplierId === supplier.SupplierID ? "Deleting..." : "Delete"}
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
