const db = require("../database/connection")

exports.getAllManufactureOrders = () => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID
      FROM ManufactureOrder
      ORDER BY ID DESC
    `)
    .all()
}

exports.getManufactureOrderById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID
      FROM ManufactureOrder
      WHERE ID = ?
    `)
    .get(id)
}

exports.createManufactureOrder = (soId) => {
  const result = db
    .prepare(`
      INSERT INTO ManufactureOrder (SoID)
      VALUES (?)
    `)
    .run(soId)

  return exports.getManufactureOrderById(result.lastInsertRowid)
}

exports.updateManufactureOrder = (id, soId) => {
  const result = db
    .prepare(`
      UPDATE ManufactureOrder
      SET SoID = ?
      WHERE ID = ?
    `)
    .run(soId, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getManufactureOrderById(id)
}

exports.deleteManufactureOrder = (id) => {
  return db
    .prepare("DELETE FROM ManufactureOrder WHERE ID = ?")
    .run(id)
}

exports.deleteManufactureOrdersBySoId = (soId) => {
  return db
    .prepare("DELETE FROM ManufactureOrder WHERE SoID = ?")
    .run(soId)
}
