const inquiryService = require("../../../packages/services/inquiryService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("inquiries:getAll", {}, () => inquiryService.getInquiries())

registerIpcHandler("inquiries:getById", {}, (_event, inquiryId) => inquiryService.getInquiryById(inquiryId))

registerIpcHandler("inquiries:create", {}, (_event, payload) => inquiryService.createInquiry(payload))

registerIpcHandler("inquiries:update", {}, (_event, inquiryId, payload) => inquiryService.updateInquiry(inquiryId, payload))

registerIpcHandler("inquiries:delete", {}, (_event, inquiryId) => inquiryService.deleteInquiry(inquiryId))

registerIpcHandler("inquiries:updateStatus", {}, (_event, inquiryId, status) => inquiryService.updateInquiryStatus(inquiryId, status))

registerIpcHandler("inquiryReminders:add", {}, (_event, inquiryId, payload) => inquiryService.addReminder(inquiryId, payload))

registerIpcHandler("inquiryReminders:update", {}, (_event, reminderId, payload) => inquiryService.updateReminder(reminderId, payload))

registerIpcHandler("inquiryReminders:markDone", {}, (_event, reminderId, isDone) => inquiryService.markReminderDone(reminderId, isDone))

registerIpcHandler("inquiryReminders:delete", {}, (_event, reminderId) => inquiryService.deleteReminder(reminderId))
