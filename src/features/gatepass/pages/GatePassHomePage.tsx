import { Link } from "@/lib/router"

export default function GatePassHomePage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Gate Pass</p>
          <h1>Gate Pass Management</h1>
          <p className="hero-text">Select the type of gate pass you want to manage.</p>
        </div>
      </section>

      <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Sales Order</p>
          <h2>SO Gate Pass</h2>
          <p>
            Manage gate passes for sales orders. Create and track gate passes for customer deliveries.
          </p>
          <div className="header-actions">
            <Link className="primary-action" to="/gatepass/so">
              Open SO Gate Pass
            </Link>
          </div>
        </article>

        <article className="info-panel panel panel-strong">
          <p className="section-label">Delivery Advice</p>
          <h2>DAG Gate Pass</h2>
          <p>
            Manage gate passes for delivery advice goods. Create and track gate passes for DAG records.
          </p>
          <div className="header-actions">
            <Link className="primary-action" to="/gatepass/dag">
              Open DAG Gate Pass
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}
