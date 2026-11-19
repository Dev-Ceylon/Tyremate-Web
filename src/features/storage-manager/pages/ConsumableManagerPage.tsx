import { StorageManagerFilters } from "../components/StorageManagerFilters"
import { ConsumableLocationCards } from "../components/ConsumableLocationCards"
import { useConsumableManagerPage } from "../hooks/useConsumableManagerPage"

export default function ConsumableManagerPage() {
  const {
    branches,
    locations,
    selectedBranch,
    selectedBranchId,
    loadingBranches,
    loadingLocations,
    error,
    selectBranch,
  } = useConsumableManagerPage()

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>Consumable Stock</h1>
          <p className="hero-text">
            Manage consumable stock by branch and storage location.
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

      <ConsumableLocationCards
        locations={locations}
        selectedBranchName={selectedBranch?.BranchName}
        loading={loadingLocations}
      />
    </main>
  )
}
