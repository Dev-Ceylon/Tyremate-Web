const db = require("../database/connection")

exports.getInquiryWalkinCustomerByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        ID,
        InquiryID,
        CustomerName,
        CustomerPhone,
        CustomerAddress,
        CustomerEmail,
        VehicleNumber,
        TinNo,
        VatNo
      FROM InquiryWalkinCustomer
      WHERE InquiryID = ?
    `)
    .get(inquiryId)
}

exports.createInquiryWalkinCustomer = (data) => {
  const result = db
    .prepare(`
      INSERT INTO InquiryWalkinCustomer (
        InquiryID,
        CustomerName,
        CustomerPhone,
        CustomerAddress,
        CustomerEmail,
        VehicleNumber,
        TinNo,
        VatNo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.InquiryID,
      data.CustomerName,
      data.CustomerPhone,
      data.CustomerAddress,
      data.CustomerEmail,
      data.VehicleNumber,
      data.TinNo,
      data.VatNo
    )

  return db
    .prepare(`
      SELECT ID, InquiryID, CustomerName, CustomerPhone, CustomerAddress, CustomerEmail, VehicleNumber, TinNo, VatNo
      FROM InquiryWalkinCustomer
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

// Upsert: switching an inquiry back to walk-in from a registered customer must
// insert, because the earlier switch to registered deleted the row.
exports.updateInquiryWalkinCustomer = (inquiryId, data) => {
  if (!exports.getInquiryWalkinCustomerByInquiryId(inquiryId)) {
    return exports.createInquiryWalkinCustomer({ InquiryID: inquiryId, ...data })
  }

  db.prepare(
    `
      UPDATE InquiryWalkinCustomer
      SET
        CustomerName = ?,
        CustomerPhone = ?,
        CustomerAddress = ?,
        CustomerEmail = ?,
        VehicleNumber = ?,
        TinNo = ?,
        VatNo = ?
      WHERE InquiryID = ?
    `
  ).run(
    data.CustomerName,
    data.CustomerPhone,
    data.CustomerAddress,
    data.CustomerEmail,
    data.VehicleNumber,
    data.TinNo,
    data.VatNo,
    inquiryId
  )

  return exports.getInquiryWalkinCustomerByInquiryId(inquiryId)
}

exports.deleteInquiryWalkinCustomerByInquiryId = (inquiryId) => {
  return db.prepare("DELETE FROM InquiryWalkinCustomer WHERE InquiryID = ?").run(inquiryId)
}