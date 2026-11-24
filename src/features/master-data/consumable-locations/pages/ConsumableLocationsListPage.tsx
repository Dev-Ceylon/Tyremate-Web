import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { ConsumableLocationsTable } from "../components/ConsumableLocationsTable"
import { LoadingState } from "../../../../shared/ui/progress"
import { useConsumableLocations } from "../hooks/useConsumableLocations"
import type { ConsumableLocationRecord } from "../../../../shared/models/consumables/consumableLocation"

export default function ConsumableLocationsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const {
    locations,
    loading,
    error,
    deletingId,
    refresh,
    remove,
  } = useConsumableLocations({
    onDeleteSuccess: (location) => {
      showToast({
        variant: "success",
        title: "Consumable location deleted",
        message: `"${location.LocationName || location.LocationCode || "Consumable location"}" was removed successfully.`,
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

  async function handleDelete(location: ConsumableLocationRecord) {
    const name = location.LocationName || location.LocationCode || "this consumable location"
    const confirmed = await confirm({
      title: "Delete Consumable Location",
      message: `Delete consumable location "${name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await remove(location)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Consumable Location Table</p>
          <h2>Current consumable location records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{locations.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState message="Loading consumable locations…" /> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <ConsumableLocationsTable
            locations={locations}
            deletingId={deletingId}
            onEdit={(location) => navigate(`${location.Id}/edit`)}
            onDelete={(location) => void handleDelete(location)}
          />
        </div>
      ) : null}
    </section>
  )
}
