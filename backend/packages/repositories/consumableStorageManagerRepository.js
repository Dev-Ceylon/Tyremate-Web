const db = require("../database/connection")

exports.getAllConsumableStorageManagers = () => {
  return db
    .prepare(`
      SELECT
        csm.Id,
        csm.ConsumableID,
        csm.LocationID,
        csm.Qty,
        csm.BatchNumber,
        csm.ExpiryDate,
        csm.createdDate,
        cm.Name AS ConsumableName,
        cm.Unit AS ConsumableUnit,
        cl.LocationName
      FROM ConsumableStorageManager csm
      INNER JOIN ConsumableM cm ON cm.Id = csm.ConsumableID
      INNER JOIN ConsumableLocationM cl ON cl.Id = csm.LocationID
      ORDER BY csm.Id DESC
    `)
    .all()
}

exports.getConsumableStorageManagerById = (id) => {
  return db
    .prepare(`
      SELECT
        csm.Id,
        csm.ConsumableID,
        csm.LocationID,
        csm.Qty,
        csm.BatchNumber,
        csm.ExpiryDate,
        csm.createdDate,
        cm.Name AS ConsumableName,
        cm.Unit AS ConsumableUnit,
        cl.LocationName
      FROM ConsumableStorageManager csm
      INNER JOIN ConsumableM cm ON cm.Id = csm.ConsumableID
      INNER JOIN ConsumableLocationM cl ON cl.Id = csm.LocationID
      WHERE csm.Id = ?
    `)
    .get(id)
}

exports.getConsumableStorageManagerByPair = (consumableId, locationId, batchNumber) => {
  return db
    .prepare(`
      SELECT
        csm.Id,
        csm.ConsumableID,
        csm.LocationID,
        csm.Qty,
        csm.BatchNumber,
        csm.ExpiryDate,
        csm.createdDate
      FROM ConsumableStorageManager csm
      WHERE csm.ConsumableID = ? AND csm.LocationID = ? AND csm.BatchNumber IS ?
    `)
    .get(consumableId, locationId, batchNumber)
}

exports.getConsumableStorageManagersByConsumableId = (consumableId) => {
  return db
    .prepare(`
      SELECT
        csm.Id,
        csm.ConsumableID,
        csm.LocationID,
        csm.Qty,
        csm.BatchNumber,
        csm.ExpiryDate,
        csm.createdDate,
        cl.LocationName
      FROM ConsumableStorageManager csm
      INNER JOIN ConsumableLocationM cl ON cl.Id = csm.LocationID
      WHERE csm.ConsumableID = ? AND csm.Qty > 0
      ORDER BY csm.Id ASC
    `)
    .all(consumableId)
}

exports.getConsumableStorageManagersByLocationId = (locationId) => {
  return db
    .prepare(`
      SELECT
        csm.Id,
        csm.ConsumableID,
        csm.LocationID,
        csm.Qty,
        csm.BatchNumber,
        csm.ExpiryDate,
        csm.createdDate,
        cm.Name AS ConsumableName,
        cm.Unit AS ConsumableUnit,
        cm.Category AS ConsumableCategory
      FROM ConsumableStorageManager csm
      INNER JOIN ConsumableM cm ON cm.Id = csm.ConsumableID
      WHERE csm.LocationID = ?
      ORDER BY csm.Id DESC
    `)
    .all(locationId)
}

exports.createConsumableStorageManager = (consumableStorageManager) => {
  const result = db
    .prepare(`
      INSERT INTO ConsumableStorageManager (
        ConsumableID,
        LocationID,
        Qty,
        BatchNumber,
        ExpiryDate
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      consumableStorageManager.ConsumableID,
      consumableStorageManager.LocationID,
      consumableStorageManager.Qty,
      consumableStorageManager.BatchNumber,
      consumableStorageManager.ExpiryDate
    )

  return exports.getConsumableStorageManagerById(result.lastInsertRowid)
}

exports.updateConsumableStorageManager = (id, consumableStorageManager) => {
  const result = db
    .prepare(`
      UPDATE ConsumableStorageManager
      SET
        ConsumableID = ?,
        LocationID = ?,
        Qty = ?,
        BatchNumber = ?,
        ExpiryDate = ?
      WHERE Id = ?
    `)
    .run(
      consumableStorageManager.ConsumableID,
      consumableStorageManager.LocationID,
      consumableStorageManager.Qty,
      consumableStorageManager.BatchNumber,
      consumableStorageManager.ExpiryDate,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getConsumableStorageManagerById(id)
}

exports.deleteConsumableStorageManager = (id) => {
  return db
    .prepare("DELETE FROM ConsumableStorageManager WHERE Id = ?")
    .run(id)
}
