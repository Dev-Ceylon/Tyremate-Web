import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { DagTable } from "../components/DagTable"
import { useDagList } from "../hooks/useDagList"
import type { DagRecord } from "../models/dag"
import { IssueGatePassDialog } from "../components/IssueGatePassDialog"

export default function DagListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [gatePassTarget, setGatePassTarget] = useState<DagRecord | null>(null)

  const {
    dags,
    loading,
    error,
    deletingDagId,
    issuingId,
    refresh,
    removeDAG,
    issueGatePass,
  } = useDagList({
    onDeleteSuccess: (dag) => {
      showToast({
        variant: "success",
        title: "DAG deleted",
        message: `DAG #${dag.ID} was removed successfully.`,
      })
    },
    onDeleteError: (message) => {
      showToast({
        variant: "error",
        title: "Delete failed",
        message,
      })
    },
    onIssueSuccess: (dag) => {
      showToast({
        variant: "success",
        title: "Gate Pass Issued",
        message: `Status for DAG #${dag.ID} updated to Gate Pass Issued.`,
      })
    },
    onIssueError: (message) => {
      showToast({
        variant: "error",
        title: "Action failed",
        message,
      })
    },
  })

  async function handleDeleteDAG(dag: DagRecord) {
    const confirmed = await confirm({
      title: "Delete DAG",
      message: `Delete DAG #${dag.ID}?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeDAG(dag)
    } catch {}
  }

  // Rethrows so IssueGatePassDialog stays open and shows the reason the issue
  // failed, rather than closing over a rejected save.
  async function handleIssueGatePassSubmit(dag: DagRecord) {
    await issueGatePass(dag)
  }

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">DAG</p>
          <h1>DAG List</h1>
          <p className="hero-text">Review and manage the current DAG records.</p>
        </div>
        <div className="header-actions">
          <span className="table-count">{dags.length} items</span>
          <button className="secondary-action" onClick={() => navigate("/dag/new")} type="button">
            Create DAG
          </button>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </section>

      <section className="table-panel panel panel-strong">
        {loading ? <p className="hero-text">Loading DAG records...</p> : null}
        {error ? <p className="hero-text">{error}</p> : null}
        {!loading && !error ? (
          <div className="table-scroll table-scroll-wide">
            <DagTable
              dags={dags}
              deletingDagId={deletingDagId}
              issuingId={issuingId}
              onView={(dag) => navigate(`/dag/${dag.ID}`)}
              onDelete={(dag) => void handleDeleteDAG(dag)}
              onIssueGatePass={setGatePassTarget}
            />
          </div>
        ) : null}
      </section>

      <IssueGatePassDialog
        isOpen={!!gatePassTarget}
        dag={gatePassTarget}
        onClose={() => setGatePassTarget(null)}
        onSubmit={handleIssueGatePassSubmit}
      />
    </main>
  )
}
