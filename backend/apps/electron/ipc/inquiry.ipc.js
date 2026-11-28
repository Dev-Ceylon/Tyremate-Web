const inquiryService = require("../../../packages/services/inquiryService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("inquiries:getAll", { permission: "inquiry.view" }, () => inquiryService.getInquiries())

registerIpcHandler("inquiries:getById", { permission: "inquiry.view" }, (_event, inquiryId) => inquiryService.getInquiryById(inquiryId))

registerServiceHandler("inquiries:create", { permission: "inquiry.create" }, inquiryService, "createInquiry")

registerIpcHandler("inquiries:update", { permission: "inquiry.edit" }, (_event, inquiryId, payload) => inquiryService.updateInquiry(inquiryId, payload))

registerIpcHandler("inquiries:delete", { permission: "inquiry.delete" }, (_event, inquiryId) => inquiryService.deleteInquiry(inquiryId))

registerIpcHandler("inquiries:updateStatus", { permission: "inquiry.edit" }, (_event, inquiryId, status) => inquiryService.updateInquiryStatus(inquiryId, status))

registerIpcHandler("inquiryReminders:add", { permission: "inquiry.edit" }, (_event, inquiryId, payload) => inquiryService.addReminder(inquiryId, payload))

registerIpcHandler("inquiryReminders:update", { permission: "inquiry.edit" }, (_event, reminderId, payload) => inquiryService.updateReminder(reminderId, payload))

registerIpcHandler("inquiryReminders:markDone", { permission: "inquiry.edit" }, (_event, reminderId, isDone) => inquiryService.markReminderDone(reminderId, isDone))

registerIpcHandler("inquiryReminders:delete", { permission: "inquiry.delete" }, (_event, reminderId) => inquiryService.deleteReminder(reminderId))
