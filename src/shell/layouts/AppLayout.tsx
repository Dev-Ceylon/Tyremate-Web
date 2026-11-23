import { useCallback, useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation } from "@/lib/router"
import { useAuthContext } from "../../features/auth/hooks/AuthProvider"
import { NotificationListModal } from "../../features/notification/components/NotificationListModal"
import { useNotificationPanel } from "../../features/notification/hooks/useNotificationPanel"
import { useReminderContext } from "../../features/reminder/hooks/useReminderContext"
import { PrinterModal } from "../../features/printer/components/PrinterModal"
import { NavDropdown } from "../../shared/ui/navDropdown/NavDropdown"
import { Icons } from "../../shared/ui/icons/icon"
import PermissionGate from "../../shared/components/PermissionGate"
import { useAuthorization } from "../../shared/hooks/auth/useAuthorization"
import { DefaultPasswordBanner } from "../web/DefaultPasswordBanner"
import { BrandLogo } from "../web/BrandLogo"
import { installTableCellWrapping } from "../web/tableCells"

export default function AppLayout() {
  const { logout, user } = useAuthContext()
  const { hasPermission, hasAnyPermission } = useAuthorization()
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
  // Below 1024px the navigation lives in a slide-in drawer.
  const [isMenuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Keep short table values (dates, codes, amounts) on one line app-wide.
  useEffect(() => installTableCellWrapping(document.body), [])

  useEffect(() => {
    if (!isMenuOpen) return
    document.body.classList.add("tm-menu-open")
    navRef.current?.querySelector<HTMLElement>("a, button")?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.classList.remove("tm-menu-open")
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isMenuOpen])

  return (
    <div className="tm-app">
      <header className={`top-nav panel${isMenuOpen ? " is-menu-open" : ""}`}>
        <NavLink className="top-nav-brand" to="/" aria-label="TyreMate home">
          <BrandLogo size={30} />
          <span>TyreMate</span>
        </NavLink>

        <nav
          ref={navRef}
          id="main-navigation"
          className="top-nav-links"
          aria-label="Main navigation"
        >
          <div className="top-nav-drawer-header">
            <span className="top-nav-drawer-title">Menu</span>
            <button type="button" className="icon-button" aria-label="Close menu" onClick={closeMenu}>
              <Icons.X size={20} />
            </button>
          </div>
          <NavLink className="ghost-link" to="/">
            Home
          </NavLink>
          {hasPermission("inquiry.view") && !hasAnyPermission("so.view", "dag.view", "violations.view") ? (
            <NavLink className="ghost-link" to="/inquiries">
              Inquiries
            </NavLink>
          ) : (
            <NavDropdown
              label="Customer Sales"
              items={[
                hasPermission("customers.view") && { label: "Customer Master", to: "/master-data/customers" },
                hasPermission("inquiry.view") && { label: "Inquiries", to: "/inquiries" },
                hasPermission("so.view") && { label: "SO", to: "/sales-orders" },
                hasPermission("so.view") && { label: "Sales Returns", to: "/sales-returns" },
                hasPermission("violations.view") && { label: "Policy Violations", to: "/violations" },
                hasPermission("dag.view") && { label: "DAG", to: "/dag" },
                hasPermission("so.view") && { label: "Used Tyre Sales", to: "/used-tyres" },
                hasPermission("reports.view") && { label: "Sales Reports", to: "/reports/sales" },
              ].filter(Boolean) as any[]}
            />
          )}
          <PermissionGate anyPermission={["suppliers.view", "reports.view"]}>
            <NavDropdown
              label="Supplier Procurement"
              items={[
                hasPermission("suppliers.view") && { label: "Supplier Master", to: "/master-data/suppliers" },
                hasPermission("reports.view") && { label: "Purchase Order Reports", to: "/reports/purchase-orders" },
              ].filter(Boolean) as any[]}
            />
          </PermissionGate>
          <PermissionGate anyPermission={["inventory.manage", "suppliers.view", "customers.manage"]}>
            <NavLink className="ghost-link" to="/master-data">
              Master Data
            </NavLink>
            <NavDropdown
              label="Master Record"
              items={[
                hasPermission("suppliers.view") && { label: "Suppliers", to: "/master-data/suppliers" },
                hasPermission("suppliers.manage") && { label: "Contractors", to: "/master-data/contractors" },
                hasPermission("customers.view") && { label: "Customers", to: "/master-data/customers" },
                hasPermission("inventory.manage") && { label: "Branches", to: "/master-data/branches" },
                hasPermission("inventory.view") && { label: "Tyres", to: "/master-data/tyres" },
                hasPermission("inventory.view") && { label: "Batteries", to: "/master-data/batteries" },
                hasPermission("inventory.view") && { label: "Consumables", to: "/master-data/consumables" },
                hasPermission("inventory.manage") && { label: "Storage Locations", to: "/master-data/storage-locations" },
                hasPermission("settings.manage") && { label: "Bank Details", to: "/master-data/bank-details" },
              ].filter(Boolean) as any[]}
            />
          </PermissionGate>
          <PermissionGate permission="po.view">
            <NavLink className="ghost-link" to="/purchase-orders">
              Purchase Orders
            </NavLink>
          </PermissionGate>
          <PermissionGate permission="po.view">
            <NavLink className="ghost-link" to="/goods-receipts">
              Pending to GRN
            </NavLink>
          </PermissionGate>
          <PermissionGate anyPermission={["so.view", "po.view"]}>
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
          </PermissionGate>
          <PermissionGate anyPermission={["so.view", "dag.view"]}>
            <NavDropdown
              label="GatePass"
              items={[
                hasPermission("so.view") && { label: "Gate Pass", to: "/gatepass" },
                hasPermission("dag.view") && { label: "DAG Gate Pass", to: "/gatepass/dag" },
              ].filter(Boolean) as any[]}
            />
          </PermissionGate>
          <PermissionGate permission="inventory.manage">
            <NavLink className="ghost-link" to="/stock-snapshot">
              Stock Snapshot
            </NavLink>
          </PermissionGate>
          <PermissionGate anyPermission={["reports.view", "settings.manage"]}>
            <NavLink className="ghost-link" to="/opex">
              Opex
            </NavLink>
          </PermissionGate>
          <PermissionGate permission="other.view">
            <NavDropdown
              label="Other"
              items={[
                { label: "Other Service", to: "/other-service" },
                { label: "Other Payment", to: "/other-payment" },
              ]}
            />
          </PermissionGate>
          <PermissionGate permission="invoice.view">
            <NavLink className="ghost-link" to="/invoices">
              Invoices
            </NavLink>
          </PermissionGate>
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
          <button className="secondary-action top-nav-drawer-signout" onClick={logout} type="button">
            Sign Out
          </button>
        </nav>



        <div className="top-nav-actions">

          <NavLink className="ghost-link" to="/help" aria-label="Help">
            <Icons.HelpCircle size={18} />
          </NavLink>

          <NavLink className="ghost-link top-nav-account" to="/account" title={user?.username} aria-label="My account">
            <Icons.User size={18} />
            <span className="top-nav-account-name">{user?.displayName || user?.username || "Account"}</span>
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
            className="secondary-action top-nav-signout"
            onClick={logout}
            type="button"
          >
            Sign Out
          </button>

          <button
            ref={menuButtonRef}
            className="icon-button top-nav-menu-toggle"
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <Icons.X size={22} /> : <Icons.Menu size={22} />}
          </button>

        </div>
      </header>
      {isMenuOpen ? <div className="top-nav-backdrop" aria-hidden="true" onClick={closeMenu} /> : null}

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
    </div>
  )
}
