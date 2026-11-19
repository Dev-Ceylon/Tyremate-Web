import type { CustomerRecord } from "../models/customer"

type CustomersTableProps = {
  customers: CustomerRecord[]
  deletingCustomerId?: number | null
  onEdit?: (customer: CustomerRecord) => void
  onDelete?: (customer: CustomerRecord) => void
}

export function CustomersTable({
  customers,
  deletingCustomerId = null,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  if (customers.length === 0) {
    return <p className="table-empty">No customers found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Address</th>
            <th>TIN</th>
            <th>VAT</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.CustomerID}>
              <td>{customer.CustomerCode}</td>
              <td>{customer.Name}</td>
              <td>{customer.Contact || "-"}</td>
              <td>{customer.Address || "-"}</td>
              <td>{customer.TinNo || "-"}</td>
              <td>{customer.VatNo || "-"}</td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onEdit?.(customer)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-action table-action"
                    onClick={() => onDelete?.(customer)}
                    disabled={deletingCustomerId === customer.CustomerID}
                  >
                    {deletingCustomerId === customer.CustomerID ? "Deleting..." : "Delete"}
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
