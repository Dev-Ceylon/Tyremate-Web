import type { BatteryReminderDetails, ReminderRecord } from "../models/reminder"
import { AppModal } from "../../../shared/ui/modal/AppModal"
import { formatBatteryLabel } from "../../../shared/battery/models/batteryDisplay"
import { REMINDER_TYPE_CODES } from "../../../shared/constants/reminderTypeConstants"

type BatteryReminderModalProps = {
  isOpen: boolean
  reminder: ReminderRecord | null
  details: BatteryReminderDetails | null
  loading: boolean
  onClose: () => void
  onViewStock: () => void
  onMarkCompleted?: () => Promise<void>
  completing?: boolean
}

function getDaysLeft(dateStr?: string | null): number | null {
  if (!dateStr) {
    return null
  }

  const targetDate = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(targetDate.getTime())) {
    return null
  }

  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const targetUtc = Date.UTC(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  return Math.floor((targetUtc - todayUtc) / 86400000)
}

function getReminderMeta(typeCode?: string, daysLeft: number | null = null) {
  if (typeCode === REMINDER_TYPE_CODES.BATTERY_RECHARGE) {
    if (daysLeft === null) {
      return {
        title: "Battery Maintenance Recharge Reminder",
        eyebrow: "Recharge Reminder",
        label: "Schedule Recharge",
        tone: "na",
        badgeClass: "status-draft",
        advice: "Warehouse stock requires periodic maintenance charging every 90 days to prevent sulfation.",
      }
    }
    if (daysLeft < 0) {
      return {
        title: "Battery Maintenance Recharge Reminder",
        eyebrow: "Recharge Overdue",
        label: "Recharge Overdue",
        tone: "expired",
        badgeClass: "status-rejected",
        advice: `Recharge is overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}. Inspect open-circuit voltage and apply trickle charge immediately.`,
      }
    }
    if (daysLeft <= 7) {
      return {
        title: "Battery Maintenance Recharge Reminder",
        eyebrow: "Recharge Due Soon",
        label: "Recharge Due Soon",
        tone: "expiring",
        badgeClass: "status-pending",
        advice: "Maintenance recharge due within 7 days. Plan recharge cycle before stock is dispatched.",
      }
    }
    return {
      title: "Battery Maintenance Recharge Reminder",
      eyebrow: "Recharge Scheduled",
      label: "Scheduled",
      tone: "ok",
      badgeClass: "status-completed",
      advice: "Periodic recharge is scheduled within recommended maintenance interval.",
    }
  }

  if (typeCode === REMINDER_TYPE_CODES.BATTERY_WARRANTY) {
    if (daysLeft === null) {
      return {
        title: "Battery Warranty Reminder",
        eyebrow: "Warranty Reminder",
        label: "No warranty data",
        tone: "na",
        badgeClass: "status-draft",
        advice: "Manufacturer warranty timeline follow-up.",
      }
    }
    if (daysLeft < 0) {
      return {
        title: "Battery Warranty Reminder",
        eyebrow: "Warranty Expired",
        label: "Warranty Expired",
        tone: "expired",
        badgeClass: "status-rejected",
        advice: `Manufacturer warranty ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago. Verify warranty claims or terms.`,
      }
    }
    if (daysLeft <= 30) {
      return {
        title: "Battery Warranty Reminder",
        eyebrow: "Warranty Ending Soon",
        label: "Warranty Ending",
        tone: "expiring",
        badgeClass: "status-pending",
        advice: "Manufacturer warranty expires within 30 days. Confirm claim submissions or stock inspections.",
      }
    }
    return {
      title: "Battery Warranty Reminder",
      eyebrow: "Warranty Valid",
      label: "Warranty Active",
      tone: "ok",
      badgeClass: "status-completed",
      advice: "Manufacturer warranty is currently active.",
    }
  }

  // Default: Battery Expiry (Shelf-Life)
  if (daysLeft === null) {
    return {
      title: "Battery Shelf-Life Expiry Reminder",
      eyebrow: "Battery Expiry Reminder",
      label: "No Expiry Data",
      tone: "na",
      badgeClass: "status-draft",
      advice: "Expiry date not recorded.",
    }
  }
  if (daysLeft < 0) {
    return {
      title: "Battery Shelf-Life Expiry Reminder",
      eyebrow: "Battery Expired",
      label: "Expired",
      tone: "expired",
      badgeClass: "status-rejected",
      advice: `Battery batch expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago. Isolate stock for inspection or disposal.`,
    }
  }
  if (daysLeft <= 30) {
    return {
      title: "Battery Shelf-Life Expiry Reminder",
      eyebrow: "Expiring Soon",
      label: "Expiring Soon",
      tone: "expiring",
      badgeClass: "status-pending",
      advice: "Battery shelf-life ending within 30 days. Prioritize batch for immediate customer orders or transfers.",
    }
  }
  return {
    title: "Battery Shelf-Life Expiry Reminder",
    eyebrow: "Shelf-Life OK",
    label: "OK",
    tone: "ok",
    badgeClass: "status-completed",
    advice: "Battery shelf-life is within acceptable limits.",
  }
}

