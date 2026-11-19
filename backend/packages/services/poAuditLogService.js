const poAuditLogRepo = require("../repositories/poAuditLogRepository")

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

exports.recordPOAction = ({ action, poId, eventData, before, after, ctx }) => {
  try {
    poAuditLogRepo.insertPOAuditLog({
      poId,
      action,
      eventData: toJson(eventData),
      beforeData: toJson(before),
      afterData: toJson(after),
      changedBy: ctx?.changedBy ?? "system",
    })
  } catch (error) {
    console.error(`[POAuditLog] failed to record ${action} on PO ${poId}`, error)
  }
}
