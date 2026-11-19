const db = require("../database/connection")

exports.createInvoicePaymentLink = ({ InvoiceID, PaymentID, AmountApplied = 0 }) => {
  const result = db
    .prepare(`
      INSERT OR IGNORE INTO InvoicePaymentLink (InvoiceID, PaymentID, AmountApplied)
      VALUES (?, ?, ?)
    `)
    .run(InvoiceID, PaymentID, AmountApplied)

  return Number(result.lastInsertRowid)
}

exports.linkPaymentToInvoice = ({ InvoiceID, PaymentID, AmountApplied = 0 }) => {
  return db
    .prepare(`
      INSERT INTO InvoicePaymentLink (InvoiceID, PaymentID, AmountApplied)
      VALUES (?, ?, ?)
      ON CONFLICT(InvoiceID, PaymentID) DO UPDATE SET AmountApplied = InvoicePaymentLink.AmountApplied + excluded.AmountApplied
    `)
    .run(InvoiceID, PaymentID, AmountApplied)
}

exports.getLinksByInvoiceId = (invoiceId) => {
  return db
    .prepare(`
      SELECT ID, InvoiceID, PaymentID, AmountApplied, CreatedDateTime
      FROM InvoicePaymentLink
      WHERE InvoiceID = ?
      ORDER BY ID ASC
    `)
    .all(invoiceId)
}

exports.getLinksByPaymentId = (paymentId) => {
  return db
    .prepare(`
      SELECT link.ID, link.InvoiceID, invoice.InvoiceNumber, link.PaymentID,
             link.AmountApplied, link.CreatedDateTime
      FROM InvoicePaymentLink link
      INNER JOIN Invoice invoice ON invoice.InvoiceID = link.InvoiceID
      WHERE link.PaymentID = ?
      ORDER BY link.ID ASC
    `)
    .all(paymentId)
}

exports.deleteLinksByInvoiceId = (invoiceId) => {
  return db.prepare("DELETE FROM InvoicePaymentLink WHERE InvoiceID = ?").run(invoiceId)
}
