import { Link } from "@/lib/router"

export default function ReminderHomePage() {
  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Reminders</p>
          <h1>Reminder Management</h1>
          <p className="hero-text">
            Select an action to manage daily follow-ups and pending reminders.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Today</p>
          <h2>Today's Pending Reminders</h2>
          <p>
            Review reminders due today and track pending follow-ups.
          </p>
          <div className="header-actions">
            <Link className="primary-action" to="/reminders">
              View Today's Reminders
            </Link>
          </div>
        </article>

        <article className="info-panel panel panel-strong">
          <p className="section-label">Manage</p>
          <h2>All Reminder Actions</h2>
          <p>
            Browse reminders, update completion state, and manage reminder records.
          </p>
          <div className="header-actions">
            <Link className="secondary-action" to="/reminders">
              Open Reminder Workspace
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}