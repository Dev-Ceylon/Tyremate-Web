const db = require("../database/connection")

exports.createOtherServicePayment = (data) => {
  const result = db
    .prepare(`
      INSERT INTO OtherServicePayments (OSID, PaymentID)
      VALUES (?, ?)
    `)
    .run(data.OSID, data.PaymentID)

  return {
    ID: result.lastInsertRowid,
    ...data
  }
}

exports.getOtherServicePaymentsByOsId = (osId) => {
  return db
    .prepare(`
      SELECT * FROM OtherServicePayments WHERE OSID = ?
    `)
    .all(osId)
}

exports.getOtherServicePaymentById = (id) => {
  return db
    .prepare(`
      SELECT * FROM OtherServicePayments WHERE ID = ?
    `)
    .get(id)
}

exports.getOsIdByPaymentId = (paymentId) => {
  return db
    .prepare(`
      SELECT OSID FROM OtherServicePayments WHERE PaymentID = ?
    `)
    .get(paymentId)
}

exports.deleteOtherServicePaymentsByOsId = (osId) => {
  return db
    .prepare("DELETE FROM OtherServicePayments WHERE OSID = ?")
    .run(osId)
}
