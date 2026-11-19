const db = require("../database/connection")

// ============================================
// CustomerCreditM (Balance)
// ============================================

exports.getCustomerCredit = (customerId) => {
  return db
    .prepare(`
      SELECT
        cc.*,
        cus.Name AS CustomerName,
        cus.CustomerCode
      FROM CustomerCreditM cc
      LEFT JOIN CustomerM cus ON cus.CustomerID = cc.CustomerID
      WHERE cc.CustomerID = ?
    `)
    .get(customerId)
}

exports.getOrCreateCustomerCredit = (customerId) => {
  let credit = exports.getCustomerCredit(customerId)
  if (!credit) {
    const result = db
      .prepare('INSERT INTO CustomerCreditM (CustomerID) VALUES (?)')
      .run(customerId)
    credit = exports.getCustomerCredit(customerId)
  }
  return credit
}

exports.adjustCustomerCredit = (customerId, amount, type, options = {}) => {
  // amount: positive for ISSUED/REFUNDED, negative for USED/EXPIRED/ADJUSTED
  const typeMap = {
    ISSUED: 1,
    USED: -1,
    REFUNDED: 1,
    EXPIRED: -1,
    ADJUSTED: options.adjustmentDirection === 'increase' ? 1 : -1,
  }

  const multiplier = typeMap[type]
  if (multiplier === undefined) {
    throw new Error(`Invalid credit transaction type: ${type}`)
  }

  const delta = Math.abs(amount) * multiplier

  const credit = exports.getOrCreateCustomerCredit(customerId)
  const newAvailable = Number(credit.AvailableAmount ?? 0) + delta
  const newTotalIssued = Number(credit.TotalIssued ?? 0) + (multiplier > 0 ? amount : 0)
  const newTotalUsed = Number(credit.TotalUsed ?? 0) + (multiplier < 0 ? amount : 0)

  if (newAvailable < 0) {
    throw new Error(`Insufficient credit balance for customer ${customerId}. Available: ${credit.AvailableAmount}, Requested: ${amount}`)
  }

  const transaction = db.transaction(() => {
    // Update balance
    db.prepare(`
      UPDATE CustomerCreditM
      SET AvailableAmount = ?,
          TotalIssued = ?,
          TotalUsed = ?,
          LastUpdated = datetime('now','localtime')
      WHERE CustomerID = ?
    `).run(newAvailable, newTotalIssued, newTotalUsed, customerId)

    // Record transaction
    const typeIdMap = {
      ISSUED: 'ISSUED',
      USED: 'USED',
      REFUNDED: 'REFUNDED',
      EXPIRED: 'EXPIRED',
      ADJUSTED: 'ADJUSTED',
    }

    const typeCode = typeIdMap[type]
    if (!typeCode) throw new Error(`Invalid type for mapping: ${type}`)

    const typeId = db.prepare('SELECT Id FROM CreditTransactionTypeM WHERE TypeCode = ?').get(typeCode)?.Id
    if (!typeId) throw new Error(`CreditTransactionType not found: ${typeCode}`)

    db.prepare(`
      INSERT INTO CustomerCreditTransactionM (
        CustomerID,
        CreditNoteID,
        RefundID,
        TypeId,
        Amount,
        BalanceAfter,
        Reference,
        CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      options.CreditNoteID ?? null,
      options.RefundID ?? null,
      typeId,
      amount,
      newAvailable,
      options.Reference ?? null,
      options.CreatedBy ?? null
    )

    return exports.getCustomerCredit(customerId)
  })

  return transaction()
}

exports.getCustomerCreditTransactions = (customerId, limit = 100) => {
  return db
    .prepare(`
      SELECT
        cct.*,
        ctt.TypeCode,
        ctt.TypeName,
        cn.CreditNoteNo,
        r.RefundNo,
        usr.UserName AS CreatedByName
      FROM CustomerCreditTransactionM cct
      LEFT JOIN CreditTransactionTypeM ctt ON ctt.Id = cct.TypeId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = cct.CreditNoteID
      LEFT JOIN RefundM r ON r.RefundID = cct.RefundID
      LEFT JOIN users usr ON usr.id = cct.CreatedBy
      WHERE cct.CustomerID = ?
      ORDER BY cct.TransactionID DESC
      LIMIT ?
    `)
    .all(customerId, limit)
}

exports.getCustomerCreditById = (customerId) => {
  return exports.getCustomerCredit(customerId)
}

exports.resetCustomerCredit = (customerId) => {
  // Admin only - reset to zero
  return db.prepare(`
    UPDATE CustomerCreditM
    SET AvailableAmount = 0,
        TotalIssued = 0,
        TotalUsed = 0,
        LastUpdated = datetime('now','localtime')
    WHERE CustomerID = ?
  `).run(customerId)
}

// ============================================
// CustomerCreditTransactionM (Audit Trail)
// ============================================

exports.getCreditTransactionById = (id) => {
  return db
    .prepare(`
      SELECT
        cct.*,
        ctt.TypeCode,
        ctt.TypeName,
        cn.CreditNoteNo,
        r.RefundNo,
        cus.Name AS CustomerName,
        usr.UserName AS CreatedByName
      FROM CustomerCreditTransactionM cct
      LEFT JOIN CreditTransactionTypeM ctt ON ctt.Id = cct.TypeId
      LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = cct.CreditNoteID
      LEFT JOIN RefundM r ON r.RefundID = cct.RefundID
      LEFT JOIN CustomerM cus ON cus.CustomerID = cct.CustomerID
      LEFT JOIN users usr ON usr.id = cct.CreatedBy
      WHERE cct.TransactionID = ?
    `)
    .get(id)
}

exports.getAllCreditTransactions = (filters = {}) => {
  let where = 'WHERE 1=1'
  const params = []

  if (filters.CustomerID) {
    where += ' AND cct.CustomerID = ?'
    params.push(filters.CustomerID)
  }
  if (filters.TypeId) {
    where += ' AND cct.TypeId = ?'
    params.push(filters.TypeId)
  }
  if (filters.CreditNoteID) {
    where += ' AND cct.CreditNoteID = ?'
    params.push(filters.CreditNoteID)
  }
  if (filters.RefundID) {
    where += ' AND cct.RefundID = ?'
    params.push(filters.RefundID)
  }
  if (filters.DateFrom) {
    where += ' AND date(cct.CreatedAt) >= ?'
    params.push(filters.DateFrom)
  }
  if (filters.DateTo) {
    where += ' AND date(cct.CreatedAt) <= ?'
    params.push(filters.DateTo)
  }

  const query = `
    SELECT
      cct.*,
      ctt.TypeCode,
      ctt.TypeName,
      cus.Name AS CustomerName,
      cus.CustomerCode,
      cn.CreditNoteNo,
      r.RefundNo,
      usr.UserName AS CreatedByName
    FROM CustomerCreditTransactionM cct
    LEFT JOIN CreditTransactionTypeM ctt ON ctt.Id = cct.TypeId
    LEFT JOIN CustomerM cus ON cus.CustomerID = cct.CustomerID
    LEFT JOIN CreditNoteM cn ON cn.CreditNoteID = cct.CreditNoteID
    LEFT JOIN RefundM r ON r.RefundID = cct.RefundID
    LEFT JOIN users usr ON usr.id = cct.CreatedBy
    ${where}
    ORDER BY cct.TransactionID DESC
  `
  if (filters.Limit) {
    params.push(filters.Limit)
    return db.prepare(query + ' LIMIT ?').all(...params)
  }
  return db.prepare(query).all(...params)
}