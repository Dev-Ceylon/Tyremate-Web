import type { NotificationRecord } from "../models/notification"
import { AppModal } from "../../../shared/ui/modal/AppModal"

type NotificationListModalProps = {
  isOpen: boolean
  notifications: NotificationRecord[]
  loading: boolean
  onClose: () => void
  onSelectNotification: (notification: NotificationRecord) => Promise<void> | void
}

export function NotificationListModal({
  isOpen,
  notifications,
  loading,
  onClose,
  onSelectNotification,
}: NotificationListModalProps) {
  return (
    <AppModal isOpen={isOpen} title="Notifications" onClose={onClose}>
      <div className="notification-modal-content">
        {loading ? (
          <p className="table-empty">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="table-empty">No notifications available.</p>
        ) : (
          <div className="notification-list" role="list">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className="notification-list-item"
                type="button"
                onClick={() => onSelectNotification(notification)}
              >
                <div className="notification-list-item-header">
                  <strong>{notification.title}</strong>
                  <span className="notification-code">{notification.code}</span>
                </div>
                <p>{notification.description}</p>
                {notification.navigationPath ? (
                  <span className="notification-link-hint">
                    Open {notification.navigationPath}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  )
}
