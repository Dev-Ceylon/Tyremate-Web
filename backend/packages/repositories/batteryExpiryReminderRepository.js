const db = require("../database/connection")

exports.createBatteryExpiryReminder = (data) => {
  const result = db
    .prepare(`
      INSERT INTO BatteryExpiryReminder (
        BatteryStorageManagerBatchID,
        BatteryID,
        LocationID,
        ReminderID,
        BatchCode,
        ExpiryDate,
        IsDone,
        CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.BatteryStorageManagerBatchID || null,
      data.BatteryID,
      data.LocationID || null,
      data.ReminderID,
      data.BatchCode || null,
      data.ExpiryDate || null,
      data.IsDone ?? 0,
      data.CreatedBy || null
    )

  return exports.getBatteryExpiryReminderById(result.lastInsertRowid)
}

exports.getBatteryExpiryReminderById = (id) => {
  return db
    .prepare("SELECT * FROM BatteryExpiryReminder WHERE ID = ?")
    .get(id)
}

exports.getBatteryExpiryReminderByReminderId = (reminderId) => {
  return db
    .prepare("SELECT * FROM BatteryExpiryReminder WHERE ReminderID = ?")
    .get(reminderId)
}

const enrichWithDaysLeft = (row) => {
  if (!row) return row
  let daysLeft = null
  const targetDateStr = row.ExpiryDate || row.Date
  if (targetDateStr) {
    const target = new Date(targetDateStr)
    if (!Number.isNaN(target.getTime())) {
      const today = new Date()
      const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
      const utcTarget = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
      daysLeft = Math.floor((utcTarget - utcToday) / (24 * 60 * 60 * 1000))
    }
  }
  return {
    ...row,
    DaysLeft: daysLeft,
  }
}

exports.getBatteryReminderDetailsByReminderId = (reminderId) => {
  const row = db
    .prepare(`
      SELECT
        ber.ID,
        ber.BatteryStorageManagerBatchID,
        ber.BatteryID,
        ber.LocationID,
        ber.ReminderID,
        ber.BatchCode,
        ber.ExpiryDate,
        ber.IsDone,
        ber.CreatedBy,
        ber.createdDate,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName,
        COALESCE(bl.LocationCode, sl.LocationCode) AS LocationCode,
        COALESCE(bl.BranchId, sl.BranchId) AS BranchId,
        br.BranchCode,
        br.BranchName,
        r.ReminderDate AS Date,
        r.IsCompleted,
        rt.ReminderTypeCode,
        rt.ReminderTypeName,
        bsmb.MfgDate,
        bsmb.Qty AS BatchQty
      FROM BatteryExpiryReminder ber
      INNER JOIN BatteryM b ON b.Id = ber.BatteryID
      INNER JOIN Reminders r ON r.ID = ber.ReminderID
      INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
      LEFT JOIN BatteryLocationM bl ON bl.Id = ber.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = ber.LocationID
      LEFT JOIN BranchM br ON br.Id = COALESCE(bl.BranchId, sl.BranchId)
      LEFT JOIN BatteryStorageManagerBatch bsmb ON bsmb.Id = ber.BatteryStorageManagerBatchID
      WHERE ber.ReminderID = ?
    `)
    .get(reminderId)

  return enrichWithDaysLeft(row)
}

exports.getBatteryReminderDetailsByReminderIds = (reminderIds) => {
  if (!reminderIds || !reminderIds.length) return []

  const placeholders = reminderIds.map(() => "?").join(", ")

  const rows = db
    .prepare(`
      SELECT
        ber.ID,
        ber.BatteryStorageManagerBatchID,
        ber.BatteryID,
        ber.LocationID,
        ber.ReminderID,
        ber.BatchCode,
        ber.ExpiryDate,
        ber.IsDone,
        ber.CreatedBy,
        ber.createdDate,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName,
        COALESCE(bl.LocationCode, sl.LocationCode) AS LocationCode,
        COALESCE(bl.BranchId, sl.BranchId) AS BranchId,
        br.BranchCode,
        br.BranchName,
        r.ReminderDate AS Date,
        r.IsCompleted,
        rt.ReminderTypeCode,
        rt.ReminderTypeName,
        bsmb.MfgDate,
        bsmb.Qty AS BatchQty
      FROM BatteryExpiryReminder ber
      INNER JOIN BatteryM b ON b.Id = ber.BatteryID
      INNER JOIN Reminders r ON r.ID = ber.ReminderID
      INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
      LEFT JOIN BatteryLocationM bl ON bl.Id = ber.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = ber.LocationID
      LEFT JOIN BranchM br ON br.Id = COALESCE(bl.BranchId, sl.BranchId)
      LEFT JOIN BatteryStorageManagerBatch bsmb ON bsmb.Id = ber.BatteryStorageManagerBatchID
      WHERE ber.ReminderID IN (${placeholders})
    `)
    .all(...reminderIds)

  return rows.map(enrichWithDaysLeft)
}

exports.getActiveBatteryReminders = (reminderTypeCode) => {
  if (reminderTypeCode) {
    return db
      .prepare(`
        SELECT
          ber.*,
          r.ReminderTypeID,
          rt.ReminderTypeCode,
          r.IsCompleted
        FROM BatteryExpiryReminder ber
        INNER JOIN Reminders r ON r.ID = ber.ReminderID
        INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
        WHERE r.IsCompleted = 0 AND rt.ReminderTypeCode = ?
      `)
      .all(reminderTypeCode)
  }

  return db
    .prepare(`
      SELECT
        ber.*,
        r.ReminderTypeID,
        rt.ReminderTypeCode,
        r.IsCompleted
      FROM BatteryExpiryReminder ber
      INNER JOIN Reminders r ON r.ID = ber.ReminderID
      INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
      WHERE r.IsCompleted = 0
    `)
    .all()
}

exports.getAllBatteryReminders = (reminderTypeCode) => {
  if (reminderTypeCode) {
    return db
      .prepare(`
        SELECT
          ber.*,
          r.ReminderTypeID,
          rt.ReminderTypeCode,
          r.IsCompleted
        FROM BatteryExpiryReminder ber
        INNER JOIN Reminders r ON r.ID = ber.ReminderID
        INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
        WHERE rt.ReminderTypeCode = ?
      `)
      .all(reminderTypeCode)
  }

  return db
    .prepare(`
      SELECT
        ber.*,
        r.ReminderTypeID,
        rt.ReminderTypeCode,
        r.IsCompleted
      FROM BatteryExpiryReminder ber
      INNER JOIN Reminders r ON r.ID = ber.ReminderID
      INNER JOIN ReminderTypes rt ON rt.Id = r.ReminderTypeID
    `)
    .all()
}

exports.markReminderDone = (reminderId) => {
  return db
    .prepare("UPDATE BatteryExpiryReminder SET IsDone = 1 WHERE ReminderID = ?")
    .run(reminderId)
}

exports.unmarkReminderDone = (reminderId) => {
  return db
    .prepare("UPDATE BatteryExpiryReminder SET IsDone = 0 WHERE ReminderID = ?")
    .run(reminderId)
}

exports.deleteByReminderId = (reminderId) => {
  return db
    .prepare("DELETE FROM BatteryExpiryReminder WHERE ReminderID = ?")
    .run(reminderId)
}
