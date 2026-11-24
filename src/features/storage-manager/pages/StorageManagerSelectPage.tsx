import { Link } from "@/lib/router"

export default function StorageManagerSelectPage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>Storage Manager</h1>
          <p className="hero-text">
            Select the type of inventory you want to manage.
          </p>
        </div>
      </section>

      <section className="module-grid">
        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Inventory</p>
          <h2>Tyre Stock</h2>
          <p>
            Manage tyre inventory by branch and storage location. Track
            stock levels, allocate tyres, and monitor capacity.
          </p>
          <Link className="text-link" to="/storage-manager/tyres">
            Go to tyre stock
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Inventory</p>
          <h2>Consumable Stock</h2>
          <p>
            Manage consumables used during services such as patches,
            lubricants, chemicals, and cleaning supplies.
          </p>
          <Link className="text-link" to="/storage-manager/consumables">
            Go to consumable stock
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Inventory</p>
          <h2>Battery Stock</h2>
          <p>
            Manage battery inventory, batch codes, manufacture and expiry dates,
            and monitor storage location capacity.
          </p>
          <Link className="text-link" to="/storage-manager/batteries">
            Go to battery stock
          </Link>
        </article>
      </section>
    </main>
  )
}
