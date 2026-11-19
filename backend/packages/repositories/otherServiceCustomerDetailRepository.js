const db = require("../database/connection")

exports.getOtherServiceCustomerDetailByOsId = (osId) => {
  return db
    .prepare(`
      SELECT
        ID,
        OSID,
        CustomerName,
        CustomerPhone,
        CustomerEmail
      FROM OtherServiceCustomerDetail
      WHERE OSID = ?
    `)
    .get(osId)
}

exports.createOtherServiceCustomerDetail = (data) => {
  const result = db
    .prepare(`
      INSERT INTO OtherServiceCustomerDetail (
        OSID,
        CustomerName,
        CustomerPhone,
        CustomerEmail
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(data.OSID, data.CustomerName, data.CustomerPhone, data.CustomerEmail)

  return db
    .prepare(`
      SELECT ID, OSID, CustomerName, CustomerPhone, CustomerEmail
      FROM OtherServiceCustomerDetail
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updateOtherServiceCustomerDetail = (osId, data) => {
  const result = db
    .prepare(`
      UPDATE OtherServiceCustomerDetail
      SET
        CustomerName = ?,
        CustomerPhone = ?,
        CustomerEmail = ?
      WHERE OSID = ?
    `)
    .run(data.CustomerName, data.CustomerPhone, data.CustomerEmail, osId)

  if (result.changes === 0) {
    return null
  }

  return exports.getOtherServiceCustomerDetailByOsId(osId)
}

exports.deleteOtherServiceCustomerDetailByOsId = (osId) => {
  return db
    .prepare("DELETE FROM OtherServiceCustomerDetail WHERE OSID = ?")
    .run(osId)
}
