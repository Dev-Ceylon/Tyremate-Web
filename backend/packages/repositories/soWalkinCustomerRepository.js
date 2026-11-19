const db = require("../database/connection")

exports.getSoWalkinCustomerBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        CustomerName,
        CustomerPhone,
        CustomerAddress,
        CustomerEmail,
        VehicleNumber,
        TinNo,
        VatNo
      FROM SoWalkinCustomer
      WHERE SoID = ?
    `)
    .get(soId)
}

exports.createSoWalkinCustomer = (data) => {
  const result = db
    .prepare(`
      INSERT INTO SoWalkinCustomer (
        SoID,
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
      data.SoID,
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
      SELECT ID, SoID, CustomerName, CustomerPhone, CustomerAddress, CustomerEmail, VehicleNumber, TinNo, VatNo
      FROM SoWalkinCustomer
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updateSoWalkinCustomer = (soId, data) => {
  const result = db
    .prepare(`
      UPDATE SoWalkinCustomer
      SET
        CustomerName = ?,
        CustomerPhone = ?,
        CustomerAddress = ?,
        CustomerEmail = ?,
        VehicleNumber = ?,
        TinNo = ?,
        VatNo = ?
      WHERE SoID = ?
    `)
    .run(
      data.CustomerName,
      data.CustomerPhone,
      data.CustomerAddress,
      data.CustomerEmail,
      data.VehicleNumber,
      data.TinNo,
      data.VatNo,
      soId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getSoWalkinCustomerBySoId(soId)
}

exports.deleteSoWalkinCustomerBySoId = (soId) => {
  return db.prepare("DELETE FROM SoWalkinCustomer WHERE SoID = ?").run(soId)
}
