const db = require("../database/connection")

exports.getAllStorageManagers = () => {
  return db
    .prepare(`
      SELECT
        Id,
        TyreId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM StorageManager
      ORDER BY Id DESC
    `)
    .all()
}

exports.getStorageManagerById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        TyreId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM StorageManager
      WHERE Id = ?
    `)
    .get(id)
}

exports.getStorageManagerByPair = (tyreId, locationId) => {
  return db
    .prepare(`
      SELECT
        Id,
        TyreId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM StorageManager
      WHERE TyreId = ? AND LocationID = ?
    `)
    .get(tyreId, locationId)
}

exports.getStorageManagersByTyreId = (tyreId) => {
  return db
    .prepare(`
      SELECT
        sm.Id,
        sm.TyreId,
        sm.LocationID,
        sm.Qty,
        sm.SourceTypeId,
        sm.SourceId,
        sm.OrderID,
        sm.CreatedBy,
        sm.createdDate
      FROM StorageManager sm
      INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      WHERE sm.TyreId = ? AND sm.Qty > 0
        AND LOWER(slt.LocationTypeCode) = 'df'
      ORDER BY sm.createdDate ASC, sm.Id ASC
    `)
    .all(tyreId)
}

exports.getStorageManagersByTyreIdWithoutBatches = (tyreId) => {
  return db
    .prepare(`
      SELECT
        sm.Id,
        sm.TyreId,
        sm.LocationID,
        sm.Qty,
        sm.SourceTypeId,
        sm.SourceId,
        sm.OrderID,
        sm.CreatedBy,
        sm.createdDate
      FROM StorageManager sm
      INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      WHERE sm.TyreId = ? AND sm.Qty > 0
        AND NOT EXISTS (
          SELECT 1 FROM StorageManagerBatch smb
          WHERE smb.StorageManagerID = sm.Id AND smb.Qty > 0
        )
        AND LOWER(slt.LocationTypeCode) = 'df'
      ORDER BY sm.createdDate ASC, sm.Id ASC
    `)
    .all(tyreId)
}

exports.getOldestStorageManagerByTyreId = (tyreId) => {
  return db
    .prepare(`
      SELECT
        Id,
        TyreId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM StorageManager
      WHERE TyreId = ?
      ORDER BY createdDate ASC, Id ASC
      LIMIT 1
    `)
    .get(tyreId)
}

exports.getStorageManagersByLocationId = (locationId) => {
  return db
    .prepare(`
      SELECT
        sm.Id,
        sm.TyreId,
        sm.LocationID,
        sm.Qty,
        sm.SourceTypeId,
        sm.SourceId,
        sm.OrderID,
        sm.CreatedBy,
        sm.createdDate,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        ss.SourceCode AS SourceCode
      FROM StorageManager sm
      INNER JOIN TyreM t ON t.Id = sm.TyreId
      LEFT JOIN StorageSourceM ss ON ss.Id = sm.SourceTypeId
      WHERE sm.LocationID = ?
      ORDER BY sm.Id DESC
    `)
    .all(locationId)
}

// Storage lots that a purchase order physically created for one tyre. Used to
// link received PO stock back to the sales order line it was ordered for.
exports.getStorageManagersByOrderIdAndTyreId = (orderId, tyreId) => {
  return db
    .prepare(`
      SELECT
        Id,
        TyreId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM StorageManager
      WHERE OrderID = ? AND TyreId = ? AND Qty > 0
      ORDER BY createdDate ASC, Id ASC
    `)
    .all(orderId, tyreId)
}

exports.createStorageManager = (storageManager) => {
  const result = db
    .prepare(`
      INSERT INTO StorageManager (
        TyreId,
        LocationID,
        Qty,
        OrderID,
        SourceTypeId,
        SourceId,
        CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      storageManager.TyreId,
      storageManager.LocationID,
      storageManager.Qty,
      storageManager.OrderID ?? null,
      storageManager.SourceTypeId ?? null,
      storageManager.SourceId ?? null,
      storageManager.CreatedBy ?? null
    )

  return exports.getStorageManagerById(result.lastInsertRowid)
}

exports.updateStorageManager = (id, storageManager) => {
  const result = db
    .prepare(`
      UPDATE StorageManager
      SET
        TyreId = ?,
        LocationID = ?,
        Qty = ?,
        OrderID = COALESCE(?, OrderID),
        CreatedBy = COALESCE(?, CreatedBy)
      WHERE Id = ?
    `)
    .run(
      storageManager.TyreId,
      storageManager.LocationID,
      storageManager.Qty,
      storageManager.OrderID ?? null,
      storageManager.CreatedBy ?? null,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getStorageManagerById(id)
}

exports.deleteStorageManager = (id) => {
  return db
    .prepare("DELETE FROM StorageManager WHERE Id = ?")
    .run(id)
}
