const db = require("../database/connection")

exports.getBatchesByStorageManagerId = (storageManagerId) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryStorageManagerID,
        BatchCode,
        MfgDate,
        ExpiryDate,
        Qty,
        CreatedBy,
        createdDate
      FROM BatteryStorageManagerBatch
      WHERE BatteryStorageManagerID = ?
      ORDER BY Id ASC
    `)
    .all(storageManagerId)
}

exports.getBatchesByBatteryIdOrderedByExpiry = (batteryId) => {
  return db
    .prepare(`
      SELECT
        bsmb.Id,
        bsmb.BatteryStorageManagerID,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName,
        bsmb.BatchCode,
        bsmb.MfgDate,
        bsmb.ExpiryDate,
        bsmb.Qty,
        bsmb.CreatedBy,
        bsmb.createdDate
      FROM BatteryStorageManagerBatch bsmb
      INNER JOIN BatteryStorageManager bsm ON bsm.Id = bsmb.BatteryStorageManagerID
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = COALESCE(bl.LocationTypeId, sl.LocationTypeId)
      WHERE bsm.BatteryId = ? AND bsmb.Qty > 0
        AND LOWER(COALESCE(slt.LocationTypeCode, 'df')) = 'df'
      ORDER BY
        CASE WHEN bsmb.ExpiryDate IS NULL OR bsmb.ExpiryDate = '' THEN 1 ELSE 0 END ASC,
        bsmb.ExpiryDate ASC,
        bsmb.Id ASC
    `)
    .all(batteryId)
}

exports.getBatchesByStorageManagerIdOrderedByExpiry = (storageManagerId) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryStorageManagerID,
        BatchCode,
        MfgDate,
        ExpiryDate,
        Qty,
        CreatedBy,
        createdDate
      FROM BatteryStorageManagerBatch
      WHERE BatteryStorageManagerID = ? AND Qty > 0
      ORDER BY
        CASE WHEN ExpiryDate IS NULL OR ExpiryDate = '' THEN 1 ELSE 0 END ASC,
        ExpiryDate ASC,
        Id ASC
    `)
    .all(storageManagerId)
}

exports.getBatchesByLocationId = (locationId) => {
  return db
    .prepare(`
      SELECT
        bsmb.Id,
        bsmb.BatteryStorageManagerID,
        bsm.LocationID,
        bsm.BatteryId,
        bsmb.BatchCode,
        bsmb.MfgDate,
        bsmb.ExpiryDate,
        bsmb.Qty,
        bsmb.CreatedBy,
        bsmb.createdDate,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application
      FROM BatteryStorageManagerBatch bsmb
      INNER JOIN BatteryStorageManager bsm ON bsm.Id = bsmb.BatteryStorageManagerID
      INNER JOIN BatteryM b ON b.Id = bsm.BatteryId
      WHERE bsm.LocationID = ? AND bsmb.Qty > 0
      ORDER BY
        CASE WHEN bsmb.ExpiryDate IS NULL OR bsmb.ExpiryDate = '' THEN 1 ELSE 0 END ASC,
        bsmb.ExpiryDate ASC,
        bsmb.Id ASC
    `)
    .all(locationId)
}

exports.getBatchById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryStorageManagerID,
        BatchCode,
        MfgDate,
        ExpiryDate,
        Qty,
        CreatedBy,
        createdDate
      FROM BatteryStorageManagerBatch
      WHERE Id = ?
    `)
    .get(id)
}

exports.createBatteryStorageManagerBatch = (batch) => {
  const result = db
    .prepare(`
      INSERT INTO BatteryStorageManagerBatch (
        BatteryStorageManagerID,
        BatchCode,
        MfgDate,
        ExpiryDate,
        Qty,
        CreatedBy
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      batch.BatteryStorageManagerID,
      batch.BatchCode ?? null,
      batch.MfgDate ?? null,
      batch.ExpiryDate ?? null,
      batch.Qty,
      batch.CreatedBy ?? null
    )

  return exports.getBatchById(result.lastInsertRowid)
}

exports.updateBatteryStorageManagerBatch = (id, batch) => {
  const result = db
    .prepare(`
      UPDATE BatteryStorageManagerBatch
      SET
        BatchCode = COALESCE(?, BatchCode),
        MfgDate = COALESCE(?, MfgDate),
        ExpiryDate = COALESCE(?, ExpiryDate),
        Qty = ?
      WHERE Id = ?
    `)
    .run(
      batch.BatchCode ?? null,
      batch.MfgDate ?? null,
      batch.ExpiryDate ?? null,
      batch.Qty,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getBatchById(id)
}

exports.deleteBatchesByBatteryStorageManagerId = (storageManagerId) => {
  return db
    .prepare("DELETE FROM BatteryStorageManagerBatch WHERE BatteryStorageManagerID = ?")
    .run(storageManagerId)
}

exports.deleteBatch = (id) => {
  return db
    .prepare("DELETE FROM BatteryStorageManagerBatch WHERE Id = ?")
    .run(id)
}

exports.getBatchesTotalQty = (storageManagerId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS TotalQty
      FROM BatteryStorageManagerBatch
      WHERE BatteryStorageManagerID = ?
    `)
    .get(storageManagerId)

  return Number(row?.TotalQty ?? 0)
}

exports.getStockedBatteryBatches = () => {
  return db
    .prepare(`
      SELECT
        bsmb.Id,
        bsmb.BatteryStorageManagerID,
        bsmb.BatchCode,
        bsmb.MfgDate,
        bsmb.ExpiryDate,
        bsmb.Qty,
        bsmb.CreatedBy,
        bsmb.createdDate,
        bsm.LocationID,
        bsm.BatteryId,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName,
        COALESCE(bl.LocationCode, sl.LocationCode) AS LocationCode,
        COALESCE(bl.BranchId, sl.BranchId) AS BranchId,
        br.BranchName
      FROM BatteryStorageManagerBatch bsmb
      INNER JOIN BatteryStorageManager bsm ON bsm.Id = bsmb.BatteryStorageManagerID
      INNER JOIN BatteryM b ON b.Id = bsm.BatteryId
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN BranchM br ON br.Id = COALESCE(bl.BranchId, sl.BranchId)
      WHERE bsmb.Qty > 0
      ORDER BY bsmb.Id ASC
    `)
    .all()
}
