// Web edition of apps/electron/main/main.js.
//
// Runs inside the browser Web Worker (or a Node test harness) after the
// platform runtime has been given a database. Registers every IPC handler,
// seeds lookup data and starts the background monitors - mirroring the
// Electron main-process start-up sequence.
const devTempLockService = require("../../../packages/services/devTempLockService")

require("../ipc/devTempLock.ipc")
require("../ipc/product.ipc")
require("../ipc/supplier.ipc")
require("../ipc/contractor.ipc")
require("../ipc/customer.ipc")
require("../ipc/inquiry.ipc")
require("../ipc/inquiryPo.ipc")
require("../ipc/inquirySo.ipc")
require("../ipc/notification.ipc")
require("../ipc/errorAuditLog.ipc")
require("../ipc/storageLocation.ipc")
require("../ipc/reminder.ipc")
require("../ipc/storageLocationType.ipc")
require("../ipc/branch.ipc")
require("../ipc/storageManager.ipc")
require("../ipc/consumable.ipc")
require("../ipc/consumableLocation.ipc")
require("../ipc/consumableStorageManager.ipc")
require("../ipc/tyre.ipc")
require("../ipc/tyreSupplier.ipc")
require("../ipc/battery.ipc")
require("../ipc/batteryLocation.ipc")
require("../ipc/batteryStorageManager.ipc")
require("../ipc/stockSnapshot.ipc")
require("../ipc/auth.ipc")
require("../ipc/so.ipc")
require("../ipc/soCustomer.ipc")
require("../ipc/soTyres.ipc")
require("../ipc/po.ipc")
require("../ipc/goodsReceipt.ipc")
require("../ipc/poTyres.ipc")
require("../ipc/manufactureOrder.ipc")
require("../ipc/dag.ipc")
require("../ipc/dagTyres.ipc")
require("../ipc/dagGatePass.ipc")
require("../ipc/status.ipc")
require("../ipc/bankDetails.ipc")
require("../ipc/chequePayment.ipc")
require("../ipc/paymentReceipt.ipc")
require("../ipc/otherService.ipc")
require("../ipc/invoice.ipc")
require("../ipc/salesReturn.ipc")
require("../ipc/creditNote.ipc")
require("../ipc/violations.ipc")
require("../ipc/report.ipc")
require("../ipc/suggest.ipc")
require("../ipc/admin.ipc")
require("../../../packages/listeners/reminderLogger")
require("../../../packages/listeners/notificationLogger")
const { registerAuthHandlers } = require("../ipc/authHandlers.ipc")
const registerPrinterIpc = require("../ipc/printer.ipc")
const { runSeed, initializeLookupIds } = require("../../../packages/database/seed")
const appSettingsRepository = require("../../../packages/repositories/appSettingsRepository")
const { SCHEMA_HASH } = require("../../../platform/migrations.generated")
require("../listeners/reminderIpcListener")
require("../listeners/notificationIpcListener")
const notificationMonitor = require("../../../packages/services/notifications/notificationMonitorService")
const tyreExpiryMonitor = require("../../../packages/services/notifications/tyreExpiryMonitorService")
const batteryReminderMonitor = require("../../../packages/services/notifications/batteryReminderMonitorService")
const { logError } = require("../../../packages/errors/errorLogger")

const SEED_MARKER_KEY = "seed.coreVersion"

function hashText(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

function seedVersion() {
  const constants = [
    require("../../../packages/constants/statusConstants"),
    require("../../../packages/constants/paymentTypeConstants"),
    require("../../../packages/constants/reminderTypeConstants"),
    require("../../../packages/constants/policyViolationConstants"),
    require("../../../packages/constants/consumableConstants"),
    require("../../../packages/constants/storageLocationTypeConstants"),
    require("../../../packages/constants/storageSourceConstants"),
    require("../../../packages/constants/invoiceConstants"),
    require("../../../packages/constants/rolePermissionConstants"),
    require("../../../packages/constants/quarantineConstants"),
    require("../../../packages/constants/salesReturnConstants"),
  ]
  const seedData = constants.map((mod) =>
    Object.fromEntries(Object.entries(mod).filter(([key]) => /SEED/.test(key))),
  )
  return `${SCHEMA_HASH}:${hashText(JSON.stringify(seedData))}`
}

/**
 * Seeds lookup data. When the database already carries the seed for this
 * build, only the in-memory lookup-id caches are loaded (saves hundreds of
 * round trips on a remote database).
 */
async function seedDatabase({ force = false } = {}) {
  const version = seedVersion()
  let current = null
  try {
    current = appSettingsRepository.get(SEED_MARKER_KEY)
  } catch {
    current = null
  }
  if (!force && current === version) {
    initializeLookupIds()
    return { seeded: false, version }
  }
  await runSeed()
  try {
    appSettingsRepository.set(SEED_MARKER_KEY, version, "system")
  } catch (error) {
    logError(error, { channel: "seed:marker" })
  }
  return { seeded: true, version }
}

let monitorsStarted = false

async function start({ startMonitors = true } = {}) {
  let isLocked = false
  let lockStatus = null
  try {
    lockStatus = devTempLockService.getStatus()
    isLocked = lockStatus.locked
  } catch (error) {
    logError(error, { channel: "devTempLock:startup" })
    isLocked = true
  }

  let seedResult = null
  if (!isLocked) {
    seedResult = await seedDatabase()
  }
  registerAuthHandlers()
  registerPrinterIpc()
  if (!isLocked && startMonitors && !monitorsStarted) {
    monitorsStarted = true
    notificationMonitor.start()
    tyreExpiryMonitor.start()
    batteryReminderMonitor.start()
  }
  return { locked: isLocked, seed: seedResult }
}

function stop() {
  if (monitorsStarted) {
    notificationMonitor.stop()
    tyreExpiryMonitor.stop()
    batteryReminderMonitor.stop()
    monitorsStarted = false
  }
}

module.exports = { start, stop, seedDatabase }
