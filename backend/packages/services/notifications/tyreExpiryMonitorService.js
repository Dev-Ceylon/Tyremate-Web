const tyreExpiryReminderService = require("../tyreExpiryReminderService")
const { logError } = require("../../errors/errorLogger")

const DEFAULT_POLL_INTERVAL_MS = 30000

const ENV_POLL_INTERVAL_MS = "TYRE_EXPIRY_MONITOR_INTERVAL_MS"

let intervalId = null
let currentIntervalMs = DEFAULT_POLL_INTERVAL_MS

const parseIntervalMs = (value, fallback) => {
  const parsed = Math.floor(Number(value))

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const resolveIntervalMs = (options = {}) => {
  if (options.intervalMs !== undefined) {
    return parseIntervalMs(options.intervalMs, DEFAULT_POLL_INTERVAL_MS)
  }

  if (process.env[ENV_POLL_INTERVAL_MS]) {
    return parseIntervalMs(process.env[ENV_POLL_INTERVAL_MS], DEFAULT_POLL_INTERVAL_MS)
  }

  return DEFAULT_POLL_INTERVAL_MS
}

const runSync = () => {
  try {
    const result = tyreExpiryReminderService.syncTyreExpiryReminders()

    if (result.created > 0 || result.completed > 0) {
      console.log(
        `Tyre expiry monitor: created ${result.created}, completed ${result.completed}, expiring ${result.expiring}`
      )
    }
  } catch (error) {
    logError(error, { channel: "tyreExpiryMonitor:sync" })
  }
}

function start(options = {}) {
  if (intervalId) {
    return { started: false, intervalMs: currentIntervalMs }
  }

  currentIntervalMs = resolveIntervalMs(options)

  // Run immediately on startup instead of waiting for the first interval tick.
  runSync()

  intervalId = setInterval(runSync, currentIntervalMs)

  return { started: true, intervalMs: currentIntervalMs }
}

function stop() {
  if (!intervalId) {
    return
  }

  clearInterval(intervalId)
  intervalId = null
}

function setIntervalMs(intervalMs) {
  const nextMs = parseIntervalMs(intervalMs, currentIntervalMs)
  currentIntervalMs = nextMs

  if (intervalId) {
    clearInterval(intervalId)
    intervalId = setInterval(runSync, currentIntervalMs)
  }

  return currentIntervalMs
}

function getIntervalMs() {
  return currentIntervalMs
}

module.exports = {
  DEFAULT_POLL_INTERVAL_MS,
  start,
  stop,
  setIntervalMs,
  getIntervalMs,
  syncNow: runSync
}