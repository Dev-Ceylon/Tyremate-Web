const db = require("../database/connection")
const reminderService = require("./reminderService")
const batteryExpiryReminderRepo = require("../repositories/batteryExpiryReminderRepository")
const batteryStorageManagerBatchRepo = require("../repositories/batteryStorageManagerBatchRepository")
const { getReminderTypeId, REMINDER_TYPE_CODES } = require("../constants/reminderTypeConstants")

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_SHELF_LIFE_DAYS = 730 // ~2 years
const DEFAULT_EXPIRY_LEAD_DAYS = 30
const DEFAULT_RECHARGE_CYCLE_DAYS = 90
const DEFAULT_RECHARGE_LEAD_DAYS = 7
const DEFAULT_WARRANTY_LEAD_DAYS = 30

const toIsoDate = (date) => date.toISOString().slice(0, 10)

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const addMonths = (date, months) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

const getToday = () => toIsoDate(new Date())

exports.getExpiringBatteryBatches = (options = {}) => {
  const leadDays = options.leadDays ?? DEFAULT_EXPIRY_LEAD_DAYS
  const batches = batteryStorageManagerBatchRepo.getStockedBatteryBatches()

  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  return batches
    .map((batch) => {
      let expiryDateObj = null

      if (batch.ExpiryDate) {
        const parsed = new Date(batch.ExpiryDate)
        if (!Number.isNaN(parsed.getTime())) {
          expiryDateObj = parsed
        }
      } else if (batch.MfgDate) {
        const parsed = new Date(batch.MfgDate)
        if (!Number.isNaN(parsed.getTime())) {
          expiryDateObj = addDays(parsed, DEFAULT_SHELF_LIFE_DAYS)
        }
      }

      if (!expiryDateObj) return null

      const utcExpiry = Date.UTC(
        expiryDateObj.getUTCFullYear(),
        expiryDateObj.getUTCMonth(),
        expiryDateObj.getUTCDate()
      )
      const daysLeft = Math.floor((utcExpiry - utcToday) / MS_PER_DAY)

      if (daysLeft <= leadDays) {
        return {
          ...batch,
          ComputedExpiryDate: toIsoDate(expiryDateObj),
          DaysLeft: daysLeft,
        }
      }

      return null
    })
    .filter(Boolean)
}

exports.getRechargeDueBatteryBatches = (options = {}) => {
  const rechargeCycleDays = options.rechargeCycleDays ?? DEFAULT_RECHARGE_CYCLE_DAYS
  const leadDays = options.leadDays ?? DEFAULT_RECHARGE_LEAD_DAYS
  const batches = batteryStorageManagerBatchRepo.getStockedBatteryBatches()

  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  return batches
    .map((batch) => {
      if (!batch.MfgDate) return null

      const mfgDate = new Date(batch.MfgDate)
      if (Number.isNaN(mfgDate.getTime())) return null

      const utcMfg = Date.UTC(
        mfgDate.getUTCFullYear(),
        mfgDate.getUTCMonth(),
        mfgDate.getUTCDate()
      )
      const daysSinceMfg = Math.floor((utcToday - utcMfg) / MS_PER_DAY)
      if (daysSinceMfg < 0) return null

      // Periodic warehouse recharge cycle: e.g. every 90 days (cycle 1 at 90d, cycle 2 at 180d, etc.)
      const cycleIndex = Math.floor(daysSinceMfg / rechargeCycleDays)
      const currentCycleDueDate = addDays(mfgDate, cycleIndex * rechargeCycleDays)
      const nextCycleDueDate = addDays(mfgDate, (cycleIndex + 1) * rechargeCycleDays)

      const utcCurrentDue = Date.UTC(
        currentCycleDueDate.getUTCFullYear(),
        currentCycleDueDate.getUTCMonth(),
        currentCycleDueDate.getUTCDate()
      )
      const daysSinceCurrentDue = Math.floor((utcToday - utcCurrentDue) / MS_PER_DAY)

      // If overdue for the current cycle (within 30 days overdue window), target current cycle
      let targetRechargeDueDate = nextCycleDueDate
      if (cycleIndex > 0 && daysSinceCurrentDue <= 30) {
        targetRechargeDueDate = currentCycleDueDate
      }

      const utcTarget = Date.UTC(
        targetRechargeDueDate.getUTCFullYear(),
        targetRechargeDueDate.getUTCMonth(),
        targetRechargeDueDate.getUTCDate()
      )
      const daysLeft = Math.floor((utcTarget - utcToday) / MS_PER_DAY)

      if (daysLeft <= leadDays) {
        return {
          ...batch,
          RechargeDueDate: toIsoDate(targetRechargeDueDate),
          DaysLeft: daysLeft,
        }
      }

      return null
    })
    .filter(Boolean)
}

