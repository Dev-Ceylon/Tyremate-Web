import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { ContractorsTable } from "../components/ContractorsTable"
import { useContractors } from "../hooks/useContractors"
import type { ContractorRecord } from "../models/contractor"

export default function ContractorsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { contractors, loading, error, deletingContractorId, refresh, removeContractor } = useContractors({
    onDeleteSuccess: (contractor) => {
      showToast({
        variant: "success",
        title: "Contractor deleted",
        message: `"${contractor.Name}" was removed successfully.`,
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

  async function handleDeleteContractor(contractor: ContractorRecord) {
    const confirmed = await confirm({
      title: "Delete Contractor",
      message: `Delete contractor "${contractor.Name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeContractor(contractor)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Contractor Table</p>
          <h2>Current contractor records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{contractors.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading contractors...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <ContractorsTable
            contractors={contractors}
            deletingContractorId={deletingContractorId}
            onEdit={(contractor) => navigate(`${contractor.ID}/edit`)}
            onDelete={(contractor) =>
              void handleDeleteContractor(contractor)
            }
          />
        </div>
      ) : null}
    </section>
  )
}
