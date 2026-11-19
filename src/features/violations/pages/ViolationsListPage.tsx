import { useNavigate } from "@/lib/router";
import { useViolationsList } from "../hooks/useViolations";
import { ViolationTable } from "../components/ViolationTable";
import { useViolationsFilters } from "../hooks/useViolationsFilters";
import { useViolationsStats } from "../hooks/useViolationsStats";
import { useViolationActions } from "../hooks/useViolationActions";

export function ViolationsListPage() {
  const navigate = useNavigate();
  const { violations, loading, error, refresh } = useViolationsList();

  const {
    filters: { search, filterType, filterStatus },
    filteredViolations,
    isFiltering,
    setSearch,
    setFilterType,
    setFilterStatus,
  } = useViolationsFilters(violations);

  const stats = useViolationsStats(violations);

  const { handleApprove, handleReject, handleViewDetails } = useViolationActions(navigate, refresh);

  if (loading) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div>
            <p className="eyebrow">Policy Violations</p>
            <h1>All Violations</h1>
            <p className="hero-text">View and manage all policy violations across sales orders.</p>
          </div>
        </section>
        <section className="table-panel panel panel-strong">
          <div className="loading-state">Loading violations...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Policy Violations</p>
          <h1>All Violations</h1>
          <p className="hero-text">View and manage all policy violations across sales orders.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-action" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="info-panel panel panel-strong mt-4">
        <div className="stats-inline">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending:</span>
            <strong className="stat-value stat-value-warning">{stats.pending}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <strong className="stat-value stat-value-success">{stats.approved}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rejected:</span>
            <strong className="stat-value stat-value-danger">{stats.rejected}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">OVMAX:</span>
            <strong className="stat-value stat-value-brand">{stats.ovmx}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">FSFO:</span>
            <strong className="stat-value stat-value-danger">{stats.fsfo}</strong>
          </div>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <h2>Violations</h2>
        </div>

        {/* Filters - using table-filter-controls pattern */}
        <div className="table-filter-controls">
          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search by type, tyre, SO, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-input filter-min-280"
            />
          </div>
          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="filterType">Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-input filter-min-180"
            >
              <option value="all">All Types</option>
              <option value="ovmx">OVMAX (Discount)</option>
              <option value="fsfo">FSFO (DOT)</option>
            </select>
          </div>
          <div className="table-filter-field">
            <label className="filter-field-label" htmlFor="filterStatus">Status</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-input filter-min-160"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="filters-summary secondary-text">
            Showing <strong>{filteredViolations.length}</strong> of <strong>{violations.length}</strong> violations
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-scroll">
          {filteredViolations.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">⚠️</div>
              <h3>No violations found</h3>
              <p>{isFiltering ? "Try adjusting your filters" : "No policy violations recorded yet"}</p>
            </div>
          ) : (
            <ViolationTable
              violations={filteredViolations}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </section>
    </main>
  );
}