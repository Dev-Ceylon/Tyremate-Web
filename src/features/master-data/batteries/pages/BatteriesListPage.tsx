import { useNavigate } from "@/lib/router"
import { useBatteries } from "../hooks/useBatteries"
import { BatteriesTable } from "../components/BatteriesTable"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import type { BatteryRecord } from "../models/battery"

export default function BatteriesListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { batteries, loading, error, deletingBatteryId, refresh, removeBattery } = useBatteries({
    onDeleteSuccess: () => {
      showToast({
        variant: "success",
        title: "Battery deleted",
        message: "The battery was removed successfully.",
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

  async function handleDeleteBattery(battery: BatteryRecord) {
    const batteryLabel = [battery.Brand, battery.Model, battery.Capacity].filter(Boolean).join(" ") || String(battery.Id)
    const confirmed = await confirm({
      title: "Delete Battery",
      message: `Delete battery "${batteryLabel}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeBattery(battery)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Battery Table</p>
          <h2>Current battery records</h2>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("new")} type="button">
            Create Battery
          </button>
          <span className="table-count">{batteries.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading batteries...</p> : null}
      {error ? <p className="hero-text">Oops! Something went wrong.</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <BatteriesTable
            batteries={batteries}
            deletingBatteryId={deletingBatteryId}
            onEdit={(battery) => navigate(`${battery.Id}/edit`)}
            onDelete={(battery) => void handleDeleteBattery(battery)}
          />
        </div>
      ) : null}
    </section>
  )
}
