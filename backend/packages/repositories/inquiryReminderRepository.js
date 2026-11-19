const db = require("../database/connection")

exports.getInquiryRemindersByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        ir.ID,
        ir.InquiryID,
        ir.ReminderID,
        ir.ReminderDate,
        ir.ReminderNote,
        ir.IsDone
      FROM InquiryReminder ir
      WHERE ir.InquiryID = ?
      ORDER BY ir.ReminderDate ASC
    `)
    .all(inquiryId)
}

exports.getInquiryReminderById = (id) => {
  return db
    .prepare(`
      SELECT
        ir.ID,
        ir.InquiryID,
        ir.ReminderID,
        ir.ReminderDate,
        ir.ReminderNote,
        ir.IsDone
      FROM InquiryReminder ir
      WHERE ir.ID = ?
    `)
    .get(id)
}

exports.getInquiryReminderByReminderId = (reminderId) => {
  return db
    .prepare(`
      SELECT
        ir.ID,
        ir.InquiryID,
        ir.ReminderID,
        ir.ReminderDate,
        ir.ReminderNote,
        ir.IsDone,
        i.Date AS InquiryDate,
        i.CustomerID,
        c.Name AS CustomerName,
        c.CustomerCode,
        i.Notes AS InquiryNotes,
        i.IsAdminApproved,
        i.ConvertedSOID,
        (
          SELECT GROUP_CONCAT(t.Size || ' - ' || t.Pattern || ' (Qty: ' || it.Qty || ')')
          FROM InquiryTyres it
          JOIN TyreM t ON it.TyreID = t.Id
          WHERE it.InquiryID = i.InquiryID
        ) AS InquiryTyresDetails
      FROM InquiryReminder ir
      JOIN Inquiry i ON ir.InquiryID = i.InquiryID
      JOIN CustomerM c ON i.CustomerID = c.CustomerID
      WHERE ir.ReminderID = ?
    `)
    .get(reminderId)
}

exports.createInquiryReminder = (data) => {
  const result = db
    .prepare(`
      INSERT INTO InquiryReminder (
        InquiryID,
        ReminderID,
        ReminderDate,
        ReminderNote,
        IsDone
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(data.InquiryID, data.ReminderID, data.ReminderDate, data.ReminderNote, data.IsDone)

  return exports.getInquiryReminderById(result.lastInsertRowid)
}

exports.updateInquiryReminder = (id, data) => {
  const result = db
    .prepare(`
      UPDATE InquiryReminder
      SET InquiryID = ?, ReminderDate = ?, ReminderNote = ?, IsDone = ?
      WHERE ID = ?
    `)
    .run(data.InquiryID, data.ReminderDate, data.ReminderNote, data.IsDone, id)

  if (result.changes === 0) return null
  return exports.getInquiryReminderById(id)
}

exports.markInquiryReminderDone = (id, isDone = 1) => {
  const result = db
    .prepare(`
      UPDATE InquiryReminder
      SET IsDone = ?
      WHERE ID = ?
    `)
    .run(isDone, id)

  if (result.changes === 0) return null
  return exports.getInquiryReminderById(id)
}

exports.deleteInquiryReminder = (id) => db.prepare("DELETE FROM InquiryReminder WHERE ID = ?").run(id)

exports.deleteInquiryRemindersByInquiryId = (inquiryId) =>
  db.prepare("DELETE FROM InquiryReminder WHERE InquiryID = ?").run(inquiryId)
