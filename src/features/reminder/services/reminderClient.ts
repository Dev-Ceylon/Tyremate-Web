import type {
  ReminderPayload,
  ReminderRecord,
  PendingReminderRecord,
} from "../models/reminder"

export const reminderClient = {
  getReminders(): Promise<ReminderRecord[]> {
    return window.api.reminders.getReminders()
  },

  getTodaysPendingReminders(): Promise<PendingReminderRecord[]> {
    return window.api.reminders.getTodaysPendingReminders()
  },

  getPendingReminders(): Promise<ReminderRecord[]> {
    return window.api.reminders.getPendingReminders()
  },

  getReminderById(reminderId: number): Promise<ReminderRecord> {
    return window.api.reminders.getReminderById(reminderId)
  },

  getReminderDetails(reminderId: number): Promise<any> {
    return window.api.reminders.getReminderDetails(reminderId)
  },


  createReminder(data: ReminderPayload): Promise<ReminderRecord> {
    return window.api.reminders.createReminder(data)
  },

  updateReminder(reminderId: number, data: ReminderPayload): Promise<ReminderRecord> {
    return window.api.reminders.updateReminder(reminderId, data)
  },

  markReminderCompleted(reminderId: number, isCompleted: boolean): Promise<ReminderRecord> {
    return window.api.reminders.markReminderCompleted(reminderId, isCompleted)
  },

  deleteReminder(reminderId: number): Promise<{ success: true }> {
    return window.api.reminders.deleteReminder(reminderId)
  },

  onReminderChanged( callback: (payload: any) => void): (() => void) | void {
    return window.api.reminderEvents.onChanged(callback)
  },


  getSoIdByChequeReminderId(chequeReminderId: number): Promise<number> {
    return window.api.chequePayments
      .getSoIdByChequeReminderId(
        chequeReminderId
      )
  },

  getSoIdBySOReminderId(reminderId: number): Promise<number | null> {
    return window.api.reminders.getSoIdBySOReminderId(reminderId)
  },

  getBatteryReminderDetails(reminderId: number): Promise<any> {
    return window.api.reminders.getReminderDetails(reminderId)
  },

  syncBatteryReminders(): Promise<any> {
    return window.api.reminders.syncBatteryReminders()
  },



}