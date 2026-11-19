import type {
  NotificationCrudPayload,
  NotificationPayload,
  NotificationRecord,
  ReminderNotificationPayload,
} from "../models/notification"
import { notificationClient } from "./notificationClient"

export const notificationService = {
  getNotifications(): Promise<NotificationRecord[]> {
    return notificationClient.getNotifications()
  },

  getNotificationById(notificationId: number): Promise<NotificationRecord> {
    return notificationClient.getNotificationById(notificationId)
  },

  getNotificationByCode(code: string): Promise<NotificationRecord> {
    return notificationClient.getNotificationByCode(code)
  },

  createNotification(data: NotificationPayload): Promise<NotificationRecord> {
    return notificationClient.createNotification(data)
  },

  updateNotification(
    notificationId: number,
    data: NotificationPayload
  ): Promise<NotificationRecord> {
    return notificationClient.updateNotification(notificationId, data)
  },

  deleteNotification(notificationId: number): Promise<{ success: true }> {
    return notificationClient.deleteNotification(notificationId)
  },

  deleteAllNotifications(): Promise<any> {
    return notificationClient.deleteAllNotifications()
  },

  onNotificationChanged(
    callback: (payload: NotificationCrudPayload) => void
  ): (() => void) | void {
    return notificationClient.onNotificationChanged(callback)
  },

  onInquiryNotification(
    callback: (payload: ReminderNotificationPayload) => void
  ): (() => void) | void {
    return notificationClient.onInquiryNotification(callback)
  },
}
