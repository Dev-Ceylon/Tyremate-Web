const otherServiceAuditLogRepo = require("../repositories/otherServiceAuditLogRepository")

const toJson = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  try {
    return JSON.stringify(value)
  } catch (error) {
    return null
  }
}

exports.snapshot = toJson

exports.recordOSAction = ({ action, osId, eventData, before, after, ctx }) => {
  try {
    otherServiceAuditLogRepo.insertOtherServiceAuditLog({
      osId,
      action,
      eventData: toJson(eventData),
      beforeData: toJson(before),
      afterData: toJson(after),
      changedBy: ctx?.changedBy ?? "system",
    })
  } catch (error) {
    console.error(`[OtherServiceAuditLog] failed to record ${action} on Other Service ${osId}`, error)
  }
}
