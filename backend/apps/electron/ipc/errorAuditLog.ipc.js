const errorAuditLogService = require("../../../packages/services/errorAuditLogService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("errorAuditLogs:getAll", {}, (_event, options) =>
  errorAuditLogService.getErrorAuditLogs(options)
)

registerIpcHandler("errors:reportRenderer", { auth: false, silent: true }, (_event, payload) =>
  errorAuditLogService.reportRendererError(payload)
)
