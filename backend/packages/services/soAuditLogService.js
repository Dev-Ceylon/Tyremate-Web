const soAuditLogRepo = require("../repositories/soAuditLogRepository")

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

exports.recordSOAction = ({ action, soId, eventData, before, after, ctx }) => {
  try {
    soAuditLogRepo.insertSOAuditLog({
      soId,
      action,
      eventData: toJson(eventData),
      beforeData: toJson(before),
      afterData: toJson(after),
      changedBy: ctx?.changedBy ?? "system",
    })
  } catch (error) {
    console.error(`[SOAuditLog] failed to record ${action} on SO ${soId}`, error)
  }
}
