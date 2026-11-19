import { useNavigate } from "@/lib/router"
import { useCustomers } from "../hooks/useCustomers"
import { CustomersTable } from "../components/CustomersTable"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import type { CustomerRecord } from "../models/customer"

export default function CustomersListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { customers, loading, error, deletingCustomerId, refresh, removeCustomer } = useCustomers({
    onDeleteSuccess: (customer) => {
      showToast({
        variant: "success",
        title: "Customer deleted",
        message: `"${customer.Name}" was removed successfully.`,
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

  async function handleDeleteCustomer(customer: CustomerRecord) {
    const confirmed = await confirm({
      title: "Delete Customer",
      message: `Delete customer "${customer.Name}"?`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    try {
      await removeCustomer(customer)
    } catch {}
  }

  return (
    <section className="table-panel panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Customer Table</p>
          <h2>Current customer records</h2>
        </div>
        <div className="header-actions">
          <span className="table-count">{customers.length} items</span>
          <button className="secondary-action" onClick={refresh} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="hero-text">Loading customers...</p> : null}
      {error ? <p className="hero-text">{error}</p> : null}
      {!loading && !error ? (
        <div className="table-scroll table-scroll-wide">
          <CustomersTable
            customers={customers}
            deletingCustomerId={deletingCustomerId}
            onEdit={(customer) => navigate(`${customer.CustomerID}/edit`)}
            onDelete={(customer) => void handleDeleteCustomer(customer)}
          />
        </div>
      ) : null}
    </section>
  )
}
