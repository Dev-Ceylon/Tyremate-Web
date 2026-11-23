import type { ReactNode } from "react"
import { Link, Navigate, useLocation } from "@/lib/router"
import { useAuthorization } from "@/shared/hooks/auth/useAuthorization"

type MasterDataEntityPageLayoutProps = {
  title: string
  listDescription: string
  createDescription: string
  editDescription: string
  listPath: string
  insertLabel: string
  backLabel: string
  children: ReactNode
}

export default function MasterDataEntityPageLayout({
  title,
  listDescription,
  createDescription,
  editDescription,
  listPath,
  insertLabel,
  backLabel,
  children,
}: MasterDataEntityPageLayoutProps) {
  const location = useLocation()
  const { hasAnyPermission } = useAuthorization()
  const isCreateRoute = location.pathname.endsWith("/new")
  const isEditRoute = location.pathname.endsWith("/edit")
  const isFormRoute = isCreateRoute || isEditRoute

  const canAccessMasterData = hasAnyPermission(
    "inventory.manage",
    "inventory.view",
    "suppliers.view",
    "suppliers.manage",
    "customers.view",
    "customers.manage",
    "settings.manage",
  )

  if (!canAccessMasterData) {
    return <Navigate to="/inquiries" replace />
  }

  const description = isCreateRoute
    ? createDescription
    : isEditRoute
      ? editDescription
      : listDescription

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Master Data</p>
          <h1>{title}</h1>
          <p className="hero-text">{description}</p>
        </div>

        <div className="header-actions">
          <Link className="ghost-link" to="/master-data">
            Back to Master Data
          </Link>
          {isFormRoute ? (
            <Link className="secondary-action" to={listPath}>
              {backLabel}
            </Link>
          ) : (
            hasAnyPermission("inventory.manage", "suppliers.manage", "customers.manage", "settings.manage") && (
              <Link className="primary-action" to="new">
                {insertLabel}
              </Link>
            )
          )}
        </div>
      </section>

      {children}
    </main>
  )
}
