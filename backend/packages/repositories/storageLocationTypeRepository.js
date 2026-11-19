const db = require("../database/connection")

exports.getAllStorageLocationTypes = () => {
  return db
    .prepare(`
      SELECT
        Id,
        LocationTypeCode,
        LocationTypeName
      FROM StorageLocationTypeM
      ORDER BY Id DESC
    `)
    .all()
}

exports.getStorageLocationTypeById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        LocationTypeCode,
        LocationTypeName
      FROM StorageLocationTypeM
      WHERE Id = ?
    `)
    .get(id)
}

exports.getStorageLocationTypeByCode = (locationTypeCode) => {
  return db
    .prepare(`
      SELECT
        Id,
        LocationTypeCode,
        LocationTypeName
      FROM StorageLocationTypeM
      WHERE LocationTypeCode = ?
    `)
    .get(locationTypeCode)
}

exports.createStorageLocationType = (storageLocationType) => {
  const result = db
    .prepare(`
      INSERT INTO StorageLocationTypeM (
        LocationTypeCode,
        LocationTypeName
      )
      VALUES (?, ?)
    `)
    .run(
      storageLocationType.LocationTypeCode,
      storageLocationType.LocationTypeName
    )

  return exports.getStorageLocationTypeById(result.lastInsertRowid)
}

exports.updateStorageLocationType = (id, storageLocationType) => {
  const result = db
    .prepare(`
      UPDATE StorageLocationTypeM
      SET
        LocationTypeCode = ?,
        LocationTypeName = ?
      WHERE Id = ?
    `)
    .run(
      storageLocationType.LocationTypeCode,
      storageLocationType.LocationTypeName,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getStorageLocationTypeById(id)
}

exports.deleteStorageLocationType = (id) => {
  return db
    .prepare("DELETE FROM StorageLocationTypeM WHERE Id = ?")
    .run(id)
}