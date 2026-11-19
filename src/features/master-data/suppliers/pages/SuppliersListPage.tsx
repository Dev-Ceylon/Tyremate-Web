import { useNavigate } from "@/lib/router"
import { useSuppliers } from "../hooks/useSuppliers"
import { SuppliersTable } from "../components/SuppliersTable"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import type { SupplierRecord } from "../models/supplier"

export default function SuppliersListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { suppliers, loading, error, deletingSupplierId, refresh, removeSupplier } = useSuppliers({
    onDeleteSuccess: (supplier) => {
      showToast({
        variant: "success",
        title: "Supplier deleted",
        message: `"${supplier.Name}" was removed successfully.`,
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

  async function handleDeleteSupplier(supplier: SupplierRecord) {
    const confirmed = await confirm({
      title: "Delete Supplier",
      message: `Delete supplier "${supplier.Name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeSupplier(supplier)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Supplier Table</p>
          <h2>Current supplier records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{suppliers.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading suppliers...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <SuppliersTable
            suppliers={suppliers}
            deletingSupplierId={deletingSupplierId}
            onEdit={(supplier) => navigate(`${supplier.SupplierID}/edit`)}
            onDelete={(supplier) =>
              void handleDeleteSupplier(supplier)
            }
          />
        </div>
      ) : null}
    </section>
  )
}