exports.getWarrantyExpiringBatteryBatches = (options = {}) => {
  const leadDays = options.leadDays ?? DEFAULT_WARRANTY_LEAD_DAYS
  const batches = batteryStorageManagerBatchRepo.getStockedBatteryBatches()

  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  return batches
    .map((batch) => {
      const warrantyMonths = batch.WarrantyMonths || 12
      let baseDate = null

      if (batch.MfgDate) {
        baseDate = new Date(batch.MfgDate)
      } else if (batch.createdDate) {
        baseDate = new Date(batch.createdDate)
      }

      if (!baseDate || Number.isNaN(baseDate.getTime())) return null

      const warrantyEndDate = addMonths(baseDate, warrantyMonths)
      const utcWarrantyEnd = Date.UTC(
        warrantyEndDate.getUTCFullYear(),
        warrantyEndDate.getUTCMonth(),
        warrantyEndDate.getUTCDate()
      )
      const daysLeft = Math.floor((utcWarrantyEnd - utcToday) / MS_PER_DAY)

      if (daysLeft <= leadDays) {
        return {
          ...batch,
          WarrantyEndDate: toIsoDate(warrantyEndDate),
          DaysLeft: daysLeft,
        }
      }

      return null
    })
    .filter(Boolean)
}

exports.createBatteryReminder = (batch, reminderTypeCode, targetDate) => {
  const typeId = getReminderTypeId(
    reminderTypeCode === REMINDER_TYPE_CODES.BATTERY_EXPIRY
      ? "BATTERY_EXPIRY"
      : reminderTypeCode === REMINDER_TYPE_CODES.BATTERY_RECHARGE
        ? "BATTERY_RECHARGE"
        : "BATTERY_WARRANTY"
  )

  if (!typeId) {
    throw new Error(`Reminder type is not initialized for code ${reminderTypeCode}`)
  }

  const reminderDate = targetDate || getToday()

  const transaction = db.transaction(() => {
    const reminder = reminderService.createReminder({
      ReminderTypeID: typeId,
      Date: reminderDate,
      IsCompleted: false,
    })

    return batteryExpiryReminderRepo.createBatteryExpiryReminder({
      BatteryStorageManagerBatchID: batch.Id,
      BatteryID: batch.BatteryId,
      LocationID: batch.LocationID,
      ReminderID: reminder.ID,
      BatchCode: batch.BatchCode,
      ExpiryDate: reminderDate,
      CreatedBy: "system",
    })
  })

  return transaction()
}

