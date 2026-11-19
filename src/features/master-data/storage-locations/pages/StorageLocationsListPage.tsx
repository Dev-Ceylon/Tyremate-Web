import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { StorageLocationsTable } from "../components/StorageLocationsTable"
import { useStorageLocations } from "../hooks/useStorageLocations"
import type { StorageLocationRecord } from "../models/storageLocation"

export default function StorageLocationsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const {
    storageLocations,
    loading,
    error,
    deletingStorageLocationId,
    refresh,
    removeStorageLocation,
  } = useStorageLocations({
    onDeleteSuccess: (storageLocation) => {
      showToast({
        variant: "success",
        title: "Storage location deleted",
        message: `"${storageLocation.LocationName || storageLocation.LocationCode || "Storage location"}" was removed successfully.`,
      })
    },
    onDeleteError: (message) => {
      showToast({
        variant: "error",
        title: "Delete failed",
        message,
      })
    },
  })

  async function handleDeleteStorageLocation(storageLocation: StorageLocationRecord) {
    const name = storageLocation.LocationName || storageLocation.LocationCode || "this storage location"
    const confirmed = await confirm({
      title: "Delete Storage Location",
      message: `Delete storage location "${name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeStorageLocation(storageLocation)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Storage Location Table</p>
          <h2>Current storage location records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{storageLocations.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading storage locations...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <StorageLocationsTable
            storageLocations={storageLocations}
            deletingStorageLocationId={deletingStorageLocationId}
            onEdit={(storageLocation) => navigate(`${storageLocation.Id}/edit`)}
            onDelete={(storageLocation) => void handleDeleteStorageLocation(storageLocation)}
          />
        </div>
      ) : null}
    </section>
  )
}
