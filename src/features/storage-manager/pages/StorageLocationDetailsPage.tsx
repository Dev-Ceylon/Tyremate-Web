import { Link } from "@/lib/router"
import { useStorageLocationDetailsPage } from "../hooks/useStorageLocationDetailsPage"
import { CircularProgress } from "../../../shared/ui/progress/CircularProgress"
import { StorageLocationDetailsTable } from "../components/StorageLocationDetailsTable"

export default function StorageLocationDetailsPage() {
  const {
    storageLocation,
    tyres,
    availableTyres,
    storageManagerRows,
    selectedTyreId,
    qty,
    canSaveCreateRow,
    canSaveEditRow,
    loading,
    error,
    submitting,
    submitError,
    editingRowId,
    editingQty,
    updateField,
    startEditStorageRow,
    cancelEditStorageRow,
    updateEditingQty,
    handleCreateStorageRow,
    handleUpdateStorageRow,
    handleDeleteStorageRow,
  } = useStorageLocationDetailsPage()
  const pageTitle = storageLocation?.LocationName ?? "Storage Name Not provided"
  const capacity = storageLocation?.Capacity ?? 0
  const used = storageLocation?.UsedCapacity ?? 0
  const remaining = storageLocation?.RemainingCapacity ?? 0
  const usagePercent = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>{pageTitle}</h1>
        </div>

        <Link className="secondary-action" to="/storage-manager/tyres">
          Back to Storage Manager
        </Link>
      </section>

      {!loading && !error && storageLocation ? (
        <section className="info-panel panel panel-strong storage-location-card storage-location-details-usage">
          <div className="storage-location-card-content">
            <p className="section-label">Location Usage</p>
            <p>Capacity: {capacity}</p>
            <p>Used: {used}</p>
            <p>Remaining: {remaining}</p>
          </div>
          <div className="storage-location-card-progress">
            <CircularProgress
              value={usagePercent}
              text="Used"
              ariaLabel={`Usage ${Math.round(usagePercent)} percent`}
            />
          </div>
        </section>
      ) : null}

      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Stored Tyres</p>
            <h2>Tyres in this location</h2>
          </div>
        </div>

        {submitError ? <p className="hero-text">{submitError}</p> : null}
        {loading ? <p className="hero-text">Loading storage manager details...</p> : null}
        {!loading && !error && storageManagerRows.length === 0 ? (
          <p className="table-empty">No tyres stored in this location.</p>
        ) : null}

        <StorageLocationDetailsTable
          state={{
            loading,
            error,
            submitting,
            storageManagerRows,
            editingRowId,
            editingQty,
            canSaveCreateRow,
            selectedTyreId,
            qty,
            tyres,
            availableTyres,
          }}
          editActions={{
            canSaveEditRow,
            updateEditingQty,
            startEditStorageRow,
            cancelEditStorageRow,
            handleUpdateStorageRow,
            handleDeleteStorageRow,
          }}
          createActions={{
            updateField,
            handleCreateStorageRow,
          }}
        />
      </section>
    </main>
  )
}
