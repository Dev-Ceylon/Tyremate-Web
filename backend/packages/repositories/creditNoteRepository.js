const db = require("../database/connection")

// ============================================
// CreditNoteM (Header)
// ============================================

exports.createCreditNote = (creditNote) => {
  const result = db
    .prepare(`
      INSERT INTO CreditNoteM (
        CreditNoteNo,
        InvoiceID,
        SalesReturnID,
        CustomerID,
        SourceTypeId,
        ReasonId,
        StatusId,
        SubTotal,
        TaxAmount,
        TotalAmount,
        CurrencyCode,
        ExchangeRate,
        Notes,
        RequestedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      creditNote.CreditNoteNo,
      creditNote.InvoiceID,
      creditNote.SalesReturnID ?? null,
      creditNote.CustomerID,
      creditNote.SourceTypeId,
      creditNote.ReasonId,
      creditNote.StatusId,
      creditNote.SubTotal ?? 0,
      creditNote.TaxAmount ?? 0,
      creditNote.TotalAmount ?? 0,
      creditNote.CurrencyCode ?? 'LKR',
      creditNote.ExchangeRate ?? 1,
      creditNote.Notes ?? null,
      creditNote.RequestedBy ?? null
    )

  return exports.getCreditNoteById(result.lastInsertRowid)
}

exports.getCreditNoteById = (id) => {
  return db
    .prepare(`
      SELECT
        cn.*,
        cns.StatusCode,
        cns.StatusName,
        cnr.ReasonCode,
        cnr.ReasonName,
        cnsrc.SourceCode,
        cnsrc.SourceName,
        inv.InvoiceNumber,
        cus.Name AS CustomerName,
        cus.CustomerCode,
        req.UserName AS RequestedByName,
        apr.UserName AS ApprovedByName
      FROM CreditNoteM cn
      LEFT JOIN CreditNoteStatusM cns ON cns.Id = cn.StatusId
      LEFT JOIN CreditNoteReasonM cnr ON cnr.Id = cn.ReasonId
      LEFT JOIN CreditNoteSourceM cnsrc ON cnsrc.Id = cn.SourceTypeId
      LEFT JOIN Invoice inv ON inv.InvoiceID = cn.InvoiceID
      LEFT JOIN CustomerM cus ON cus.CustomerID = cn.CustomerID
      LEFT JOIN users req ON req.id = cn.RequestedBy
      LEFT JOIN users apr ON apr.id = cn.ApprovedBy
      WHERE cn.CreditNoteID = ?
    `)
    .get(id)
}

exports.getCreditNoteByNo = (creditNoteNo) => {
  return db
    .prepare(`
      SELECT
        cn.*,
        cns.StatusCode,
        cns.StatusName,
        cnr.ReasonCode,
        cnr.ReasonName,
        cnsrc.SourceCode,
        cnsrc.SourceName,
        inv.InvoiceNumber,
        cus.Name AS CustomerName,
        cus.CustomerCode
      FROM CreditNoteM cn
      LEFT JOIN CreditNoteStatusM cns ON cns.Id = cn.StatusId
      LEFT JOIN CreditNoteReasonM cnr ON cnr.Id = cn.ReasonId
      LEFT JOIN CreditNoteSourceM cnsrc ON cnsrc.Id = cn.SourceTypeId
      LEFT JOIN Invoice inv ON inv.InvoiceID = cn.InvoiceID
      LEFT JOIN CustomerM cus ON cus.CustomerID = cn.CustomerID
      WHERE cn.CreditNoteNo = ?
    `)
    .get(creditNoteNo)
}

exports.getCreditNotesByInvoiceId = (invoiceId) => {
  return db
    .prepare(`
      SELECT
        cn.*,
        cns.StatusCode,
        cns.StatusName,
        cnr.ReasonCode,
        cnr.ReasonName
      FROM CreditNoteM cn
      LEFT JOIN CreditNoteStatusM cns ON cns.Id = cn.StatusId
      LEFT JOIN CreditNoteReasonM cnr ON cnr.Id = cn.ReasonId
      WHERE cn.InvoiceID = ?
      ORDER BY cn.CreditNoteID DESC
    `)
    .all(invoiceId)
}

exports.getCreditNotesBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`
      SELECT
        cn.*,
        cns.StatusCode,
        cns.StatusName,
        cnr.ReasonCode,
        cnr.ReasonName
      FROM CreditNoteM cn
      LEFT JOIN CreditNoteStatusM cns ON cns.Id = cn.StatusId
      LEFT JOIN CreditNoteReasonM cnr ON cnr.Id = cn.ReasonId
      WHERE cn.SalesReturnID = ?
      ORDER BY cn.CreditNoteID DESC
    `)
    .all(salesReturnId)
}

exports.getCreditNotesByCustomerId = (customerId) => {
  return db
    .prepare(`
      SELECT
        cn.*,
        cns.StatusCode,
        cns.StatusName,
        cnr.ReasonCode,
        cnr.ReasonName,
        inv.InvoiceNumber
      FROM CreditNoteM cn
      LEFT JOIN CreditNoteStatusM cns ON cns.Id = cn.StatusId
      LEFT JOIN CreditNoteReasonM cnr ON cnr.Id = cn.ReasonId
      LEFT JOIN Invoice inv ON inv.InvoiceID = cn.InvoiceID
      WHERE cn.CustomerID = ?
      ORDER BY cn.CreditNoteID DESC
    `)
    .all(customerId)
}

exports.updateCreditNoteStatus = (creditNoteId, statusId, payload = {}) => {
  const fields = ['StatusId = ?']
  const values = [statusId]

  if (payload.ApprovedBy !== undefined) {
    fields.push('ApprovedBy = ?')
    values.push(payload.ApprovedBy)
  }
  if (payload.ApprovedDate !== undefined) {
    fields.push('ApprovedDate = ?')
    values.push(payload.ApprovedDate)
  } else if (payload.setApprovedDate) {
    fields.push("ApprovedDate = datetime('now','localtime')")
  }
  if (payload.CancelledBy !== undefined) {
    fields.push('CancelledBy = ?')
    values.push(payload.CancelledBy)
  }
  if (payload.CancelledDate !== undefined) {
    fields.push('CancelledDate = ?')
    values.push(payload.CancelledDate)
  } else if (payload.setCancelledDate) {
    fields.push("CancelledDate = datetime('now','localtime')")
  }
  if (payload.CancellationReason !== undefined) {
    fields.push('CancellationReason = ?')
    values.push(payload.CancellationReason)
  }
  if (payload.Notes !== undefined) {
    fields.push('Notes = ?')
    values.push(payload.Notes)
  }

  fields.push('UpdatedAt = datetime(\'now\',\'localtime\')')
  values.push(creditNoteId)

  return db
    .prepare(`UPDATE CreditNoteM SET ${fields.join(', ')} WHERE CreditNoteID = ?`)
    .run(...values)
}

exports.deleteCreditNote = (creditNoteId) => {
  // Only allow deletion if status is REQUESTED
  const cn = db.prepare('SELECT StatusId FROM CreditNoteM WHERE CreditNoteID = ?').get(creditNoteId)
  if (!cn) return { changes: 0 }
  const status = db.prepare('SELECT StatusCode FROM CreditNoteStatusM WHERE Id = ?').get(cn.StatusId)
  if (status?.StatusCode !== 'REQUESTED') {
    throw new Error('Can only delete credit notes in REQUESTED status')
  }
  return db.prepare('DELETE FROM CreditNoteM WHERE CreditNoteID = ?').run(creditNoteId)
}

// ============================================
// CreditNoteLineM (Lines)
// ============================================

exports.createCreditNoteLine = (line) => {
  const result = db
    .prepare(`
      INSERT INTO CreditNoteLineM (
        CreditNoteID,
        TyreID,
        Description,
        Qty,
        UnitPrice,
        Discount,
        TaxRate,
        TaxAmount,
        LineAmount,
        TyreSerialNo,
        AllocationId
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      line.CreditNoteID,
      line.TyreID ?? null,
      line.Description,
      line.Qty,
      line.UnitPrice ?? 0,
      line.Discount ?? 0,
      line.TaxRate ?? 0,
      line.TaxAmount ?? 0,
      line.LineAmount ?? 0,
      line.TyreSerialNo ?? null,
      line.AllocationId ?? null
    )

  return exports.getCreditNoteLineById(result.lastInsertRowid)
}

exports.getCreditNoteLineById = (id) => {
  return db
    .prepare(`
      SELECT
        cnl.*,
        t.Brand,
        t.Size,
        t.Pattern
      FROM CreditNoteLineM cnl
      LEFT JOIN TyreM t ON t.Id = cnl.TyreID
      WHERE cnl.CreditNoteLineID = ?
    `)
    .get(id)
}

exports.getCreditNoteLines = (creditNoteId) => {
  return db
    .prepare(`
      SELECT
        cnl.*,
        t.Brand,
        t.Size,
        t.Pattern
      FROM CreditNoteLineM cnl
      LEFT JOIN TyreM t ON t.Id = cnl.TyreID
      WHERE cnl.CreditNoteID = ?
      ORDER BY cnl.CreditNoteLineID ASC
    `)
    .all(creditNoteId)
}

exports.deleteCreditNoteLines = (creditNoteId) => {
  return db.prepare('DELETE FROM CreditNoteLineM WHERE CreditNoteID = ?').run(creditNoteId)
}

exports.updateCreditNoteLine = (lineId, updates) => {
  const fields = []
  const values = []

  if (updates.Qty !== undefined) {
    fields.push('Qty = ?')
    values.push(updates.Qty)
  }
  if (updates.UnitPrice !== undefined) {
    fields.push('UnitPrice = ?')
    values.push(updates.UnitPrice)
  }
  if (updates.Discount !== undefined) {
    fields.push('Discount = ?')
    values.push(updates.Discount)
  }
  if (updates.TaxRate !== undefined) {
    fields.push('TaxRate = ?')
    values.push(updates.TaxRate)
  }
  if (updates.TaxAmount !== undefined) {
    fields.push('TaxAmount = ?')
    values.push(updates.TaxAmount)
  }
  if (updates.LineAmount !== undefined) {
    fields.push('LineAmount = ?')
    values.push(updates.LineAmount)
  }
  if (updates.Description !== undefined) {
    fields.push('Description = ?')
    values.push(updates.Description)
  }
  if (updates.TyreSerialNo !== undefined) {
    fields.push('TyreSerialNo = ?')
    values.push(updates.TyreSerialNo)
  }

  if (fields.length === 0) return { changes: 0 }

  values.push(lineId)
  return db.prepare(`UPDATE CreditNoteLineM SET ${fields.join(', ')} WHERE CreditNoteLineID = ?`).run(...values)
}
