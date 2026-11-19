import type { InquiryPayload, InquiryRecord, InquiryReminderPayload, InquiryReminderRecord } from "../models/inquiry"

export const inquiryClient = {
  getAll(): Promise<InquiryRecord[]> {
    return window.api.inquiries.getInquiries()
  },

  getById(inquiryId: number): Promise<InquiryRecord> {
    return window.api.inquiries.getInquiryById(inquiryId)
  },

  create(data: InquiryPayload): Promise<InquiryRecord> {
    return window.api.inquiries.createInquiry(data)
  },

  update(inquiryId: number, data: InquiryPayload): Promise<InquiryRecord> {
    return window.api.inquiries.updateInquiry(inquiryId, data)
  },

  remove(inquiryId: number): Promise<{ success: boolean }> {
    return window.api.inquiries.deleteInquiry(inquiryId)
  },

  updateStatus(inquiryId: number, status: number): Promise<InquiryRecord> {
    return window.api.inquiries.updateInquiryStatus(inquiryId, status)
  },

  addReminder(inquiryId: number, data: InquiryReminderPayload): Promise<InquiryReminderRecord> {
    return window.api.inquiries.addReminder(inquiryId, data)
  },

  updateReminder(reminderId: number, data: InquiryReminderPayload): Promise<InquiryReminderRecord> {
    return window.api.inquiries.updateReminder(reminderId, data)
  },

  markReminderDone(reminderId: number, isDone: boolean): Promise<InquiryReminderRecord> {
    return window.api.inquiries.markReminderDone(reminderId, isDone)
  },

  removeReminder(reminderId: number): Promise<{ success: boolean }> {
    return window.api.inquiries.deleteReminder(reminderId)
  },
}