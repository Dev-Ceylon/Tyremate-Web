import { useNavigate } from "@/lib/router"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { BankDetailsTable } from "../components/BankDetailsTable"
import { LoadingState } from "../../../../shared/ui/progress"
import { useBankDetails } from "../hooks/useBankDetails"
import type { BankDetailRecord } from "../models/bankDetail"

export default function BankDetailsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const { bankDetails, loading, error, deletingId, refresh, removeBankDetail } =
    useBankDetails({
      onDeleteSuccess: (record) => {
        showToast({
          variant: "success",
          title: "Bank detail deleted",
          message: `"${record.BankName}" was removed successfully.`,
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

  async function handleDelete(record: BankDetailRecord) {
    const confirmed = await confirm({
      title: "Delete Bank Detail",
      message: `Delete bank detail "${record.BankName} - ${record.AccountNumber}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeBankDetail(record)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Bank Table</p>
          <h2>Current bank records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{bankDetails.length} items</span>
          <button
            className="secondary-action"
            onClick={refresh}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState message="Loading bank details…" /> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <BankDetailsTable
            bankDetails={bankDetails}
            deletingId={deletingId}
            onEdit={(item) => navigate(`${item.ID}/edit`)}
            onDelete={(item) => void handleDelete(item)}
          />
        </div>
      ) : null}
    </section>
  )
}