const db = require("../database/connection")
const inquiryBatteriesRepo = require("./inquiryBatteriesRepository")

// "Available to sell" stock: only Default (df) locations count, matching the
// sales-order auto-PO drain logic so inquiry NeedToOrderQty cannot disagree
// with what an SO can actually fulfil.
const AVAILABLE_STOCK_SQL = `
        SELECT sm.TyreId, SUM(sm.Qty) AS AvailableQuantity
        FROM StorageManager sm
        INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
        INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
        WHERE LOWER(slt.LocationTypeCode) = 'df'
        GROUP BY sm.TyreId
      `

exports.getAllInquiries = () => {
  return db.prepare(`
    SELECT i.*, COALESCE(i.Category, 'tyre') AS Category, COALESCE(i.IsCompleted, 0) AS IsCompleted, c.Name AS CustomerName, c.CustomerCode
    FROM Inquiry i
    LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
  `).all()
}

exports.getInquiryById = (id) => {
  return db.prepare(`
    SELECT i.*, COALESCE(i.Category, 'tyre') AS Category, COALESCE(i.IsCompleted, 0) AS IsCompleted, c.Name AS CustomerName, c.CustomerCode
    FROM Inquiry i
    LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
    WHERE i.InquiryID = ?
  `).get(id)
}

exports.getInquiryByReminderId = (reminderId) => {
  return db
    .prepare(`
      SELECT i.*, COALESCE(i.Category, 'tyre') AS Category, COALESCE(i.IsCompleted, 0) AS IsCompleted, c.Name AS CustomerName, c.CustomerCode, i.Notes AS InquiryNotes
      FROM Inquiry i
      INNER JOIN InquiryReminder ir ON ir.InquiryID = i.InquiryID
      LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
      WHERE ir.ReminderID = ?
    `)
    .get(reminderId)
}

exports.getInquiryTyresByInquiryId = (inquiryId) => {
  return db.prepare(`
    SELECT 
      it.*, 
      t.Size, 
      t.Pattern, 
      t.Brand,
      COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity
    FROM InquiryTyres it
    INNER JOIN TyreM t ON t.Id = it.TyreID
    LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
    ) stock ON stock.TyreId = it.TyreID
    WHERE it.InquiryID = ?
    ORDER BY it.ID DESC
  `).all(inquiryId)
}

exports.getInquiryBatteriesByInquiryId = (inquiryId) => {
  return inquiryBatteriesRepo.getInquiryBatteriesByInquiryId(inquiryId)
}

exports.createInquiry = (data) => {
  const category = (data.Category || "tyre").toLowerCase()
  const isCompleted = data.IsCompleted ? 1 : 0
  const result = db
    .prepare(
      `INSERT INTO Inquiry (Date, Category, CustomerID, Notes, IsAdminApproved, ConvertedSOID, IsCompleted, SalesRepID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(data.Date, category, data.CustomerID, data.Notes, data.IsAdminApproved, data.ConvertedSOID, isCompleted, data.SalesRepID || null)
  return result.lastInsertRowid
}

exports.createInquiryTyre = (data) => {
  return db
    .prepare(
      `INSERT INTO InquiryTyres (InquiryID, TyreID, Price, Discount, Qty, IsAdminApproved)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.InquiryID,
      data.TyreID,
      data.Price,
      data.Discount,
      data.Qty,
      data.IsAdminApproved
    )
}

exports.createInquiryBattery = (data) => {
  return inquiryBatteriesRepo.createInquiryBattery(data)
}

exports.updateInquiry = (id, data) => {
  const category = (data.Category || "tyre").toLowerCase()
  const isCompleted = data.IsCompleted ? 1 : 0
  const result = db
    .prepare(
      `UPDATE Inquiry
       SET Date = ?, Category = ?, CustomerID = ?, Notes = ?, IsAdminApproved = ?, ConvertedSOID = ?, IsCompleted = ?, SalesRepID = COALESCE(?, SalesRepID)
       WHERE InquiryID = ?`
    )
    .run(
      data.Date,
      category,
      data.CustomerID,
      data.Notes,
      data.IsAdminApproved,
      data.ConvertedSOID,
      isCompleted,
      data.SalesRepID !== undefined ? data.SalesRepID : null,
      id
    )
  return result.changes > 0
}

