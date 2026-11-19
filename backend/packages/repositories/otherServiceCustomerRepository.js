const db = require("../database/connection")

exports.getOtherServiceCustomerByOsId = (osId) => {
  return db
    .prepare(`
      SELECT
        ID,
        OSID,
        CustomerID
      FROM OtherServiceCustomer
      WHERE OSID = ?
    `)
    .get(osId)
}

exports.createOtherServiceCustomer = (data) => {
  const result = db
    .prepare(`
      INSERT INTO OtherServiceCustomer (
        OSID,
        CustomerID
      )
      VALUES (?, ?)
    `)
    .run(data.OSID, data.CustomerID)

  return db
    .prepare(`
      SELECT ID, OSID, CustomerID
      FROM OtherServiceCustomer
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updateOtherServiceCustomer = (osId, customerId) => {
  const result = db
    .prepare(`
      UPDATE OtherServiceCustomer
      SET CustomerID = ?
      WHERE OSID = ?
    `)
    .run(customerId, osId)

  if (result.changes === 0) {
    return null
  }

  return exports.getOtherServiceCustomerByOsId(osId)
}

exports.deleteOtherServiceCustomerByOsId = (osId) => {
  return db
    .prepare("DELETE FROM OtherServiceCustomer WHERE OSID = ?")
    .run(osId)
}
