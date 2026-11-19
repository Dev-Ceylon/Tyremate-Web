const notificationService = require("../../../packages/services/notificationService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("notifications:getAll", {}, () => notificationService.getAllNotifications())

registerIpcHandler("notifications:getById", {}, (_event, notificationId) => notificationService.getNotificationById(notificationId))

registerIpcHandler("notifications:getByCode", {}, (_event, code) => notificationService.getNotificationByCode(code))

registerIpcHandler("notifications:create", {}, (_event, payload) => notificationService.createNotification(payload))

registerIpcHandler("notifications:update", {}, (_event, notificationId, payload) => notificationService.updateNotification(notificationId, payload))

registerIpcHandler("notifications:delete", {}, (_event, notificationId) => notificationService.deleteNotification(notificationId))

registerIpcHandler("notifications:deleteAll", {}, () => notificationService.deleteAllNotifications())
