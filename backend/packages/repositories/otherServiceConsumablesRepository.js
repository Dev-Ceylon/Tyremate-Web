const db = require("../database/connection")

exports.getOtherServiceConsumablesByOsId = (osId) => {
  return db
    .prepare(`
      SELECT
        osc.ID,
        osc.OSID,
        osc.ConsumableID,
        osc.Price,
        osc.Qty,
        cm.Name AS ConsumableName,
        cm.Category AS ConsumableCategory,
        cm.Unit AS ConsumableUnit
      FROM OtherServiceConsumables osc
      INNER JOIN ConsumableM cm ON cm.Id = osc.ConsumableID
      WHERE osc.OSID = ?
      ORDER BY osc.ID DESC
    `)
    .all(osId)
}

exports.getOtherServiceConsumableById = (id) => {
  return db
    .prepare(`
      SELECT
        osc.ID,
        osc.OSID,
        osc.ConsumableID,
        osc.Price,
        osc.Qty
      FROM OtherServiceConsumables osc
      WHERE osc.ID = ?
    `)
    .get(id)
}

exports.createOtherServiceConsumable = (data) => {
  const result = db
    .prepare(`
      INSERT INTO OtherServiceConsumables (
        OSID,
        ConsumableID,
        Price,
        Qty
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(data.OSID, data.ConsumableID, data.Price, data.Qty)

  return exports.getOtherServiceConsumableById(result.lastInsertRowid)
}

exports.updateOtherServiceConsumable = (id, data) => {
  const result = db
    .prepare(`
      UPDATE OtherServiceConsumables
      SET
        ConsumableID = ?,
        Price = ?,
        Qty = ?
      WHERE ID = ?
    `)
    .run(data.ConsumableID, data.Price, data.Qty, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getOtherServiceConsumableById(id)
}

exports.deleteOtherServiceConsumable = (id) => {
  return db
    .prepare("DELETE FROM OtherServiceConsumables WHERE ID = ?")
    .run(id)
}

exports.deleteOtherServiceConsumablesByOsId = (osId) => {
  return db
    .prepare("DELETE FROM OtherServiceConsumables WHERE OSID = ?")
    .run(osId)
}
