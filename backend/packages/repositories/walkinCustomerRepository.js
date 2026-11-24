const db = require("../database/connection")

exports.getWalkinCustomerById = (id) => {
  return db
    .prepare(`
      SELECT ID, CustomerName, CustomerPhone, CustomerAddress,
             CustomerEmail, VehicleNumber, TinNo, VatNo
      FROM WalkinCustomer
      WHERE ID = ?
    `)
    .get(id)
}

exports.createWalkinCustomer = (data) => {
  const result = db
    .prepare(`
      INSERT INTO WalkinCustomer (
        CustomerName, CustomerPhone, CustomerAddress,
        CustomerEmail, VehicleNumber, TinNo, VatNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.CustomerName,
      data.CustomerPhone,
      data.CustomerAddress,
      data.CustomerEmail || null,
      data.VehicleNumber || null,
      data.TinNo || null,
      data.VatNo || null
    )
  return exports.getWalkinCustomerById(result.lastInsertRowid)
}

exports.updateWalkinCustomer = (id, data) => {
  db.prepare(`
    UPDATE WalkinCustomer
    SET CustomerName = ?, CustomerPhone = ?, CustomerAddress = ?,
        CustomerEmail = ?, VehicleNumber = ?, TinNo = ?, VatNo = ?,
        UpdatedAt = (datetime('now','localtime'))
    WHERE ID = ?
  `).run(
    data.CustomerName,
    data.CustomerPhone,
    data.CustomerAddress,
    data.CustomerEmail || null,
    data.VehicleNumber || null,
    data.TinNo || null,
    data.VatNo || null,
    id
  )
  return exports.getWalkinCustomerById(id)
}
