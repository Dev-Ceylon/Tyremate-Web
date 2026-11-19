/**
 * @file Central error logger for the TyreMate main process.
 *
 * Single funnel for every error that reaches the backend: IPC middleware,
 * listeners, and process-level handlers. Each error is persisted to the
 * ErrorAuditLog table (packages/database/migrations/errorAuditLog.sql) and
 * printed to the console for development. No file is written.
 *
 * INVARIANT: logging must NEVER crash the app. If persistence is unavailable
 * (DB module fails to load) or a single write fails, the logger swallows the
 * failure. Process-level handlers rely on this.
 */

let recordError = null
let persistenceUnavailable = false

function getPersistence() {
  if (persistenceUnavailable) {
    return null
  }

  if (recordError) {
    return recordError
  }

  try {
    const service = require("../services/errorAuditLogService")
    recordError = service.recordError
  } catch (error) {
    persistenceUnavailable = true
    try {
      console.error("[errorLogger] audit persistence unavailable", error)
    } catch {
      // ignore
    }
    return null
  }

  return recordError
}

function logError(error, context = {}) {
  const persist = getPersistence()

  if (persist) {
    try {
      persist({
        channel: context.channel,
        code: context.code,
        error,
        details: context.details,
        source: context.source ?? "main",
        ctx: context.ctx,
      })
    } catch {
      // A failed audit write must never break the error path that triggered it.
    }
  }

  try {
    const name = error && error.name ? error.name : "Error"
    const message = error && error.message ? error.message : String(error)
    const channelLabel = context.channel ? `[${context.channel}] ` : ""
    console.error(`${channelLabel}${name}: ${message}`)
  } catch {
    // Even console output must not crash the app.
  }
}

module.exports = { logError }
