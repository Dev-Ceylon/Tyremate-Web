const notificationRepo = require("../repositories/notificationRepository")
const notificationEvents = require("../events/notificationEvents")

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const normalizeRequiredText = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  return normalized
}

const normalizeNotificationId = (notificationId) => {
  const parsedId = Number(notificationId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid notification id is required")
  }

  return parsedId
}

const normalizeNotificationPayload = (payload = {}) => {
  return {
    code: normalizeRequiredText(payload.code, "Notification code"),
    title: normalizeRequiredText(payload.title, "Notification title"),
    description: normalizeRequiredText(payload.description, "Notification description"),
    navigationPath: normalizeText(payload.navigationPath)
  }
}

const emitNotificationEvent = (eventName, payload) => {
  try {
    notificationEvents.emit(eventName, {
      timestamp: new Date().toISOString(),
      ...payload
    })
  } catch (error) {
    console.error(`Failed to emit notification event: ${eventName}`, error)
  }
}

exports.getAllNotifications = () => {
  return notificationRepo.getAllNotifications()
}

exports.getNotificationById = (notificationId) => {
  const normalizedId = normalizeNotificationId(notificationId)
  const notification = notificationRepo.getNotificationById(normalizedId)

  if (!notification) {
    throw new Error("Notification not found")
  }

  return notification
}

exports.getNotificationByCode = (code) => {
  const normalizedCode = normalizeRequiredText(code, "Notification code")
  const notification = notificationRepo.getNotificationByCode(normalizedCode)

  if (!notification) {
    throw new Error("Notification not found")
  }

  return notification
}

exports.createNotification = (payload) => {
  const notification = normalizeNotificationPayload(payload)
  const existingNotification = notificationRepo.getNotificationByCode(notification.code)

  if (existingNotification) {
    return existingNotification
  }

  const createdNotification = notificationRepo.createNotification(notification)

  emitNotificationEvent("notificationCreated", {
    action: "created",
    notificationId: createdNotification.id,
    changedData: createdNotification,
    message: `Notification ${createdNotification.id} created successfully.`
  })

  return createdNotification
}

exports.updateNotification = (notificationId, payload) => {
  const normalizedId = normalizeNotificationId(notificationId)
  const notification = normalizeNotificationPayload(payload)
  const existingNotification = notificationRepo.getNotificationByCode(notification.code)

  if (existingNotification && existingNotification.id !== normalizedId) {
    throw new Error("Notification code already exists")
  }

  const updatedNotification = notificationRepo.updateNotification(normalizedId, notification)

  if (!updatedNotification) {
    throw new Error("Notification not found")
  }

  emitNotificationEvent("notificationUpdated", {
    action: "updated",
    notificationId: normalizedId,
    changedData: updatedNotification,
    message: `Notification ${normalizedId} updated successfully.`
  })

  return updatedNotification
}

exports.deleteNotification = (notificationId) => {
  const normalizedId = normalizeNotificationId(notificationId)
  const result = notificationRepo.deleteNotification(normalizedId)

  if (result.changes === 0) {
    throw new Error("Notification not found")
  }

  emitNotificationEvent("notificationDeleted", {
    action: "deleted",
    notificationId: normalizedId,
    changedData: { id: normalizedId },
    message: `Notification ${normalizedId} deleted successfully.`
  })

  return { success: true }
}

exports.deleteAllNotifications = () => {
  const result = notificationRepo.deleteAllNotifications()

  emitNotificationEvent("notificationsCleared", {
    action: "cleared",
    changedData: { deletedCount: result.changes },
    message: `Cleared ${result.changes} notifications.`
  })

  return result
}

exports.createNotificationsBatch = (payloads) => {
  if (!payloads.length) return []

  const normalized = payloads.map(normalizeNotificationPayload)

  const existingCodes = new Set(notificationRepo.getAllNotificationCodes())

  const toInsert = normalized.filter((n) => !existingCodes.has(n.code))

  if (toInsert.length === 0) return []

  const created = notificationRepo.createNotificationsBatch(toInsert)

  for (const notification of created) {
    emitNotificationEvent("notificationCreated", {
      action: "created",
      notificationId: notification.id,
      changedData: notification,
      message: `Notification ${notification.id} created successfully.`
    })
  }

  return created
}
