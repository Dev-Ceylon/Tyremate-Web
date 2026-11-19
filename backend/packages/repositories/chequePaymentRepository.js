const db = require("../database/connection");

exports.createChequePayment = (data) => {
  const result = db.prepare(`
    INSERT INTO ChequePayments (PaymentID, ChequeNumber, ChequeDate, BankName, Amount, Collected)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.PaymentID, data.ChequeNumber, data.ChequeDate, data.BankName, data.Amount, data.Collected ?? 0);

  return {
    ID: result.lastInsertRowid,
    ...data
  };
};

exports.getChequePaymentByPaymentId = (paymentId) => {
  return db.prepare(`
    SELECT * FROM ChequePayments WHERE PaymentID = ?
  `).get(paymentId);
};

exports.deleteChequePaymentByPaymentId = (paymentId) => {
  return db.prepare("DELETE FROM ChequePayments WHERE PaymentID = ?").run(paymentId);
};

exports.updateChequePaymentByPaymentId = (paymentId, data) => {
  return db.prepare(`
    UPDATE ChequePayments
    SET ChequeNumber = ?, ChequeDate = ?, BankName = ?, Amount = ?, Collected = ?
    WHERE PaymentID = ?
  `).run(data.ChequeNumber, data.ChequeDate, data.BankName, data.Amount, data.Collected, paymentId);
};


exports.createChequeReminder = (data) => {
  const result = db.prepare(`
    INSERT INTO ChequeReminder (
      ChequeID,
      ReminderID,
      ReminderDate,
      ReminderNote,
      ReminderAction,
      IsDone
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.ChequeID,
    data.ReminderID,
    data.ReminderDate,
    data.ReminderNote ?? null,
    data.ReminderAction ?? null,
    data.IsDone ?? 0
  );

  return db.prepare(`
    SELECT *
    FROM ChequeReminder
    WHERE ID = ?
  `).get(result.lastInsertRowid);
};

exports.getChequeReminderByChequeId = (chequeId) => {
  return db.prepare(`
    SELECT *
    FROM ChequeReminder
    WHERE ChequeID = ?
  `).all(chequeId);
};

exports.deleteChequeReminderByChequeId = (chequeId) => {
  return db.prepare(`
    DELETE FROM ChequeReminder
    WHERE ChequeID = ?
  `).run(chequeId);
};

exports.getSoIdByChequeReminderId = (chequeReminderId) => {
  return db.prepare(`
    SELECT
      so.SoID
    FROM ChequeReminder cr
    INNER JOIN ChequePayments cp
      ON cp.ID = cr.ChequeID
    INNER JOIN SOPayments sop
      ON sop.PaymentID = cp.PaymentID
    INNER JOIN SO so
      ON so.SoID = sop.SoID
    WHERE cr.ReminderID = ?
  `).get(chequeReminderId);
};

exports.getSoIdsByChequeReminderIds = (chequeReminderIds) => {
  if (!chequeReminderIds.length) return []
  const placeholders = chequeReminderIds.map(() => "?").join(",")
  return db.prepare(`
    SELECT
      cr.ReminderID,
      so.SoID
    FROM ChequeReminder cr
    INNER JOIN ChequePayments cp
      ON cp.ID = cr.ChequeID
    INNER JOIN SOPayments sop
      ON sop.PaymentID = cp.PaymentID
    INNER JOIN SO so
      ON so.SoID = sop.SoID
    WHERE cr.ReminderID IN (${placeholders})
  `).all(...chequeReminderIds);
};