exports.deleteInquiry = (id) => {
  return db.prepare("DELETE FROM Inquiry WHERE InquiryID = ?").run(id)
}

exports.clearConvertedSOIDBySoId = (soId) => {
  return db
    .prepare("UPDATE Inquiry SET ConvertedSOID = NULL WHERE ConvertedSOID = ?")
    .run(soId)
}

exports.deleteInquiryTyresByInquiryId = (inquiryId) => {
  return db.prepare("DELETE FROM InquiryTyres WHERE InquiryID = ?").run(inquiryId)
}

exports.deleteInquiryBatteriesByInquiryId = (inquiryId) => {
  return inquiryBatteriesRepo.deleteInquiryBatteriesByInquiryId(inquiryId)
}

exports.updateApprovalStatus = (id, isApproved) => {
  return db
    .prepare("UPDATE Inquiry SET IsAdminApproved = ? WHERE InquiryID = ?")
    .run(isApproved ? 1 : 0, id)
}

exports.updateCompletionStatus = (id, isCompleted) => {
  return db
    .prepare("UPDATE Inquiry SET IsCompleted = ? WHERE InquiryID = ?")
    .run(isCompleted ? 1 : 0, id)
}

exports.approveAllTyresForInquiry = (inquiryId) => {
  return db
    .prepare("UPDATE InquiryTyres SET IsAdminApproved = 1 WHERE InquiryID = ?")
    .run(inquiryId)
}

exports.approveAllBatteriesForInquiry = (inquiryId) => {
  return inquiryBatteriesRepo.approveAllBatteriesForInquiry(inquiryId)
}

exports.getInquiriesByReminderIds = (reminderIds) => {
  if (!reminderIds.length) return []
  const placeholders = reminderIds.map(() => "?").join(",")
  return db
    .prepare(`
      SELECT i.*, c.Name AS CustomerName, c.CustomerCode, ir.ReminderID
      FROM Inquiry i
      INNER JOIN InquiryReminder ir ON ir.InquiryID = i.InquiryID
      LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
      WHERE ir.ReminderID IN (${placeholders})
    `)
    .all(...reminderIds)
}

exports.getInquiryTyresByInquiryIds = (inquiryIds) => {
  if (!inquiryIds.length) return []
  const placeholders = inquiryIds.map(() => "?").join(",")
  return db
    .prepare(`
      SELECT
        it.*,
        t.Size,
        t.Pattern,
        t.Brand,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity
      FROM InquiryTyres it
      INNER JOIN TyreM t ON t.Id = it.TyreID
      LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
      ) stock ON stock.TyreId = it.TyreID
      WHERE it.InquiryID IN (${placeholders})
      ORDER BY it.ID DESC
    `)
    .all(...inquiryIds)
}

exports.getCustomerContactsByCustomerIds = (customerIds) => {
  if (!customerIds.length) return []
  const placeholders = customerIds.map(() => "?").join(",")
  return db
    .prepare(`
      SELECT CustomerID, PhoneNumber, IsPrimary
      FROM CustomerContact
      WHERE CustomerID IN (${placeholders})
    `)
    .all(...customerIds)
}

exports.getCustomerEmailsByCustomerIds = (customerIds) => {
  if (!customerIds.length) return []
  const placeholders = customerIds.map(() => "?").join(",")
  return db
    .prepare(`
      SELECT CustomerID, EmailAddress, IsPrimary
      FROM CustomerEmail
      WHERE CustomerID IN (${placeholders})
    `)
    .all(...customerIds)
}