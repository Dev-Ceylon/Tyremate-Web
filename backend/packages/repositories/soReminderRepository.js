const db = require("../database/connection")

exports.createSOReminder = (data) => {
  const result = db
    .prepare(
      `INSERT INTO SOReminder (SoID, ReminderID, ReminderDate, ReminderNote, IsDone)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(data.SoID, data.ReminderID, data.ReminderDate, data.ReminderNote || null, data.IsDone ?? 0)

  return db
    .prepare(
      `SELECT sor.*, r.ReminderTypeID, rt.ReminderTypeCode, rt.ReminderTypeName
       FROM SOReminder sor
       JOIN Reminders r ON sor.ReminderID = r.ID
       JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
       WHERE sor.ID = ?`
    )
    .get(result.lastInsertRowid)
}

exports.getSORemindersBySoId = (soId) => {
  return db
    .prepare(
      `SELECT sor.*, r.ReminderTypeID, r.IsCompleted, rt.ReminderTypeCode, rt.ReminderTypeName
       FROM SOReminder sor
       JOIN Reminders r ON sor.ReminderID = r.ID
       JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
       WHERE sor.SoID = ?
       ORDER BY sor.ReminderDate ASC`
    )
    .all(soId)
}

exports.getSoIdByReminderId = (reminderId) => {
  const row = db
    .prepare("SELECT SoID FROM SOReminder WHERE ReminderID = ?")
    .get(reminderId)
  return row ? row.SoID : null
}

exports.getSoIdsByReminderIds = (reminderIds) => {
  if (!reminderIds.length) return []
  const placeholders = reminderIds.map(() => "?").join(",")
  return db
    .prepare(`SELECT ReminderID, SoID FROM SOReminder WHERE ReminderID IN (${placeholders})`)
    .all(...reminderIds)
}

exports.deleteSORemindersBySoId = (soId) => {
  const reminders = db
    .prepare("SELECT ReminderID FROM SOReminder WHERE SoID = ?")
    .all(soId)

  const result = db.prepare("DELETE FROM SOReminder WHERE SoID = ?").run(soId)

  for (const rem of reminders) {
    db.prepare("DELETE FROM Reminders WHERE ID = ?").run(rem.ReminderID)
  }

  return result
}
