const db = require("../database/connection")

exports.createBankTransferPayment = (data) => {
  const stmt = db.prepare(`
    INSERT INTO BankTransferPayments (
      PaymentID,
      BankDetailsID,
      Amount,
      ReceiptPath,
      ReceiptEncIV,
      ReceiptEncAuthTag,
      ReceiptEncKey
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    data.PaymentID,
    data.BankDetailsID,
    data.Amount,
    data.ReceiptPath ?? null,
    data.ReceiptEncIV ?? null,
    data.ReceiptEncAuthTag ?? null,
    data.ReceiptEncKey ?? null
  )
  return { ID: info.lastInsertRowid, ...data }
}

exports.getBankTransferPaymentByPaymentId = (paymentId) => {
  return db.prepare(`
    SELECT * FROM BankTransferPayments WHERE PaymentID = ?
  `).get(paymentId)
}

exports.deleteBankTransferPaymentByPaymentId = (paymentId) => {
  return db.prepare(`
    DELETE FROM BankTransferPayments WHERE PaymentID = ?
  `).run(paymentId)
}

exports.updateBankTransferPaymentReceipt = (paymentId, receipt) => {
  const value = receipt && receipt.ReceiptPath ? receipt : null
  return db.prepare(`
    UPDATE BankTransferPayments
    SET ReceiptPath = ?, ReceiptEncIV = ?, ReceiptEncAuthTag = ?, ReceiptEncKey = ?
    WHERE PaymentID = ?
  `).run(
    value?.ReceiptPath ?? null,
    value?.ReceiptEncIV ?? null,
    value?.ReceiptEncAuthTag ?? null,
    value?.ReceiptEncKey ?? null,
    paymentId
  )
}