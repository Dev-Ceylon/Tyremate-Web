import { Link } from "@/lib/router"
import { useConsumableLocationDetailsPage } from "../hooks/useConsumableLocationDetailsPage"
import { CircularProgress } from "../../../shared/ui/progress/CircularProgress"
import { ConsumableLocationDetailsTable } from "../components/ConsumableLocationDetailsTable"

export default function ConsumableLocationDetailsPage() {
  const {
    location,
    consumables,
    stockRows,
    selectedConsumableId,
    qty,
    batchNumber,
    expiryDate,
    canSaveCreateRow,
    canSaveEditRow,
    loading,
    error,
    submitting,
    submitError,
    editingRowId,
    editingQty,
    editingBatchNumber,
    editingExpiryDate,
    updateField,
    startEditRow,
    cancelEditRow,
    updateEditingField,
    handleCreateRow,
    handleUpdateRow,
    handleDeleteRow,
  } = useConsumableLocationDetailsPage()
  const pageTitle = location?.LocationName ?? "Consumable Location"
  const capacity = location?.Capacity ?? 0
  const used = location?.UsedCapacity ?? 0
  const remaining = location?.RemainingCapacity ?? 0
  const usagePercent = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Inventory Control</p>
          <h1>{pageTitle}</h1>
        </div>

        <Link className="secondary-action" to="/storage-manager/consumables">
          Back to Consumable Stock
        </Link>
      </section>

      {!loading && !error && location ? (
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
            <p className="section-label">Stored Consumables</p>
            <h2>Consumables in this location</h2>
          </div>
        </div>

        {submitError ? <p className="hero-text">{submitError}</p> : null}
        {loading ? <p className="hero-text">Loading consumable details...</p> : null}
        {!loading && !error && stockRows.length === 0 ? (
          <p className="table-empty">No consumables stored in this location.</p>
        ) : null}

        <ConsumableLocationDetailsTable
          state={{
            loading,
            error,
            submitting,
            stockRows,
            editingRowId,
            editingQty,
            editingBatchNumber,
            editingExpiryDate,
            canSaveCreateRow,
            selectedConsumableId,
            qty,
            batchNumber,
            expiryDate,
            consumables,
          }}
          editActions={{
            canSaveEditRow,
            updateEditingField,
            startEditRow,
            cancelEditRow,
            handleUpdateRow,
            handleDeleteRow,
          }}
          createActions={{
            updateField,
            handleCreateRow,
          }}
        />
      </section>
    </main>
  )
}
