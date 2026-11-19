import { Link } from "@/lib/router"
import { useProducts } from "../hooks/useProducts"
import { ProductTable } from "../components/ProductTable"
import { useAuthContext } from "../../auth/hooks/AuthProvider"

export default function ProductsPage() {
  const { products } = useProducts()
  const { logout } = useAuthContext()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Workspace</p>
          <h1>Products</h1>
          <p className="hero-text">
            Browse everything currently stored in your catalog and use this area
            as the base for future inventory actions.
          </p>
        </div>

        <div className="header-actions">
          <Link className="ghost-link" to="/">
            Back Home
          </Link>
          <button className="secondary-action" onClick={logout}>
            Sign Out
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Product Table</p>
            <h2>Current stock records</h2>
          </div>
          <span className="table-count">{products.length} items</span>
        </div>

        <div className="table-scroll">
          <ProductTable products={products} />
        </div>
      </section>
    </main>
  )
}

