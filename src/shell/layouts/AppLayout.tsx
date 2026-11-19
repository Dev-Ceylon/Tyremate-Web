import { useState } from "react"
import { NavLink, Outlet } from "@/lib/router"
import { useAuthContext } from "../../features/auth/hooks/AuthProvider"
import { NotificationListModal } from "../../features/notification/components/NotificationListModal"
import { useNotificationPanel } from "../../features/notification/hooks/useNotificationPanel"
import { useReminderContext } from "../../features/reminder/hooks/useReminderContext"
import { PrinterModal } from "../../features/printer/components/PrinterModal"
import { NavDropdown } from "../../shared/ui/navDropdown/NavDropdown"
import { Icons } from "../../shared/ui/icons/icon"
import PermissionGate from "../../shared/components/PermissionGate"
import { DefaultPasswordBanner } from "../web/DefaultPasswordBanner"

export default function AppLayout() {
  const { logout, user } = useAuthContext()
  const { pendingCount, loading } = useReminderContext()
  const {
    closeNotifications,
    handleNotificationSelect,
    isNotificationLoading,
    isNotificationModalOpen,
    notifications,
    openNotifications,
  } = useNotificationPanel()
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)

  return (
    <>
      <header className="top-nav panel">
        <nav className="top-nav-links" aria-label="Main navigation">
          <NavLink className="ghost-link" to="/">
            Home
          </NavLink>
          <NavDropdown
            label="Customer Sales"
            items={[
              { label: "Customer Master", to: "/master-data/customers" },
              { label: "Inquiries", to: "/inquiries" },
              { label: "SO", to: "/sales-orders" },
              { label: "Sales Returns", to: "/sales-returns" },
              { label: "Policy Violations", to: "/violations" },
              { label: "DAG", to: "/dag" },
              { label: "Used Tyre Sales", to: "/used-tyres" },
              { label: "Sales Reports", to: "/reports/sales" },
            ]}
          />
          <NavDropdown
            label="Supplier Procurement"
            items={[
              { label: "Supplier Master", to: "/master-data/suppliers" },
              { label: "Purchase Order Reports", to: "/reports/purchase-orders" },
            ]}
          />
          <NavLink className="ghost-link" to="/master-data">
            Master Data
          </NavLink>
          <NavDropdown
            label="Master Record"
            items={[
              { label: "Suppliers", to: "/master-data/suppliers" },
              { label: "Contractors", to: "/master-data/contractors" },
              { label: "Customers", to: "/master-data/customers" },
              { label: "Branches", to: "/master-data/branches" },
              { label: "Tyres", to: "/master-data/tyres" },
              { label: "Consumables", to: "/master-data/consumables" },
              { label: "Storage Locations", to: "/master-data/storage-locations" },
              { label: "Bank Details", to: "/master-data/bank-details" },
            ]}
          />
          {/* <NavLink className="ghost-link" to="/products">
            Products
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/suppliers">
            Suppliers
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/contractors">
            Contractors
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/customers">
            Customers
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/branches">
            Branches
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/tyres">
            Tyres
          </NavLink> */}
          {/* <NavLink className="ghost-link" to="/master-data/bank-details">
            Bank Details
          </NavLink> */}
          <NavLink className="ghost-link" to="/purchase-orders">
            Purchase Orders
          </NavLink>
          <NavLink className="ghost-link" to="/goods-receipts">
            Pending to GRN
          </NavLink>
          <NavLink
            className="ghost-link reminder-link"
            to="/reminders"
          >
            Reminders
            {!loading && pendingCount > 0 && (
              <span className="reminder-badge">
                {pendingCount}
              </span>
            )}
          </NavLink>
          <NavDropdown
            label="GatePass"
            items={[
              { label: "Gate Pass", to: "/gatepass" },
              { label: "DAG Gate Pass", to: "/gatepass/dag" },
            ]}
          />
          <NavLink className="ghost-link" to="/stock-snapshot">
            Stock Snapshot
          </NavLink>
          <NavLink className="ghost-link" to="/opex">
            Opex
          </NavLink>
          <NavDropdown
            label="Other"
            items={[
              { label: "Other Service", to: "/other-service" },
              { label: "Other Payment", to: "/other-payment" },
            ]}
          />
          <NavLink className="ghost-link" to="/invoices">
            Invoices
          </NavLink>
          <PermissionGate anyPermission={["settings.manage", "user.manage"]}>
            <NavLink className="ghost-link" to="/admin">
              Admin
            </NavLink>
          </PermissionGate>
          <PermissionGate permission="reports.view">
            <NavDropdown
              label="Reports"
              items={[
                { label: "Sales Reports", to: "/reports/sales" },
                { label: "Purchase Order Reports", to: "/reports/purchase-orders" },
                { label: "Daily Cash Flow Reports", to: "/reports/cash-flow" },
              ]}
            />
          </PermissionGate>
        </nav>



        <div className="top-nav-actions">

          <NavLink className="ghost-link" to="/help" aria-label="Help">
            <Icons.HelpCircle size={18} />
          </NavLink>

          <NavLink className="ghost-link" to="/account" title={user?.username}>
            {user?.displayName || user?.username || "Account"}
          </NavLink>

          <button
            className="icon-button"
            type="button"
            aria-label="Printers"
            onClick={() => setPrinterModalOpen(true)}
          >
            <Icons.Printer size={20} />
          </button>

          <button
            className="icon-button"
            type="button"
            aria-label="Notifications"
            onClick={() => {
              void openNotifications()
            }}
          >
            <Icons.Bell size={20} />
            {notifications.length > 0 ? (
              <span className="notification-badge">
                {notifications.length}
              </span>
            ) : null}
          </button>

          <button
            className="secondary-action"
            onClick={logout}
            type="button"
          >
            Sign Out
          </button>

        </div>
      </header>

      {user?.usingDefaultPassword ? <DefaultPasswordBanner /> : null}

      <Outlet />

      <NotificationListModal
        isOpen={isNotificationModalOpen}
        notifications={notifications}
        loading={isNotificationLoading}
        onClose={closeNotifications}
        onSelectNotification={handleNotificationSelect}
      />

      <PrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setPrinterModalOpen(false)}
      />
    </>
  )
}
