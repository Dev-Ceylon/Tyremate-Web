import { Link } from "@/lib/router"

export default function StorageLocationsSelectPage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Reference Workspace</p>
          <h1>Storage Locations</h1>
          <p className="hero-text">
            Select the type of storage locations you want to manage.
          </p>
        </div>
      </section>

      <section className="module-grid">
        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Reference Data</p>
          <h2>Tyre Locations</h2>
          <p>
            Manage storage locations used for tyre inventory. Define
            branches, capacity, and location codes for warehouse tracking.
          </p>
          <Link className="text-link" to="/master-data/storage-locations/tyres">
            Go to tyre locations
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Reference Data</p>
          <h2>Battery Locations</h2>
          <p>
            Manage storage locations used for battery stock. Define
            branches, charging bays, capacity, and shelf-life tracking.
          </p>
          <Link className="text-link" to="/master-data/battery-locations">
            Go to battery locations
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Reference Data</p>
          <h2>Consumable Locations</h2>
          <p>
            Manage storage locations for consumables such as patches,
            lubricants, chemicals, and cleaning supplies.
          </p>
          <Link className="text-link" to="/master-data/consumable-locations">
            Go to consumable locations
          </Link>
        </article>
      </section>
    </main>
  )
}
