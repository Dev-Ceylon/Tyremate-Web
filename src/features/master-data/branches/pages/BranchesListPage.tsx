import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { BranchesTable } from "../components/BranchesTable"
import { useBranches } from "../hooks/useBranches"
import type { BranchRecord } from "../models/branch"

export default function BranchesListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { branches, loading, error, deletingBranchId, refresh, removeBranch } = useBranches({
    onDeleteSuccess: (branch) => {
      showToast({
        variant: "success",
        title: "Branch deleted",
        message: `"${branch.BranchName}" was removed successfully.`,
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

  async function handleDeleteBranch(branch: BranchRecord) {
    const confirmed = await confirm({
      title: "Delete Branch",
      message: `Delete branch "${branch.BranchName}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeBranch(branch)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Branch Table</p>
          <h2>Current branch records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{branches.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading branches...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <BranchesTable
            branches={branches}
            deletingBranchId={deletingBranchId}
            onEdit={(branch) => navigate(`${branch.Id}/edit`)}
            onDelete={(branch) => void handleDeleteBranch(branch)}
          />
        </div>
      ) : null}
    </section>
  )
}
