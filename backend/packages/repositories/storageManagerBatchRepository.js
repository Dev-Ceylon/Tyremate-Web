const db = require("../database/connection")

exports.getBatchesByStorageManagerId = (storageManagerId) => {
  return db
    .prepare(`
      SELECT
        Id,
        StorageManagerID,
        DOT,
        Qty,
        CreatedBy,
        createdDate
      FROM StorageManagerBatch
      WHERE StorageManagerID = ?
      ORDER BY Id ASC
    `)
    .all(storageManagerId)
}

exports.getBatchesByTyreIdOrderedByDOT = (tyreId) => {
  return db
    .prepare(`
      SELECT
        smb.Id,
        smb.StorageManagerID,
        sl.LocationName,
        smb.DOT,
        smb.Qty,
        smb.CreatedBy,
        smb.createdDate
      FROM StorageManagerBatch smb
      INNER JOIN StorageManager sm ON sm.Id = smb.StorageManagerID
      INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      WHERE sm.TyreId = ? AND smb.Qty > 0
        AND LOWER(slt.LocationTypeCode) = 'df'
      ORDER BY
        CASE WHEN smb.DOT IS NULL OR smb.DOT = '' THEN 1 ELSE 0 END ASC,
        CAST('20' || SUBSTR(smb.DOT, -2) AS INTEGER) ASC,
        CAST(SUBSTR(smb.DOT, 1, 2) AS INTEGER) ASC,
        smb.Id ASC
    `)
    .all(tyreId)
}

exports.getBatchesByStorageManagerIdOrderedByDOT = (storageManagerId) => {
  return db
    .prepare(`
      SELECT
        Id,
        StorageManagerID,
        DOT,
        Qty,
        CreatedBy,
        createdDate
      FROM StorageManagerBatch
      WHERE StorageManagerID = ? AND Qty > 0
      ORDER BY
        CASE WHEN DOT IS NULL OR DOT = '' THEN 1 ELSE 0 END ASC,
        CAST('20' || SUBSTR(DOT, -2) AS INTEGER) ASC,
        CAST(SUBSTR(DOT, 1, 2) AS INTEGER) ASC,
        Id ASC
    `)
    .all(storageManagerId)
}

exports.getBatchesByLocationId = (locationId) => {
  return db
    .prepare(`
      SELECT
        smb.Id,
        smb.StorageManagerID,
        sm.LocationID,
        sm.TyreId,
        smb.DOT,
        smb.Qty,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall
      FROM StorageManagerBatch smb
      INNER JOIN StorageManager sm ON sm.Id = smb.StorageManagerID
      INNER JOIN TyreM t ON t.Id = sm.TyreId
      WHERE sm.LocationID = ? AND smb.Qty > 0
      ORDER BY
        CASE WHEN smb.DOT IS NULL OR smb.DOT = '' THEN 1 ELSE 0 END ASC,
        CAST('20' || SUBSTR(smb.DOT, -2) AS INTEGER) ASC,
        CAST(SUBSTR(smb.DOT, 1, 2) AS INTEGER) ASC,
        smb.Id ASC
    `)
    .all(locationId)
}

exports.getBatchById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        StorageManagerID,
        DOT,
        Qty,
        CreatedBy,
        createdDate
      FROM StorageManagerBatch
      WHERE Id = ?
    `)
    .get(id)
}

exports.createStorageManagerBatch = (batch) => {
  const result = db
    .prepare(`
      INSERT INTO StorageManagerBatch (
        StorageManagerID,
        DOT,
        Qty,
        CreatedBy
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      batch.StorageManagerID,
      batch.DOT ?? null,
      batch.Qty,
      batch.CreatedBy ?? null
    )

  return exports.getBatchById(result.lastInsertRowid)
}

exports.updateStorageManagerBatch = (id, batch) => {
  const result = db
    .prepare(`
      UPDATE StorageManagerBatch
      SET
        DOT = COALESCE(?, DOT),
        Qty = ?
      WHERE Id = ?
    `)
    .run(batch.DOT ?? null, batch.Qty, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getBatchById(id)
}

exports.deleteBatchesByStorageManagerId = (storageManagerId) => {
  return db
    .prepare("DELETE FROM StorageManagerBatch WHERE StorageManagerID = ?")
    .run(storageManagerId)
}

exports.getBatchesTotalQty = (storageManagerId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS TotalQty
      FROM StorageManagerBatch
      WHERE StorageManagerID = ?
    `)
    .get(storageManagerId)

  return Number(row?.TotalQty ?? 0)
}