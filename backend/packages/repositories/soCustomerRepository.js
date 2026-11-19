const db = require("../database/connection")

exports.getAllSoCustomers = () => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        CustomerID
      FROM SoCustomer
      ORDER BY ID DESC
    `)
    .all()
}

exports.getSoCustomer = (soId, customerId) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        CustomerID
      FROM SoCustomer
      WHERE SoID = ? AND CustomerID = ?
    `)
    .get(soId, customerId)
}

exports.createSoCustomer = (soId, customerId) => {
  const result = db
    .prepare(`
      INSERT INTO SoCustomer (
        SoID,
        CustomerID
      )
      VALUES (?, ?)
    `)
    .run(soId, customerId)

  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        CustomerID
      FROM SoCustomer
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updateSoCustomer = (currentSoId, currentCustomerId, nextSoId, nextCustomerId) => {
  const result = db
    .prepare(`
      UPDATE SoCustomer
      SET
        SoID = ?,
        CustomerID = ?
      WHERE SoID = ? AND CustomerID = ?
    `)
    .run(nextSoId, nextCustomerId, currentSoId, currentCustomerId)

  if (result.changes === 0) {
    return null
  }

  return exports.getSoCustomer(nextSoId, nextCustomerId)
}

exports.deleteSoCustomer = (soId, customerId) => {
  return db
    .prepare(`
      DELETE FROM SoCustomer
      WHERE SoID = ? AND CustomerID = ?
    `)
    .run(soId, customerId)
}

exports.deleteSoCustomersBySoId = (soId) => {
  return db
    .prepare(`
      DELETE FROM SoCustomer
      WHERE SoID = ?
    `)
    .run(soId)
}
