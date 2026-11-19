import { StorageManagerFilters } from "../components/StorageManagerFilters"
import { StorageLocationCards } from "../components/StorageLocationCards"
import { useStorageManagerPage } from "../hooks/useStorageManagerPage"

export default function StorageManagerPage() {
  const {
    branches,
    storageLocations,
    selectedBranch,
    selectedBranchId,
    loadingBranches,
    loadingLocations,
    error,
    selectBranch,
  } = useStorageManagerPage()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>Storage Manager</h1>
          <p className="hero-text">
            Manage stock by branch and storage location from one workspace.
          </p>
        </div>
      </section>

      <StorageManagerFilters
        branches={branches}
        selectedBranchId={selectedBranchId}
        loadingBranches={loadingBranches}
        onSelectBranch={selectBranch}
      />

      {error ? (
        <section className="table-panel panel panel-strong">
          <p className="hero-text">{error}</p>
        </section>
      ) : null}

      {/* <section className="content-grid">
        <article className="info-panel panel panel-strong">
          <p className="section-label">Selected Branch</p>
          <h2>{selectedBranch?.BranchName ?? "No branch selected"}</h2>
          <p>
            {selectedBranch
              ? `Showing ${storageLocations.length} storage location${storageLocations.length === 1 ? "" : "s"} for the selected branch.`
              : "Select a branch to view its available storage locations."}
          </p>
        </article>

        <article className="info-panel panel panel-strong">
          <p className="section-label">Storage Locations</p>
          <h2>Branch-specific locations</h2>
          <p>Locations for the selected branch are shown below as cards.</p>
        </article>
      </section> */}

      <StorageLocationCards
        storageLocations={storageLocations}
        selectedBranchName={selectedBranch?.BranchName}
        loading={loadingLocations}
      />
    </main>
  )
}
