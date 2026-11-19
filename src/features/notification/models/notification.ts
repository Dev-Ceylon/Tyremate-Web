export interface ReminderNotification {
  ReminderId: number
  reminderDate: string
  reminderTypeCode: string
  inquiryDetails?: InquiryDetails
  chequeDetails?: ChequeDetails
  reminderNote?: string
}

export interface NotificationPayload {
  code: string
  title: string
  description: string
  navigationPath?: string | null
}

export interface NotificationRecord {
  id: number
  code: string
  title: string
  description: string
  navigationPath: string | null
}

export interface NotificationCrudPayload {
  action: "created" | "updated" | "deleted" | "cleared"
  timestamp: string
  notificationId?: number
  changedData: NotificationRecord | { id: number } | { deletedCount: number }
  message: string
}

export interface InquiryDetails {
  InquiryID: number
  CustomerName: string
  CustomerCode: string
}

export interface ChequeDetails {
  SoID: number
}


export interface ReminderNotificationPayload {
  action: string
  count: number
  reminders: ReminderNotification[]
  existingNotifications: NotificationRecord[]
  timestamp: string
}
