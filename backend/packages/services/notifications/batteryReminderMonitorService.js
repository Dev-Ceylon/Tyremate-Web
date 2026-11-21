const batteryExpiryReminderService = require("../batteryExpiryReminderService")
const { logError } = require("../../errors/errorLogger")

const DEFAULT_POLL_INTERVAL_MS = 30000
const ENV_POLL_INTERVAL_MS = "BATTERY_REMINDER_MONITOR_INTERVAL_MS"

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
    const result = batteryExpiryReminderService.syncBatteryReminders()

    const totalCreated =
      (result.createdExpiry || 0) +
      (result.createdRecharge || 0) +
      (result.createdWarranty || 0)

    if (totalCreated > 0 || (result.completedCount || 0) > 0) {
      console.log(
        `Battery reminder monitor: created ${totalCreated} (exp: ${result.createdExpiry}, rec: ${result.createdRecharge}, war: ${result.createdWarranty}), completed ${result.completedCount}`
      )
    }
  } catch (error) {
    logError(error, { channel: "batteryReminderMonitor:sync" })
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
  syncNow: runSync,
}
