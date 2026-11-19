const db = require("../database/connection");

exports.createCashPayment = (data) => {
  const result = db.prepare(`
    INSERT INTO CashPayments (
      PaymentID,
      AmountReceived,
      BalanceToReturn,
      ReceiptPath,
      ReceiptEncIV,
      ReceiptEncAuthTag,
      ReceiptEncKey
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.PaymentID,
    data.AmountReceived,
    data.BalanceToReturn,
    data.ReceiptPath ?? null,
    data.ReceiptEncIV ?? null,
    data.ReceiptEncAuthTag ?? null,
    data.ReceiptEncKey ?? null
  );

  return {
    ID: result.lastInsertRowid,
    ...data
  };
};

exports.getCashPaymentByPaymentId = (paymentId) => {
  return db.prepare(`
    SELECT * FROM CashPayments WHERE PaymentID = ?
  `).get(paymentId);
};

exports.getCashPaymentById = (id) => {
  return db.prepare(`
    SELECT * FROM CashPayments WHERE ID = ?
  `).get(id);
};

exports.deleteCashPaymentByPaymentId = (paymentId) => {
  return db.prepare("DELETE FROM CashPayments WHERE PaymentID = ?").run(paymentId);
};

exports.updateCashPaymentReceipt = (paymentId, receipt) => {
  const value = receipt && receipt.ReceiptPath ? receipt : null
  return db.prepare(`
    UPDATE CashPayments
    SET ReceiptPath = ?, ReceiptEncIV = ?, ReceiptEncAuthTag = ?, ReceiptEncKey = ?
    WHERE PaymentID = ?
  `).run(
    value?.ReceiptPath ?? null,
    value?.ReceiptEncIV ?? null,
    value?.ReceiptEncAuthTag ?? null,
    value?.ReceiptEncKey ?? null,
    paymentId
  )
};