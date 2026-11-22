const db = require("../database/connection")

exports.createInvoiceLine = (line) => {
  const result = db
    .prepare(`
      INSERT INTO InvoiceLine (
        InvoiceID,
        LineType,
        TyreID,
        BatteryID,
        SerialNo,
        Description,
        Size,
        Pattern,
        Brand,
        Model,
        Capacity,
        Voltage,
        Qty,
        UnitPrice,
        Discount,
        LineTotal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      line.InvoiceID,
      line.LineType,
      line.TyreID ?? null,
      line.BatteryID ?? null,
      line.SerialNo ?? null,
      line.Description ?? null,
      line.Size ?? null,
      line.Pattern ?? null,
      line.Brand ?? null,
      line.Model ?? null,
      line.Capacity ?? null,
      line.Voltage ?? null,
      line.Qty ?? 0,
      line.UnitPrice ?? 0,
      line.Discount ?? 0,
      line.LineTotal ?? 0
    )

  return Number(result.lastInsertRowid)
}

exports.getInvoiceLinesByInvoiceId = (invoiceId) => {
  return db
    .prepare(`
      SELECT
        InvoiceLineID,
        InvoiceID,
        LineType,
        TyreID,
        BatteryID,
        SerialNo,
        Description,
        Size,
        Pattern,
        Brand,
        Model,
        Capacity,
        Voltage,
        Qty,
        UnitPrice,
        Discount,
        LineTotal
      FROM InvoiceLine
      WHERE InvoiceID = ?
      ORDER BY InvoiceLineID ASC
    `)
    .all(invoiceId)
}

exports.deleteInvoiceLinesByInvoiceId = (invoiceId) => {
  return db.prepare("DELETE FROM InvoiceLine WHERE InvoiceID = ?").run(invoiceId)
}
