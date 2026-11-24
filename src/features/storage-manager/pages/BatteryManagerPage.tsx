import { Link } from "@/lib/router"
import { StorageManagerFilters } from "../components/StorageManagerFilters"
import { BatteryLocationCards } from "../components/BatteryLocationCards"
import { useBatteryManagerPage } from "../hooks/useBatteryManagerPage"

export default function BatteryManagerPage() {
  const {
    branches,
    storageLocations,
    selectedBranch,
    selectedBranchId,
    loadingBranches,
    loadingLocations,
    error,
    selectBranch,
  } = useBatteryManagerPage()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>Battery Stock</h1>
          <p className="hero-text">
            Manage battery inventory, batch codes, and shelf life by branch and storage location.
          </p>
        </div>

        <Link className="secondary-action" to="/storage-manager">
          Back to Storage Hub
        </Link>
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

      <BatteryLocationCards
        storageLocations={storageLocations}
        selectedBranchName={selectedBranch?.BranchName}
        loading={loadingLocations}
      />
    </main>
  )
}
