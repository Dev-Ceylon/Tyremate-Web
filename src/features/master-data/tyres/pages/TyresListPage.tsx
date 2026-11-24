import { useNavigate } from "@/lib/router"
import { useTyres } from "../hooks/useTyres"
import { TyresTable } from "../components/TyresTable"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { LoadingState } from "../../../../shared/ui/progress"
import type { TyreRecord } from "../models/tyre"

export default function TyresListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { tyres, loading, error, deletingTyreId, refresh, removeTyre } = useTyres({
    onDeleteSuccess: () => {
      showToast({
        variant: "success",
        title: "Tyre deleted",
        message: "The tyre was removed successfully.",
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

  async function handleDeleteTyre(tyre: TyreRecord) {
    const tyreLabel = [tyre.Size, tyre.Pattern].filter(Boolean).join(" / ") || String(tyre.Id)
    const confirmed = await confirm({
      title: "Delete Tyre",
      message: `Delete tyre "${tyreLabel}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeTyre(tyre)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Tyre Table</p>
          <h2>Current tyre records</h2>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => navigate("new")} type="button">
            Create Tyre
          </button>
          <span className="table-count">{tyres.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState message="Loading tyres…" /> : null}
      {error ? <p className="hero-text">Opps Something went Wrong!</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <TyresTable
            tyres={tyres}
            deletingTyreId={deletingTyreId}
            onEdit={(tyre) => navigate(`${tyre.Id}/edit`)}
            onDelete={(tyre) => void handleDeleteTyre(tyre)}
          />
        </div>
      ) : null}
    </section>
  )
}
