import { useNavigate } from "@/lib/router"
import { useConsumables } from "../hooks/useConsumables"
import { ConsumablesTable } from "../components/ConsumablesTable"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import type { ConsumableRecord } from "../../../../shared/models/consumables/consumable"

export default function ConsumablesListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { consumables, loading, error, deletingId, refresh, remove } = useConsumables({
    onDeleteSuccess: () => {
      showToast({
        variant: "success",
        title: "Consumable deleted",
        message: "The consumable was removed successfully.",
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

  async function handleDelete(consumable: ConsumableRecord) {
    const label = consumable.Name || String(consumable.Id)
    const confirmed = await confirm({
      title: "Delete Consumable",
      message: `Delete consumable "${label}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await remove(consumable)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Consumable Table</p>
          <h2>Current consumable records</h2>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("new")} type="button">
            Create Consumable
          </button>
          <span className="table-count">{consumables.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading consumables...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <ConsumablesTable
            consumables={consumables}
            deletingId={deletingId}
            onEdit={(consumable) => navigate(`${consumable.Id}/edit`)}
            onDelete={(consumable) => void handleDelete(consumable)}
          />
        </div>
      ) : null}
    </section>
  )
}
