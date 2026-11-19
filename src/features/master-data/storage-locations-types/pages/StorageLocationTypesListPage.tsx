import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { StorageLocationTypesTable } from "../components/StorageLocationTypesTable"
import { useStorageLocationTypes } from "../hooks/useStorageLocationTypes"
import type { StorageLocationTypeRecord } from "../models/storageLocationType"

export default function StorageLocationTypesListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const {
    storageLocationTypes,
    loading,
    error,
    deletingId,
    refresh,
    removeStorageLocationType,
  } = useStorageLocationTypes({
    onDeleteSuccess: (type) => {
      showToast({
        variant: "success",
        title: "Storage location type deleted",
        message: `"${type.LocationTypeName || type.LocationTypeCode || "Storage location type"}" was removed successfully.`,
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

  async function handleDelete(type: StorageLocationTypeRecord) {
    const name = type.LocationTypeName || type.LocationTypeCode || "this storage location type"
    const confirmed = await confirm({
      title: "Delete Storage Location Type",
      message: `Delete storage location type "${name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeStorageLocationType(type)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Storage Location Type Table</p>
          <h2>Current storage location type records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{storageLocationTypes.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading storage location types...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <StorageLocationTypesTable
            storageLocationTypes={storageLocationTypes}
            deletingId={deletingId}
            onEdit={(type) => navigate(`${type.Id}/edit`)}
            onDelete={(type) => void handleDelete(type)}
          />
        </div>
      ) : null}
    </section>
  )
}