const db = require("../database/connection");

exports.getAllReminders = () => {
  return db.prepare(`
    SELECT r.ID,
      r.ReminderTypeID,
      r.ReminderDate AS Date,
      r.IsCompleted,
      rt.ReminderTypeCode,
      rt.ReminderTypeName
    FROM Reminders r
    JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
  `).all();
};

exports.getReminderById = (id) => {
  return db.prepare(`
    SELECT r.ID,
      r.ReminderTypeID,
      r.ReminderDate AS Date,
      r.IsCompleted,
      rt.ReminderTypeCode,
      rt.ReminderTypeName
    FROM Reminders r
    JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
    WHERE r.ID = ?
  `).get(id);
};

exports.getReminderDetailsById = (id) => {
  return db.prepare(`
    SELECT 
      r.ID,
      r.ReminderTypeID,
      r.ReminderDate AS Date,
      r.IsCompleted,
      rt.ReminderTypeCode,
      rt.ReminderTypeName
    FROM Reminders r
    JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
    WHERE r.ID = ?
  `).get(id);
};

exports.createReminder = (data) => {
  const result = db
    .prepare(
      `INSERT INTO Reminders (ReminderTypeID, ReminderDate, IsCompleted)
       VALUES (?, ?, ?)`
    )
    .run(data.ReminderTypeID, data.Date || null, data.IsCompleted ?? 0);

  return exports.getReminderById(result.lastInsertRowid);
};

exports.updateReminder = (id, data) => {
  const result = db
    .prepare(
      `UPDATE Reminders
       SET ReminderTypeID = ?, ReminderDate = ?, IsCompleted = ?
       WHERE ID = ?`
    )
    .run(
      data.ReminderTypeID,
      data.Date || null,
      data.IsCompleted,
      id
    );

  if (result.changes === 0) return null;
  return exports.getReminderById(id);
};

exports.deleteReminder = (id) => {
  return db.prepare("DELETE FROM Reminders WHERE ID = ?").run(id);
};

exports.deleteRemindersByType = (typeId) => {
  return db.prepare("DELETE FROM Reminders WHERE ReminderTypeID = ?").run(typeId);
};

exports.reminderTypeExists = (id) => {
  const row = db.prepare("SELECT 1 FROM ReminderTypes WHERE Id = ?").get(id);
  return !!row;
};

exports.getTodaysPendingReminders = () => {
  return db
    .prepare(
      `SELECT
        ir.ID,
        ir.InquiryID,
        ir.ReminderID,
        ir.ReminderDate,
        ir.ReminderNote,
        ir.IsDone,
        r.ReminderTypeID,
        r.IsCompleted,
        rt.ReminderTypeCode,
        rt.ReminderTypeName,
        c.Name AS CustomerName
      FROM InquiryReminder ir
      JOIN Reminders r ON ir.ReminderID = r.ID
      JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
      JOIN Inquiry i ON ir.InquiryID = i.InquiryID
      JOIN CustomerM c ON i.CustomerID = c.CustomerID
      WHERE ir.ReminderDate = DATE('now', 'localtime')
        AND ir.IsDone = 0
        AND r.IsCompleted = 0
      ORDER BY ir.ReminderDate ASC`
    )
    .all();
};

exports.getPendingReminders = () => {
  return db.prepare(`
    SELECT r.ID,
      r.ReminderTypeID,
      r.ReminderDate AS Date,
      r.IsCompleted,
      rt.ReminderTypeCode,
      rt.ReminderTypeName
    FROM Reminders r
    JOIN ReminderTypes rt ON r.ReminderTypeID = rt.Id
    WHERE r.IsCompleted = 0
  `).all();
};