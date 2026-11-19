const db = require("../database/connection");

exports.createChequePaymentReceipt = (data) => {
  const result = db.prepare(`
    INSERT INTO ChequePaymentReceipts (
      ChequePaymentID,
      SortOrder,
      ReceiptPath,
      ReceiptEncIV,
      ReceiptEncAuthTag,
      ReceiptEncKey,
      OriginalFileName
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.ChequePaymentID,
    data.SortOrder ?? 0,
    data.ReceiptPath ?? null,
    data.ReceiptEncIV ?? null,
    data.ReceiptEncAuthTag ?? null,
    data.ReceiptEncKey ?? null,
    data.OriginalFileName ?? null
  );

  return {
    ID: result.lastInsertRowid,
    ...data
  };
};

exports.getChequePaymentReceiptsByChequePaymentId = (chequePaymentId) => {
  return db.prepare(`
    SELECT *
    FROM ChequePaymentReceipts
    WHERE ChequePaymentID = ?
    ORDER BY SortOrder ASC
  `).all(chequePaymentId);
};

exports.deleteChequePaymentReceiptsByChequePaymentId = (chequePaymentId) => {
  return db.prepare(`
    DELETE FROM ChequePaymentReceipts
    WHERE ChequePaymentID = ?
  `).run(chequePaymentId);
};

exports.deleteChequePaymentReceiptById = (id) => {
  return db.prepare(`
    DELETE FROM ChequePaymentReceipts
    WHERE ID = ?
  `).run(id);
};