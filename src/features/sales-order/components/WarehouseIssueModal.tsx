import { useEffect, useMemo, useState } from "react"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import type { SoWarehouseDispatch, SoWarehouseDispatchSite } from "../models/salesOrder"

interface WarehouseIssueModalProps {
  isOpen: boolean
  dispatch: SoWarehouseDispatch | null
  onClose: () => void
  onPrint: (sites: SoWarehouseDispatchSite[]) => void
  onDownload: (sites: SoWarehouseDispatchSite[]) => void
  isPrinting?: boolean
  isDownloadingPdf?: boolean
}

const siteKey = (site: SoWarehouseDispatchSite) => site.locationId ?? 0

export function WarehouseIssueModal({
  isOpen,
  dispatch,
  onClose,
  onPrint,
  onDownload,
  isPrinting = false,
  isDownloadingPdf = false,
}: WarehouseIssueModalProps) {
  const sites = useMemo(() => dispatch?.warehouses ?? [], [dispatch])
  const [selectedKeys, setSelectedKeys] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(sites.map(siteKey))
    }
  }, [isOpen, sites])

  const selectedSites = sites.filter((site) => selectedKeys.includes(siteKey(site)))
  const busy = isPrinting || isDownloadingPdf
  const allSelected = sites.length > 0 && selectedSites.length === sites.length
  const selectedUnits = selectedSites.reduce((sum, site) => sum + site.totalQty, 0)

  const toggleSite = (key: number) => {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  const toggleAll = () => {
    setSelectedKeys(allSelected ? [] : sites.map(siteKey))
  }

  return (
    <AppModal
      isOpen={isOpen}
      title={dispatch?.deliveryId ? "Delivery Warehouse Issue Note" : "Warehouse Issue Note"}
      onClose={onClose}
    >
      <div className="warehouse-issue">
        <div className="warehouse-issue-hero">
          <div className="warehouse-issue-hero-main">
            <span className="warehouse-issue-hero-label">Sales Order</span>
            <span className="warehouse-issue-hero-title">#{dispatch?.soId}</span>
            {dispatch?.deliveryId && (
              <span className="warehouse-issue-hero-sub">Delivery #{dispatch.deliveryId}</span>
            )}
            <span className="warehouse-issue-hero-sub">
              {dispatch?.customerName || "NA"}
              {dispatch?.customerCode ? ` (${dispatch.customerCode})` : ""}
            </span>
          </div>
          <div className="warehouse-issue-hero-stats">
            <div className="warehouse-issue-stat">
              <span className="warehouse-issue-stat-value">
                {dispatch?.deliveryDate || dispatch?.date || "—"}
              </span>
              <span className="warehouse-issue-stat-label">
                {dispatch?.deliveryId ? "Delivery Date" : "Date"}
              </span>
            </div>
            <div className="warehouse-issue-stat">
              <span className="warehouse-issue-stat-value">
                {selectedSites.length}/{sites.length}
              </span>
              <span className="warehouse-issue-stat-label">Warehouses</span>
            </div>
          </div>
        </div>

        <div className="warehouse-issue-toolbar">
          <label className="checkbox-field">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={busy} />
            <span>Select all warehouses</span>
          </label>
          <span className="warehouse-issue-toolbar-meta">
            {selectedSites.length} selected &middot; {selectedUnits} unit
            {selectedUnits !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="warehouse-issue-list">
          {sites.map((site) => {
            const key = siteKey(site)
            const selected = selectedKeys.includes(key)
            return (
              <label
                key={key}
                className={`warehouse-issue-card${selected ? " is-selected" : ""}${
                  busy ? " is-disabled" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="warehouse-issue-card-check"
                  checked={selected}
                  onChange={() => toggleSite(key)}
                  disabled={busy}
                />
                <div className="warehouse-issue-card-main">
                  <span className="warehouse-issue-card-name">{site.locationName || "Unassigned"}</span>
                  {site.locationCode ? (
                    <span className="warehouse-issue-card-code">{site.locationCode}</span>
                  ) : null}
                </div>
                <div className="warehouse-issue-card-stats">
                  <span className="warehouse-issue-chip">
                    {site.lines.length} line{site.lines.length !== 1 ? "s" : ""}
                  </span>
                  <span className="warehouse-issue-chip warehouse-issue-chip-qty">
                    {site.totalQty} unit{site.totalQty !== 1 ? "s" : ""}
                  </span>
                </div>
              </label>
            )
          })}
        </div>

        <p className="warehouse-issue-hint secondary-text">
          Each selected warehouse prints its own note listing the tyres leaving it for SO #
          {dispatch?.soId}{dispatch?.deliveryId ? `, Delivery #${dispatch.deliveryId}` : ""}.
        </p>

        <div className="modal-actions warehouse-issue-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => onPrint(selectedSites)}
            disabled={busy || selectedSites.length === 0}
          >
            {isPrinting ? "Printing..." : `Print (${selectedSites.length})`}
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => onDownload(selectedSites)}
            disabled={busy || selectedSites.length === 0}
          >
            {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </AppModal>
  )
}
