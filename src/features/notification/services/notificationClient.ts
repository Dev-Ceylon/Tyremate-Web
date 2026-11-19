import type {
  NotificationCrudPayload,
  NotificationPayload,
  NotificationRecord,
  ReminderNotificationPayload,
} from "../models/notification"

export const notificationClient = {
  getNotifications(): Promise<NotificationRecord[]> {
    return window.api.notifications.getNotifications()
  },

  getNotificationById(notificationId: number): Promise<NotificationRecord> {
    return window.api.notifications.getNotificationById(notificationId)
  },

  getNotificationByCode(code: string): Promise<NotificationRecord> {
    return window.api.notifications.getNotificationByCode(code)
  },

  createNotification(data: NotificationPayload): Promise<NotificationRecord> {
    return window.api.notifications.createNotification(data)
  },

  updateNotification(
    notificationId: number,
    data: NotificationPayload
  ): Promise<NotificationRecord> {
    return window.api.notifications.updateNotification(notificationId, data)
  },

  deleteNotification(notificationId: number): Promise<{ success: true }> {
    return window.api.notifications.deleteNotification(notificationId)
  },

  deleteAllNotifications(): Promise<any> {
    return window.api.notifications.deleteAllNotifications()
  },

  onNotificationChanged(
    callback: (payload: NotificationCrudPayload) => void
  ): (() => void) | void {
    return window.api.notificationEvents.onChanged(callback)
  },

  onInquiryNotification(
    callback: (payload: ReminderNotificationPayload) => void
  ): (() => void) | void {
    return window.api.notificationEvents.inquiryNotification(callback)
  },
}
