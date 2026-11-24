import { Link } from "@/lib/router"
import { useBatteryLocationDetailsPage } from "../hooks/useBatteryLocationDetailsPage"
import { CircularProgress } from "../../../shared/ui/progress/CircularProgress"
import { BatteryLocationDetailsTable } from "../components/BatteryLocationDetailsTable"

export default function BatteryLocationDetailsPage() {
  const {
    storageLocation,
    batteries,
    availableBatteries,
    storageManagerRows,
    selectedBatteryId,
    qty,
    batchCode,
    mfgDate,
    expiryDate,
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
  } = useBatteryLocationDetailsPage()

  const pageTitle = storageLocation?.LocationName ?? "Storage Location"
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

        <Link className="secondary-action" to="/storage-manager/batteries">
          Back to Battery Stock
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
            <p className="section-label">Stored Batteries</p>
            <h2>Batteries in this location</h2>
          </div>
        </div>

        {submitError ? <p className="hero-text">{submitError}</p> : null}
        {loading ? <p className="hero-text">Loading battery storage details...</p> : null}
        {!loading && !error && storageManagerRows.length === 0 ? (
          <p className="table-empty">No batteries stored in this location.</p>
        ) : null}

        <BatteryLocationDetailsTable
          state={{
            loading,
            error,
            submitting,
            storageManagerRows,
            editingRowId,
            editingQty,
            canSaveCreateRow,
            selectedBatteryId,
            qty,
            batchCode,
            mfgDate,
            expiryDate,
            batteries,
            availableBatteries,
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
