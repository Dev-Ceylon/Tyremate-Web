const reminderService = require("../../../packages/services/reminderService")
const soReminderService = require("../../../packages/services/soReminderService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("reminders:getAll", {}, () => reminderService.getReminders())

registerIpcHandler("reminders:getTodaysPending", {}, () => reminderService.getTodaysPendingReminders())

registerIpcHandler("reminders:getPending", { silent: true }, () => reminderService.getPendingReminders())

registerIpcHandler("reminders:getById", {}, (_event, reminderId) => reminderService.getReminderByID(reminderId))

registerIpcHandler("reminders:create", {}, (_event, payload) => reminderService.createReminder(payload))

registerIpcHandler("reminders:update", {}, (_event, reminderId, payload) => reminderService.updateReminder(reminderId, payload))

registerIpcHandler("reminders:markCompleted", {}, (_event, reminderId, isCompleted) => reminderService.markReminderCompleted(reminderId, isCompleted))

registerIpcHandler("reminders:delete", {}, (_event, reminderId) => reminderService.deleteReminder(reminderId))

registerIpcHandler("reminders:getDetails", {}, (_event, reminderId) => reminderService.getReminderDetails(reminderId))

registerIpcHandler("reminders:getSoIdBySOReminderId", {}, (_event, reminderId) => soReminderService.getSoIdByReminderId(reminderId))
