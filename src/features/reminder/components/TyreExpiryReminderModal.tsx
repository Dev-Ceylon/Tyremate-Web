import type { ReminderRecord, TyreExpiryReminderDetails } from "../models/reminder"
import { AppModal } from "../../../shared/ui/modal/AppModal"

type TyreExpiryReminderModalProps = {
  isOpen: boolean
  reminder: ReminderRecord | null
  details: TyreExpiryReminderDetails | null
  loading: boolean
  onClose: () => void
  onViewStock: () => void
}

function getDaysLeft(expiryDate?: string | null): number | null {
  if (!expiryDate) {
    return null
  }

  const expiry = new Date(`${expiryDate}T00:00:00`)
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const expiryUtc = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate())

  return Math.floor((expiryUtc - todayUtc) / 86400000)
}

function getExpiryStatus(daysLeft: number | null) {
  if (daysLeft === null) {
    return { label: "No data", tone: "na", badgeClass: "status-draft" }
  }

  if (daysLeft < 0) {
    return { label: "Expired", tone: "expired", badgeClass: "status-rejected" }
  }

  if (daysLeft <= 5) {
    return { label: "Expiring soon", tone: "expiring", badgeClass: "status-pending" }
  }

  return { label: "OK", tone: "ok", badgeClass: "status-completed" }
}

function getDaysMessage(daysLeft: number | null) {
  if (daysLeft === null) {
    return "Expiry date unknown"
  }

  if (daysLeft < 0) {
    const pastBy = Math.abs(daysLeft)
    return `Expired ${pastBy} day${pastBy === 1 ? "" : "s"} ago`
  }

  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
}

export function TyreExpiryReminderModal({
  isOpen,
  reminder,
  details,
  loading,
  onClose,
  onViewStock,
}: TyreExpiryReminderModalProps) {
  if (!isOpen || !reminder) {
    return null
  }

  const tyreLabel = [details?.Brand, details?.Size, details?.Pattern].filter(Boolean).join(" ")
  const daysLeft = getDaysLeft(details?.ExpiryDate)
  const status = getExpiryStatus(daysLeft)
  const specs = [details?.LL_SR, details?.PR, details?.SideWall].filter(Boolean)

  return (
    <AppModal
      isOpen={isOpen}
      title={`Tyre Expiry Reminder`}
      onClose={onClose}
    >
      {loading ? (
        <p className="hero-text">Loading tyre expiry details...</p>
      ) : (
        <div className="tyre-expiry-modal">
          <div className={`tyre-expiry-hero tyre-expiry-hero-${status.tone}`}>
            <div className="tyre-expiry-hero-info">
              <p className="eyebrow">Tyre Expiry Reminder</p>
              <h2>{tyreLabel || `Tyre #${details?.TyreID ?? "-"}`}</h2>

              <div className="tyre-expiry-tags">
                <span className="tyre-expiry-tag mono-text">{details?.DOT || "No DOT"}</span>
                {specs.map((spec) => (
                  <span key={spec} className="tyre-expiry-tag">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="tyre-expiry-hero-status">
              <span className={`status-badge ${status.badgeClass}`}>{status.label}</span>
              <strong className="tyre-expiry-days-left">{getDaysMessage(daysLeft)}</strong>
            </div>
          </div>

          <div className="tyre-expiry-details">
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Expiry Date</p>
              <p className="main-text">{details?.ExpiryDate || "—"}</p>
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Reminder Date</p>
              <p className="main-text">{reminder.Date || "Not Scheduled"}</p>
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Location</p>
              <p className="main-text">{details?.LocationName || "—"}</p>
              {details?.BranchName ? <p className="sub-text">Branch: {details.BranchName}</p> : null}
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Reminder ID</p>
              <p className="main-text mono-text">#{reminder.ID}</p>
            </div>
          </div>

          <div className="modal-section-actions">
            <button className="secondary-action" type="button" onClick={onClose}>
              Close
            </button>
            <button className="primary-action" type="button" onClick={onViewStock}>
              View Stock
            </button>
          </div>
        </div>
      )}
    </AppModal>
  )
}