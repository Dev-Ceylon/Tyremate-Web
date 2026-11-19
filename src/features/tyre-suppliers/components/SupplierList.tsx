import { useTyreSuppliers } from "../hooks/useTyreSuppliers"
import type { TyreSupplier } from "../models/tyreSupplier"
import { useState } from "react"

interface SupplierListProps {
  tyreId: string | number | null
  onSelect?: (supplier: TyreSupplier) => void
  isSelectable?: boolean
}

export function SupplierList({ tyreId, onSelect, isSelectable = false }: SupplierListProps) {
  const { suppliers, loading, error } = useTyreSuppliers(tyreId)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number | null>(null)

  if (!tyreId) {
    return <div className="supplier-list-empty">Please select a tyre first</div>
  }

  if (loading) {
    return <div className="supplier-list-loading">Loading suppliers...</div>
  }

  if (error) {
    return <div className="supplier-list-error">Error: {error}</div>
  }

  if (suppliers.length === 0) {
    return <div className="supplier-list-empty">No suppliers available for this tyre</div>
  }

  const handleSelect = (supplier: TyreSupplier) => {
    setSelectedSupplierId(supplier.id)
    onSelect?.(supplier)
  }

  return (
    <div className="supplier-list-container">
      <table className="supplier-list-table">
        <thead>
          <tr>
            {isSelectable && <th className="supplier-list-checkbox-col"></th>}
            <th>Supplier Name</th>
            <th>Contact</th>
            <th>Price</th>
            {/* <th>Quantity</th>
            <th>Lead Time</th> */}
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className={selectedSupplierId === supplier.id ? "supplier-list-row-selected" : ""}>
              {isSelectable && (
                <td className="supplier-list-checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedSupplierId === supplier.id}
                    onChange={() => handleSelect(supplier)}
                    aria-label={`Select ${supplier.supplierName}`}
                  />
                </td>
              )}
              <td>{supplier.supplierName}</td>
              <td>{supplier.supplierContact}</td>
              {/* <td className="supplier-list-price">
                {supplier.price !== undefined ? `$${supplier.price.toFixed(2)}` : "N/A"}
              </td>
              <td className="supplier-list-quantity">{supplier.quantity ?? "N/A"}</td>
              <td>{supplier.leadTime || "N/A"}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