exports.syncBatteryReminders = (options = {}) => {
  // 1. Sync Shelf-Life (Expiry) Reminders
  const expiringBatches = exports.getExpiringBatteryBatches(options)
  const allExpiry = batteryExpiryReminderRepo.getAllBatteryReminders(
    REMINDER_TYPE_CODES.BATTERY_EXPIRY
  )
  const existingExpiryBatchIds = new Set(
    allExpiry.map((row) => row.BatteryStorageManagerBatchID)
  )
  const activeExpiry = allExpiry.filter((row) => row.IsCompleted === 0)
  const activeExpiryMap = new Map(
    activeExpiry.map((row) => [row.BatteryStorageManagerBatchID, row])
  )
  const stillExpiringIds = new Set()
  let createdExpiry = 0

  for (const batch of expiringBatches) {
    stillExpiringIds.add(batch.Id)
    if (!existingExpiryBatchIds.has(batch.Id)) {
      exports.createBatteryReminder(
        batch,
        REMINDER_TYPE_CODES.BATTERY_EXPIRY,
        batch.ComputedExpiryDate
      )
      createdExpiry += 1
      existingExpiryBatchIds.add(batch.Id)
    }
  }

  // Auto-complete resolved expiry reminders
  let completedCount = 0
  for (const [batchId, tracked] of activeExpiryMap.entries()) {
    if (!stillExpiringIds.has(batchId)) {
      try {
        reminderService.markReminderCompleted(tracked.ReminderID, true)
        batteryExpiryReminderRepo.markReminderDone(tracked.ReminderID)
        completedCount += 1
      } catch (err) {
        console.error(`Failed to auto-complete expiry reminder for batch ${batchId}`, err)
      }
    }
  }

  // 2. Sync Periodic Recharge Reminders
  const rechargeBatches = exports.getRechargeDueBatteryBatches(options)
  const allRecharge = batteryExpiryReminderRepo.getAllBatteryReminders(
    REMINDER_TYPE_CODES.BATTERY_RECHARGE
  )
  const existingRechargeKeys = new Set(
    allRecharge.map((row) => `${row.BatteryStorageManagerBatchID}:${row.ExpiryDate}`)
  )
  const activeRecharge = allRecharge.filter((row) => row.IsCompleted === 0)
  const activeRechargeBatchIds = new Set(
    activeRecharge.map((row) => row.BatteryStorageManagerBatchID)
  )
  const activeRechargeMap = new Map(
    activeRecharge.map((row) => [row.BatteryStorageManagerBatchID, row])
  )
  const stillRechargeIds = new Set()
  let createdRecharge = 0

  for (const batch of rechargeBatches) {
    stillRechargeIds.add(batch.Id)
    const key = `${batch.Id}:${batch.RechargeDueDate}`
    if (!activeRechargeBatchIds.has(batch.Id) && !existingRechargeKeys.has(key)) {
      exports.createBatteryReminder(
        batch,
        REMINDER_TYPE_CODES.BATTERY_RECHARGE,
        batch.RechargeDueDate
      )
      createdRecharge += 1
      existingRechargeKeys.add(key)
    }
  }

  for (const [batchId, tracked] of activeRechargeMap.entries()) {
    if (!stillRechargeIds.has(batchId)) {
      try {
        reminderService.markReminderCompleted(tracked.ReminderID, true)
        batteryExpiryReminderRepo.markReminderDone(tracked.ReminderID)
        completedCount += 1
      } catch (err) {
        console.error(`Failed to auto-complete recharge reminder for batch ${batchId}`, err)
      }
    }
  }

  // 3. Sync Warranty Reminders
  const warrantyBatches = exports.getWarrantyExpiringBatteryBatches(options)
  const allWarranty = batteryExpiryReminderRepo.getAllBatteryReminders(
    REMINDER_TYPE_CODES.BATTERY_WARRANTY
  )
  const existingWarrantyBatchIds = new Set(
    allWarranty.map((row) => row.BatteryStorageManagerBatchID)
  )
  const activeWarranty = allWarranty.filter((row) => row.IsCompleted === 0)
  const activeWarrantyMap = new Map(
    activeWarranty.map((row) => [row.BatteryStorageManagerBatchID, row])
  )
  const stillWarrantyIds = new Set()
  let createdWarranty = 0

  for (const batch of warrantyBatches) {
    stillWarrantyIds.add(batch.Id)
    if (!existingWarrantyBatchIds.has(batch.Id)) {
      exports.createBatteryReminder(
        batch,
        REMINDER_TYPE_CODES.BATTERY_WARRANTY,
        batch.WarrantyEndDate
      )
      createdWarranty += 1
      existingWarrantyBatchIds.add(batch.Id)
    }
  }

  for (const [batchId, tracked] of activeWarrantyMap.entries()) {
    if (!stillWarrantyIds.has(batchId)) {
      try {
        reminderService.markReminderCompleted(tracked.ReminderID, true)
        batteryExpiryReminderRepo.markReminderDone(tracked.ReminderID)
        completedCount += 1
      } catch (err) {
        console.error(`Failed to auto-complete warranty reminder for batch ${batchId}`, err)
      }
    }
  }

  return {
    createdExpiry,
    createdRecharge,
    createdWarranty,
    completedCount,
    totalExpiring: expiringBatches.length,
    totalRechargeDue: rechargeBatches.length,
    totalWarrantyExpiring: warrantyBatches.length,
  }
}
