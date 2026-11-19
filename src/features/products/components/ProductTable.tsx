import type { Product } from "../models/product";

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return <p className="table-empty">No products found.</p>
  }

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
        </tr>
      </thead>

      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.name}</td>
            <td>${p.price.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
