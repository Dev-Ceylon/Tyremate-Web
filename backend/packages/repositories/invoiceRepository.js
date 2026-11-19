const db = require("../database/connection")

const INVOICE_SELECT = `
  SELECT
    i.InvoiceID,
    i.InvoiceNumber,
    i.InvoiceDate,
    i.DueDate,
    i.CreatedDateTime,
    i.SourceTypeId,
    src.SourceCode AS SourceType,
    i.SourceID,
    i.CustomerID,
    i.WalkinCustomerID,
    i.CustomerName,
    i.CustomerAddress,
    i.CustomerPhone,
    i.CustomerVatNo,
    i.Subtotal,
    i.DiscountTotal,
    i.TaxLabel,
    i.TaxAmount,
    i.Total,
    i.AmountPaid,
    i.BalanceDue,
    i.StatusId,
    st.StatusCode AS Status,
    i.IsCreditNote,
    i.CreditNoteOf,
    i.Notes,
    i.VoidReason,
    i.CreatedBy
  FROM Invoice i
  INNER JOIN InvoiceStatusM st ON st.Id = i.StatusId
  INNER JOIN InvoiceSourceM src ON src.Id = i.SourceTypeId
`

exports.createInvoice = (invoice) => {
  const result = db
    .prepare(`
      INSERT INTO Invoice (
        InvoiceNumber,
        InvoiceDate,
        DueDate,
        SourceTypeId,
        SourceID,
        CustomerID,
        WalkinCustomerID,
        CustomerName,
        CustomerAddress,
        CustomerPhone,
        CustomerVatNo,
        Subtotal,
        DiscountTotal,
        TaxLabel,
        TaxAmount,
        Total,
        AmountPaid,
        BalanceDue,
        StatusId,
        IsCreditNote,
        CreditNoteOf,
        Notes,
        VoidReason,
        CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      invoice.InvoiceNumber ?? null,
      invoice.InvoiceDate,
      invoice.DueDate ?? null,
      invoice.SourceTypeId,
      invoice.SourceID ?? null,
      invoice.CustomerID ?? null,
      invoice.WalkinCustomerID ?? null,
      invoice.CustomerName ?? null,
      invoice.CustomerAddress ?? null,
      invoice.CustomerPhone ?? null,
      invoice.CustomerVatNo ?? null,
      invoice.Subtotal ?? 0,
      invoice.DiscountTotal ?? 0,
      invoice.TaxLabel ?? null,
      invoice.TaxAmount ?? 0,
      invoice.Total ?? 0,
      invoice.AmountPaid ?? 0,
      invoice.BalanceDue ?? 0,
      invoice.StatusId,
      invoice.IsCreditNote ? 1 : 0,
      invoice.CreditNoteOf ?? null,
      invoice.Notes ?? null,
      invoice.VoidReason ?? null,
      invoice.CreatedBy ?? null
    )

  return Number(result.lastInsertRowid)
}

exports.setInvoiceNumber = (invoiceId, invoiceNumber) => {
  db.prepare("UPDATE Invoice SET InvoiceNumber = ? WHERE InvoiceID = ?").run(
    invoiceNumber,
    invoiceId
  )
}

exports.getInvoiceById = (invoiceId) => {
  return db.prepare(`${INVOICE_SELECT} WHERE i.InvoiceID = ?`).get(invoiceId)
}

// The single non-credit invoice generated for a given source (SO / other
// service / direct record). Used for idempotent auto-generation.
exports.getInvoiceBySource = (sourceTypeId, sourceId) => {
  return db
    .prepare(`
      ${INVOICE_SELECT}
      WHERE i.SourceTypeId = ? AND i.SourceID = ? AND i.IsCreditNote = 0
      ORDER BY i.InvoiceID DESC
      LIMIT 1
    `)
    .get(sourceTypeId, sourceId)
}

exports.getAllInvoices = () => {
  return db.prepare(`${INVOICE_SELECT} ORDER BY i.InvoiceID DESC`).all()
}

exports.getCreditNotesByInvoiceId = (invoiceId) => {
  return db
    .prepare(`${INVOICE_SELECT} WHERE i.CreditNoteOf = ? ORDER BY i.InvoiceID DESC`)
    .all(invoiceId)
}

// Outstanding = not settled and not cancelled. Paid/cancelled status Ids are
// supplied by the caller so this repository stays free of lookup knowledge.
exports.getOutstandingInvoices = (excludedStatusIds = []) => {
  const placeholders = excludedStatusIds.map(() => "?").join(", ")
  const statusClause = excludedStatusIds.length
    ? `i.StatusId NOT IN (${placeholders})`
    : "1 = 1"

  return db
    .prepare(`
      ${INVOICE_SELECT}
      WHERE ${statusClause}
        AND i.BalanceDue > 0
        AND i.IsCreditNote = 0
      ORDER BY (i.DueDate IS NULL) ASC, i.DueDate ASC, i.InvoiceID DESC
    `)
    .all(...excludedStatusIds)
}

exports.updateInvoiceMeta = (invoiceId, { DueDate, Notes, TaxLabel, TaxAmount, Total }) => {
  db.prepare(`
    UPDATE Invoice
    SET DueDate = ?, Notes = ?, TaxLabel = ?, TaxAmount = ?, Total = ?
    WHERE InvoiceID = ?
  `).run(DueDate ?? null, Notes ?? null, TaxLabel ?? null, TaxAmount ?? 0, Total ?? 0, invoiceId)
}

exports.updateInvoiceSettlement = (invoiceId, { AmountPaid, BalanceDue, StatusId }) => {
  db.prepare(`
    UPDATE Invoice
    SET AmountPaid = ?, BalanceDue = ?, StatusId = ?
    WHERE InvoiceID = ?
  `).run(AmountPaid, BalanceDue, StatusId, invoiceId)
}

exports.updateInvoiceStatus = (invoiceId, statusId) => {
  return db
    .prepare("UPDATE Invoice SET StatusId = ? WHERE InvoiceID = ?")
    .run(statusId, invoiceId)
}

exports.cancelInvoice = (invoiceId, voidReason, statusId) => {
  return db
    .prepare("UPDATE Invoice SET StatusId = ?, VoidReason = ? WHERE InvoiceID = ?")
    .run(statusId, voidReason ?? null, invoiceId)
}

exports.deleteInvoice = (invoiceId) => {
  return db.prepare("DELETE FROM Invoice WHERE InvoiceID = ?").run(invoiceId)
}
