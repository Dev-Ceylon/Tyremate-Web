import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { BatteryLocationsTable } from "../components/BatteryLocationsTable"
import { LoadingState } from "../../../../shared/ui/progress"
import { useBatteryLocations } from "../hooks/useBatteryLocations"
import type { BatteryLocationRecord } from "../models/batteryLocation"

export default function BatteryLocationsListPage() {
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
  } = useBatteryLocations({
    onDeleteSuccess: (location) => {
      showToast({
        variant: "success",
        title: "Battery location deleted",
        message: `"${location.LocationName || location.LocationCode || "Battery location"}" was removed successfully.`,
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

  async function handleDelete(location: BatteryLocationRecord) {
    const name = location.LocationName || location.LocationCode || "this battery location"
    const confirmed = await confirm({
      title: "Delete Battery Location",
      message: `Delete battery location "${name}"?`,
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
          <p className="section-label">Battery Location Table</p>
          <h2>Current battery location records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{locations.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState message="Loading battery locations…" /> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <BatteryLocationsTable
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
