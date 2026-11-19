const db = require("../database/connection")

// ============================================
// RefundM
// ============================================

exports.createRefund = (refund) => {
  const result = db
    .prepare(`
      INSERT INTO RefundM (
        RefundNo,
        CreditNoteID,
        SalesReturnID,
        CustomerID,
        Amount,
        MethodId,
        ReferenceNo,
        StatusId,
        BankAccountId,
        ChequeNo,
        ChequeDate,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      refund.RefundNo,
      refund.CreditNoteID,
      refund.SalesReturnID ?? null,
      refund.CustomerID,
      refund.Amount,
      refund.MethodId,
      refund.ReferenceNo ?? null,
      refund.StatusId ?? 1,
      refund.BankAccountId ?? null,
      refund.ChequeNo ?? null,
      refund.ChequeDate ?? null,
      refund.Notes ?? null
    )

  return exports.getRefundById(result.lastInsertRowid)
}

exports.getRefundById = (id) => {
  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        rss.StatusCode,
        rss.StatusName,
        cn.CreditNoteNo,
        sr.SalesReturnID as SalesReturnRef,
        cus.Name AS CustomerName,
        cus.CustomerCode,
        proc.UserName AS ProcessedByName,
        ba.AccountName AS BankAccountName
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN RefundStatusM rss ON rss.Id = r.StatusId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = r.CreditNoteID
      LEFT JOIN SalesReturn sr ON sr.SalesReturnID = r.SalesReturnID
      LEFT JOIN CustomerM cus ON cus.CustomerID = r.CustomerID
      LEFT JOIN users proc ON proc.id = r.ProcessedBy
      LEFT JOIN Bankdetails ba ON ba.Id = r.BankAccountId
      WHERE r.RefundID = ?
    `)
    .get(id)
}

exports.getRefundByNo = (refundNo) => {
  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        rss.StatusCode,
        rss.StatusName,
        cn.CreditNoteNo
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN RefundStatusM rss ON rss.Id = r.StatusId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = r.CreditNoteID
      WHERE r.RefundNo = ?
    `)
    .get(refundNo)
}

exports.getRefundsByCreditNoteId = (creditNoteId) => {
  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        rss.StatusCode,
        rss.StatusName
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN RefundStatusM rss ON rss.Id = r.StatusId
      WHERE r.CreditNoteID = ?
      ORDER BY r.RefundID ASC
    `)
    .all(creditNoteId)
}

exports.getRefundsBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        rss.StatusCode,
        rss.StatusName
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN RefundStatusM rss ON rss.Id = r.StatusId
      WHERE r.SalesReturnID = ?
      ORDER BY r.RefundID ASC
    `)
    .all(salesReturnId)
}

exports.getRefundsByCustomerId = (customerId) => {
  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        rss.StatusCode,
        rss.StatusName,
        cn.CreditNoteNo
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN RefundStatusM rss ON rss.Id = r.StatusId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = r.CreditNoteID
      WHERE r.CustomerID = ?
      ORDER BY r.RefundID DESC
    `)
    .all(customerId)
}

exports.getPendingRefunds = () => {
  const pendingStatusId = db.prepare('SELECT Id FROM RefundStatusM WHERE StatusCode = ?').get('PENDING')?.Id
  if (!pendingStatusId) return []

  return db
    .prepare(`
      SELECT
        r.*,
        rms.MethodCode,
        rms.MethodName,
        cn.CreditNoteNo,
        cus.Name AS CustomerName,
        cus.CustomerCode
      FROM RefundM r
      LEFT JOIN RefundMethodM rms ON rms.Id = r.MethodId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = r.CreditNoteID
      LEFT JOIN CustomerM cus ON cus.CustomerID = r.CustomerID
      WHERE r.StatusId = ?
      ORDER BY r.CreatedAt ASC
    `)
    .all(pendingStatusId)
}

exports.updateRefundStatus = (refundId, statusId, payload = {}) => {
  const fields = ['StatusId = ?']
  const values = [statusId]

  if (payload.ProcessedBy !== undefined) {
    fields.push('ProcessedBy = ?')
    values.push(payload.ProcessedBy)
  }
  if (payload.ProcessedDate !== undefined) {
    fields.push('ProcessedDate = ?')
    values.push(payload.ProcessedDate)
  } else if (payload.setProcessedDate) {
    fields.push("ProcessedDate = datetime('now','localtime')")
  }
  if (payload.ReferenceNo !== undefined) {
    fields.push('ReferenceNo = ?')
    values.push(payload.ReferenceNo)
  }
  if (payload.BankAccountId !== undefined) {
    fields.push('BankAccountId = ?')
    values.push(payload.BankAccountId)
  }
  if (payload.ChequeNo !== undefined) {
    fields.push('ChequeNo = ?')
    values.push(payload.ChequeNo)
  }
  if (payload.ChequeDate !== undefined) {
    fields.push('ChequeDate = ?')
    values.push(payload.ChequeDate)
  }
  if (payload.Notes !== undefined) {
    fields.push('Notes = ?')
    values.push(payload.Notes)
  }

  values.push(refundId)

  return db
    .prepare(`UPDATE RefundM SET ${fields.join(', ')} WHERE RefundID = ?`)
    .run(...values)
}

exports.updateRefundDetails = (refundId, updates) => {
  const fields = []
  const values = []

  if (updates.Amount !== undefined) {
    fields.push('Amount = ?')
    values.push(updates.Amount)
  }
  if (updates.MethodId !== undefined) {
    fields.push('MethodId = ?')
    values.push(updates.MethodId)
  }
  if (updates.ReferenceNo !== undefined) {
    fields.push('ReferenceNo = ?')
    values.push(updates.ReferenceNo)
  }
  if (updates.BankAccountId !== undefined) {
    fields.push('BankAccountId = ?')
    values.push(updates.BankAccountId)
  }
  if (updates.ChequeNo !== undefined) {
    fields.push('ChequeNo = ?')
    values.push(updates.ChequeNo)
  }
  if (updates.ChequeDate !== undefined) {
    fields.push('ChequeDate = ?')
    values.push(updates.ChequeDate)
  }
  if (updates.Notes !== undefined) {
    fields.push('Notes = ?')
    values.push(updates.Notes)
  }

  if (fields.length === 0) return { changes: 0 }

  values.push(refundId)
  return db.prepare(`UPDATE RefundM SET ${fields.join(', ')} WHERE RefundID = ?`).run(...values)
}

exports.deleteRefund = (refundId) => {
  const r = db.prepare('SELECT StatusId FROM RefundM WHERE RefundID = ?').get(refundId)
  if (!r) return { changes: 0 }
  const status = db.prepare('SELECT StatusCode FROM RefundStatusM WHERE Id = ?').get(r.StatusId)
  if (status?.StatusCode !== 'PENDING') {
    throw new Error('Can only delete refunds in PENDING status')
  }
  return db.prepare('DELETE FROM RefundM WHERE RefundID = ?').run(refundId)
}