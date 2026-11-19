import { Link } from "@/lib/router"

export default function MasterDataPage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Reference Workspace</p>
          <h1>Master Data</h1>
          <p className="hero-text">
            Manage the reference records that support purchasing, inventory,
            and sales workflows.
          </p>
        </div>


      </section>

      <section className="module-grid">
        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Suppliers</h2>
          <p>
            Manage supplier reference records used by purchasing and inventory.
          </p>
          <Link className="text-link" to="/master-data/suppliers">
            Go to suppliers
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Customers</h2>
          <p>
            Manage customer reference records used by sales and service workflows.
          </p>
          <Link className="text-link" to="/master-data/customers">
            Go to customers
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Contractors</h2>
          <p>
            Manage contractor reference records and their linked tyre capabilities.
          </p>
          <Link className="text-link" to="/master-data/contractors">
            Go to contractors
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Branches</h2>
          <p>
            Manage branch reference records shared across warehouse and inventory workflows.
          </p>
          <Link className="text-link" to="/master-data/branches">
            Go to branches
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Tyres</h2>
          <p>
            Manage tyre reference records for purchasing, pricing, and sales readiness.
          </p>
          <Link className="text-link" to="/master-data/tyres">
            Go to tyres
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Consumables</h2>
          <p>
            Manage consumable reference records used during services such as
            patches, lubricants, chemicals, and cleaning supplies.
          </p>
          <Link className="text-link" to="/master-data/consumables">
            Go to consumables
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Storage Manager</h2>
          <p>
            Manage stock by selecting tyre inventory or consumable inventory
            across branches and storage locations.
          </p>
          <Link className="text-link" to="/storage-manager">
            Go to storage manager
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Storage Locations</h2>
          <p>
            Manage storage location reference records for warehouses, branches, and capacity planning.
          </p>
          <Link className="text-link" to="/master-data/storage-locations">
            Go to storage locations
          </Link>
        </article>

        <article className="info-panel panel panel-strong module-card">
          <p className="section-label">Module</p>
          <h2>Bank Details</h2>
          <p>
            Manage bank account reference records for financial transactions and settlements.
          </p>
          <Link className="text-link" to="/master-data/bank-details">
            Go to bank details
          </Link>
        </article>
      </section>
    </main>
  )
}