function getDaysMessage(daysLeft: number | null) {
  if (daysLeft === null) {
    return "Date not specified"
  }
  if (daysLeft < 0) {
    const pastBy = Math.abs(daysLeft)
    return `Overdue by ${pastBy} day${pastBy === 1 ? "" : "s"}`
  }
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
}

export function BatteryReminderModal({
  isOpen,
  reminder,
  details,
  loading,
  onClose,
  onViewStock,
  onMarkCompleted,
  completing = false,
}: BatteryReminderModalProps) {
  if (!isOpen || !reminder) {
    return null
  }

  const typeCode = reminder.ReminderTypeCode
  const daysLeft = getDaysLeft(details?.ExpiryDate)
  const meta = getReminderMeta(typeCode, daysLeft)

  const batteryLabel = formatBatteryLabel(
    {
      Brand: details?.Brand,
      Model: details?.Model,
      Capacity: details?.Capacity,
      Voltage: details?.Voltage,
      Application: details?.Application,
    },
    { preset: "full" }
  )

  return (
    <AppModal isOpen={isOpen} title={meta.title} onClose={onClose}>
      {loading ? (
        <p className="hero-text">Loading battery reminder details...</p>
      ) : (
        <div className="tyre-expiry-modal">
          <div className={`tyre-expiry-hero tyre-expiry-hero-${meta.tone}`}>
            <div className="tyre-expiry-hero-info">
              <p className="eyebrow">{meta.eyebrow}</p>
              <h2>{batteryLabel || `Battery #${details?.BatteryID ?? "-"}`}</h2>

              <div className="tyre-expiry-tags">
                <span className="tyre-expiry-tag mono-text">
                  Batch: {details?.BatchCode || "Default"}
                </span>
                {details?.Capacity ? (
                  <span className="tyre-expiry-tag">{details.Capacity}</span>
                ) : null}
                {details?.Voltage ? (
                  <span className="tyre-expiry-tag">{details.Voltage}</span>
                ) : null}
                {details?.Application ? (
                  <span className="tyre-expiry-tag">{details.Application}</span>
                ) : null}
                {details?.WarrantyMonths ? (
                  <span className="tyre-expiry-tag">
                    Warranty: {details.WarrantyMonths} Mos
                  </span>
                ) : null}
              </div>
            </div>

            <div className="tyre-expiry-hero-status">
              <span className={`status-badge ${meta.badgeClass}`}>{meta.label}</span>
              <strong className="tyre-expiry-days-left">{getDaysMessage(daysLeft)}</strong>
            </div>
          </div>

          <div className="info-panel panel" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <p className="section-label">Recommendation</p>
            <p className="main-text">{meta.advice}</p>
          </div>

          <div className="tyre-expiry-details">
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Target / Due Date</p>
              <p className="main-text">{details?.ExpiryDate || "—"}</p>
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Manufacture Date</p>
              <p className="main-text">{details?.MfgDate || "—"}</p>
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Batch Stock</p>
              <p className="main-text">
                {details?.BatchQty !== null && details?.BatchQty !== undefined
                  ? `${details.BatchQty} units in lot`
                  : "—"}
              </p>
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Location</p>
              <p className="main-text">{details?.LocationName || "—"}</p>
              {details?.BranchName ? (
                <p className="sub-text">Branch: {details.BranchName}</p>
              ) : null}
            </div>
            <div className="tyre-expiry-detail-item">
              <p className="section-label">Scheduled Date</p>
              <p className="main-text">{reminder.Date || "Not Scheduled"}</p>
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
            {onMarkCompleted ? (
              <button
                className="secondary-action"
                type="button"
                onClick={() => void onMarkCompleted()}
                disabled={completing}
              >
                {completing ? "Completing..." : "Mark Completed"}
              </button>
            ) : null}
            <button className="primary-action" type="button" onClick={onViewStock}>
              View Stock
            </button>
          </div>
        </div>
      )}
    </AppModal>
  )
}
