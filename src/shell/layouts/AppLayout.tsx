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
import { DefaultPasswordBanner } from "../web/DefaultPasswordBanner"
import { BrandLogo } from "../web/BrandLogo"
import { installTableCellWrapping } from "../web/tableCells"

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
              { label: "Batteries", to: "/master-data/batteries" },
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
