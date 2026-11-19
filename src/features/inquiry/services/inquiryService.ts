import type { InquiryPayload, InquiryReminderPayload } from "../models/inquiry"
import { inquiryClient } from "./inquiryClient"

export const inquiryService = {
  getInquiries() {
    return inquiryClient.getAll()
  },

  getInquiryById(inquiryId: number) {
    return inquiryClient.getById(inquiryId)
  },

  createInquiry(data: InquiryPayload) {
    return inquiryClient.create(data)
  },

  updateInquiry(inquiryId: number, data: InquiryPayload) {
    return inquiryClient.update(inquiryId, data)
  },

  deleteInquiry(inquiryId: number) {
    return inquiryClient.remove(inquiryId)
  },

  updateInquiryStatus(inquiryId: number, status: number) {
    return inquiryClient.updateStatus(inquiryId, status)
  },

  addReminder(inquiryId: number, data: InquiryReminderPayload) {
    return inquiryClient.addReminder(inquiryId, data)
  },

  updateReminder(reminderId: number, data: InquiryReminderPayload) {
    return inquiryClient.updateReminder(reminderId, data)
  },

  markReminderDone(reminderId: number, isDone: boolean) {
    return inquiryClient.markReminderDone(reminderId, isDone)
  },

  deleteReminder(reminderId: number) {
    return inquiryClient.removeReminder(reminderId)
  },
}