import type {
  ReminderPayload,
  ReminderRecord,
  PendingReminderRecord,
  ReminderWithTyreExpiryDetails,
  ReminderWithBatteryDetails,
} from "../models/reminder"
import { reminderClient } from "./reminderClient"

export const reminderService = {
  getReminders(): Promise<ReminderRecord[]> {
    return reminderClient.getReminders()
  },

  getTodaysPendingReminders(): Promise<PendingReminderRecord[]> {
    return reminderClient.getTodaysPendingReminders()
  },

  getPendingReminders(): Promise<ReminderRecord[]> {
    return reminderClient.getPendingReminders()
  },

  getReminderById(reminderId: number): Promise<ReminderRecord> {
    return reminderClient.getReminderById(reminderId)
  },

  getReminderDetails(reminderId: number): Promise<any> {
    return reminderClient.getReminderDetails(reminderId)
  },

  getTyreExpiryReminderDetails(reminderId: number): Promise<ReminderWithTyreExpiryDetails> {
    return reminderClient.getReminderDetails(reminderId)
  },

  getBatteryReminderDetails(reminderId: number): Promise<ReminderWithBatteryDetails> {
    return reminderClient.getBatteryReminderDetails(reminderId)
  },

  syncBatteryReminders(): Promise<any> {
    return reminderClient.syncBatteryReminders()
  },

  createReminder(data: ReminderPayload): Promise<ReminderRecord> {
    return reminderClient.createReminder(data)
  },

  updateReminder(reminderId: number, data: ReminderPayload): Promise<ReminderRecord> {
    return reminderClient.updateReminder(reminderId, data)
  },

  markReminderCompleted(reminderId: number, isCompleted: boolean): Promise<ReminderRecord> {
    return reminderClient.markReminderCompleted(reminderId, isCompleted)
  },

  deleteReminder(reminderId: number): Promise<{ success: true }> {
    return reminderClient.deleteReminder(reminderId)
  },

  onReminderChanged(callback: (payload: any) => void): (() => void) | void {
    return reminderClient.onReminderChanged(callback)
  },

  getSoIdByChequeReminderId(chequeReminderId: number): Promise<number> {
    return reminderClient.getSoIdByChequeReminderId(
      chequeReminderId
    )
  },

  getSoIdBySOReminderId(reminderId: number): Promise<number | null> {
    return reminderClient.getSoIdBySOReminderId(reminderId)
  },
}