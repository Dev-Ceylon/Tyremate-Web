const db = require("../database/connection")
const tyreService = require("./tyreService")
const reminderService = require("./reminderService")
const tyreExpiryReminderRepo = require("../repositories/tyreExpiryReminderRepository")
const { getReminderTypeId } = require("../constants/reminderTypeConstants")

const DEFAULT_SHELF_LIFE_YEARS = 5
const DEFAULT_EXPIRY_LEAD_DAYS = 5

const getToday = () => new Date().toISOString().slice(0, 10)

exports.syncTyreExpiryReminders = (options = {}) => {
  const shelfLifeYears = options.shelfLifeYears ?? DEFAULT_SHELF_LIFE_YEARS
  const leadDays = options.leadDays ?? DEFAULT_EXPIRY_LEAD_DAYS

  const expiringTyres = tyreService.getExpiredTyres({
    shelfLifeYears,
    leadDays
  })

  const activeTracked = tyreExpiryReminderRepo.getActiveTyreExpiryReminders()
  const activeByBatchId = new Map(activeTracked.map((row) => [row.StorageManagerBatchID, row]))

  const stillExpiringBatchIds = new Set()
  const created = []

  for (const expiringTyre of expiringTyres) {
    stillExpiringBatchIds.add(expiringTyre.Id)

    if (activeByBatchId.has(expiringTyre.Id)) {
      continue
    }

    const createdReminder = exports.createTyreExpiryReminder(expiringTyre)
    created.push(createdReminder)

    activeByBatchId.set(expiringTyre.Id, {
      ReminderID: createdReminder.ReminderID
    })
  }

  const completed = exports.completeResolvedReminders(activeByBatchId, stillExpiringBatchIds)

  return {
    created: created.length,
    completed,
    expiring: expiringTyres.length
  }
}

exports.createTyreExpiryReminder = (expiringTyre) => {
  const tyreExpiryTypeId = getReminderTypeId("TYRE_EXPIRY")

  if (!tyreExpiryTypeId) {
    throw new Error("Tyre expiry reminder type is not initialized")
  }

  const today = getToday()

  const createReminderWithLink = db.transaction(() => {
    const reminder = reminderService.createReminder({
      ReminderTypeID: tyreExpiryTypeId,
      Date: today,
      IsCompleted: false
    })

    return tyreExpiryReminderRepo.createTyreExpiryReminder({
      StorageManagerBatchID: expiringTyre.Id,
      TyreID: expiringTyre.TyreId,
      LocationID: expiringTyre.LocationId,
      ReminderID: reminder.ID,
      DOT: expiringTyre.DOT,
      ExpiryDate: expiringTyre.ExpiryDate,
      CreatedBy: "system"
    })
  })

  return createReminderWithLink()
}

exports.completeResolvedReminders = (activeByBatchId, stillExpiringBatchIds) => {
  let completedCount = 0

  for (const [batchId, tracked] of activeByBatchId.entries()) {
    if (stillExpiringBatchIds.has(batchId)) {
      continue
    }

    try {
      reminderService.markReminderCompleted(tracked.ReminderID, true)
      tyreExpiryReminderRepo.markReminderDone(tracked.ReminderID)
      completedCount += 1
    } catch (error) {
      console.error(
        `Failed to complete tyre expiry reminder for batch ${batchId}`,
        error
      )
    }
  }

  return completedCount
}