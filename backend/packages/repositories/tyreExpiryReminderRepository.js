const db = require("../database/connection")

exports.createTyreExpiryReminder = (data) => {
  const result = db
    .prepare(`
      INSERT INTO TyreExpiryReminder (
        StorageManagerBatchID,
        TyreID,
        LocationID,
        ReminderID,
        DOT,
        ExpiryDate,
        IsDone,
        CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.StorageManagerBatchID,
      data.TyreID,
      data.LocationID || null,
      data.ReminderID,
      data.DOT || null,
      data.ExpiryDate || null,
      data.IsDone ?? 0,
      data.CreatedBy || null
    )

  return exports.getTyreExpiryReminderById(result.lastInsertRowid)
}

exports.getTyreExpiryReminderById = (id) => {
  return db
    .prepare("SELECT * FROM TyreExpiryReminder WHERE ID = ?")
    .get(id)
}

exports.getTyreExpiryReminderByReminderId = (reminderId) => {
  return db
    .prepare("SELECT * FROM TyreExpiryReminder WHERE ReminderID = ?")
    .get(reminderId)
}

exports.getTyreExpiryDetailsByReminderId = (reminderId) => {
  return db
    .prepare(`
      SELECT
        ter.ID,
        ter.StorageManagerBatchID,
        ter.TyreID,
        ter.LocationID,
        ter.ReminderID,
        ter.DOT,
        ter.ExpiryDate,
        ter.IsDone,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        sl.LocationName,
        sl.BranchId,
        b.BranchName
      FROM TyreExpiryReminder ter
      INNER JOIN TyreM t ON t.Id = ter.TyreID
      LEFT JOIN StorageLocationM sl ON sl.Id = ter.LocationID
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      WHERE ter.ReminderID = ?
    `)
    .get(reminderId)
}

exports.getTyreExpiryDetailsByReminderIds = (reminderIds) => {
  if (!reminderIds.length) return []

  const placeholders = reminderIds.map(() => "?").join(", ")

  return db
    .prepare(`
      SELECT
        ter.ID,
        ter.StorageManagerBatchID,
        ter.TyreID,
        ter.LocationID,
        ter.ReminderID,
        ter.DOT,
        ter.ExpiryDate,
        ter.IsDone,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        sl.LocationName,
        sl.BranchId,
        b.BranchName
      FROM TyreExpiryReminder ter
      INNER JOIN TyreM t ON t.Id = ter.TyreID
      LEFT JOIN StorageLocationM sl ON sl.Id = ter.LocationID
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      WHERE ter.ReminderID IN (${placeholders})
    `)
    .all(...reminderIds)
}

exports.getLatestReminderByBatchId = (batchId) => {
  return db
    .prepare(`
      SELECT ter.*
      FROM TyreExpiryReminder ter
      WHERE ter.StorageManagerBatchID = ?
      ORDER BY ter.ID DESC
      LIMIT 1
    `)
    .get(batchId)
}

exports.getActiveReminderByBatchId = (batchId) => {
  return db
    .prepare(`
      SELECT ter.*
      FROM TyreExpiryReminder ter
      INNER JOIN Reminders r ON r.ID = ter.ReminderID
      WHERE ter.StorageManagerBatchID = ?
        AND r.IsCompleted = 0
      ORDER BY ter.ID DESC
      LIMIT 1
    `)
    .get(batchId)
}

exports.getActiveTyreExpiryReminders = () => {
  return db
    .prepare(`
      SELECT ter.*
      FROM TyreExpiryReminder ter
      INNER JOIN Reminders r ON r.ID = ter.ReminderID
      WHERE r.IsCompleted = 0
    `)
    .all()
}

exports.markReminderDone = (reminderId) => {
  return db
    .prepare("UPDATE TyreExpiryReminder SET IsDone = 1 WHERE ReminderID = ?")
    .run(reminderId)
}

exports.unmarkReminderDone = (reminderId) => {
  return db
    .prepare("UPDATE TyreExpiryReminder SET IsDone = 0 WHERE ReminderID = ?")
    .run(reminderId)
}