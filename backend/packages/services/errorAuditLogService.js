const errorAuditLogRepo = require("../repositories/errorAuditLogRepository")

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

const toOptionalString = (value) => {
  return typeof value === "string" && value.trim() ? value : null
}

const sanitizeRendererPayload = (payload) => {
  return {
    code: toOptionalString(payload?.code) ?? "RENDERER",
    channel: toOptionalString(payload?.channel),
    source: toOptionalString(payload?.source) ?? "renderer",
    errorName: toOptionalString(payload?.errorName) ?? "Error",
    message: toOptionalString(payload?.message) ?? "Unknown renderer error",
    stackTrace: typeof payload?.stackTrace === "string" ? payload.stackTrace : null,
    details: payload?.details ?? null,
  }
}

exports.recordError = ({ channel, code, error, details, source = "main", ctx }) => {
  try {
    errorAuditLogRepo.insertErrorAuditLog({
      channel: channel ?? null,
      code: code ?? "UNKNOWN",
      errorName: error && error.name ? error.name : "Error",
      message: error && error.message ? error.message : String(error),
      stackTrace: error && error.stack ? error.stack : null,
      details: toJson(details),
      source,
      changedBy: ctx?.changedBy ?? "system",
    })
  } catch (error) {
    // An audit failure must never break the error path that triggered it.
    try {
      console.error("[ErrorAuditLog] failed to persist error audit record", error)
    } catch {
      // ignore
    }
  }
}

exports.getErrorAuditLogs = (options = {}) => {
  return errorAuditLogRepo.getErrorAuditLogs(options)
}

exports.reportRendererError = (payload) => {
  try {
    const entry = sanitizeRendererPayload(payload)

    exports.recordError({
      channel: entry.channel,
      code: entry.code,
      error: {
        name: entry.errorName,
        message: entry.message,
        stack: entry.stackTrace,
      },
      details: {
        rendererSource: entry.source,
        ...(entry.details === null ? {} : { payload: entry.details }),
      },
      source: "renderer",
    })
  } catch (error) {
    try {
      console.error("[ErrorAuditLog] failed to record renderer error", error)
    } catch {
      // ignore
    }
  }

  return { success: true }
}
