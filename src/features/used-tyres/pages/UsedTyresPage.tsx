export default function UsedTyresPage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Management</p>
          <h1>Used Tyres</h1>
          <p className="hero-text">
            Track and manage second-hand tyre stock, condition reports, and 
            resale pricing from this centralized module.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Module Status</p>
          <h2>Ready for Implementation</h2>
          <p>
            The infrastructure for Used Tyres has been established. This section 
            will soon support inventory tracking for trade-ins, refurbishments, 
            and specialized second-hand sales workflows.
          </p>
          <ul className="feature-list" style={{ marginTop: '1rem' }}>
            <li>Stock intake and grading system (Coming soon)</li>
            <li>Condition-based pricing models (Planned)</li>
          </ul>
        </article>
      </section>
    </main>
  )
}
