const db = require("../database/connection")

exports.getAllOtherServices = () => {
  return db
    .prepare(`
      SELECT
        os.OSID,
        os.Date,
        os.IsCompleted,
        os.IsPaymentCompleted,
        osc.CustomerID,
        c.Name AS CustomerName,
        c.CustomerCode,
        ostd.CustomerName AS AdHocCustomerName,
        COALESCE(SUM(osc2.Price * osc2.Qty), 0) AS TotalAmount
      FROM OtherService os
      LEFT JOIN OtherServiceCustomer osc ON osc.OSID = os.OSID
      LEFT JOIN CustomerM c ON c.CustomerID = osc.CustomerID
      LEFT JOIN OtherServiceCustomerDetail ostd ON ostd.OSID = os.OSID
      LEFT JOIN OtherServiceConsumables osc2 ON osc2.OSID = os.OSID
      GROUP BY os.OSID
      ORDER BY os.OSID DESC
    `)
    .all()
}

exports.getOtherServiceById = (osId) => {
  return db
    .prepare(`
      SELECT
        os.OSID,
        os.Date,
        os.IsCompleted,
        os.IsPaymentCompleted,
        osc.CustomerID,
        c.Name AS CustomerName,
        c.CustomerCode,
        ostd.CustomerName AS AdHocCustomerName,
        ostd.CustomerPhone AS AdHocCustomerPhone,
        ostd.CustomerEmail AS AdHocCustomerEmail,
        COALESCE(SUM(osc2.Price * osc2.Qty), 0) AS TotalAmount
      FROM OtherService os
      LEFT JOIN OtherServiceCustomer osc ON osc.OSID = os.OSID
      LEFT JOIN CustomerM c ON c.CustomerID = osc.CustomerID
      LEFT JOIN OtherServiceCustomerDetail ostd ON ostd.OSID = os.OSID
      LEFT JOIN OtherServiceConsumables osc2 ON osc2.OSID = os.OSID
      WHERE os.OSID = ?
      GROUP BY os.OSID
    `)
    .get(osId)
}

exports.createOtherService = (otherService) => {
  const result = db
    .prepare(`
      INSERT INTO OtherService (
        Date,
        IsCompleted,
        IsPaymentCompleted
      )
      VALUES (?, ?, ?)
    `)
    .run(
      otherService.Date,
      otherService.IsCompleted,
      otherService.IsPaymentCompleted
    )

  return exports.getOtherServiceById(result.lastInsertRowid)
}

exports.updateOtherService = (osId, otherService) => {
  const result = db
    .prepare(`
      UPDATE OtherService
      SET
        Date = ?,
        IsCompleted = ?,
        IsPaymentCompleted = ?
      WHERE OSID = ?
    `)
    .run(
      otherService.Date,
      otherService.IsCompleted,
      otherService.IsPaymentCompleted,
      osId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getOtherServiceById(osId)
}

exports.deleteOtherService = (osId) => {
  return db
    .prepare("DELETE FROM OtherService WHERE OSID = ?")
    .run(osId)
}
