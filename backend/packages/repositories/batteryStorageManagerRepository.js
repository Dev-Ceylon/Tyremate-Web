const db = require("../database/connection")

exports.getAllBatteryStorageManagers = () => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM BatteryStorageManager
      ORDER BY Id DESC
    `)
    .all()
}

exports.getBatteryStorageManagerById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM BatteryStorageManager
      WHERE Id = ?
    `)
    .get(id)
}

exports.getBatteryStorageManagerByPair = (batteryId, locationId) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM BatteryStorageManager
      WHERE BatteryId = ? AND LocationID = ?
    `)
    .get(batteryId, locationId)
}

exports.getBatteryStorageManagersByBatteryId = (batteryId) => {
  return db
    .prepare(`
      SELECT
        bsm.Id,
        bsm.BatteryId,
        bsm.LocationID,
        bsm.Qty,
        bsm.SourceTypeId,
        bsm.SourceId,
        bsm.OrderID,
        bsm.CreatedBy,
        bsm.createdDate
      FROM BatteryStorageManager bsm
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = COALESCE(bl.LocationTypeId, sl.LocationTypeId)
      WHERE bsm.BatteryId = ? AND bsm.Qty > 0
        AND LOWER(COALESCE(slt.LocationTypeCode, 'df')) = 'df'
      ORDER BY bsm.createdDate ASC, bsm.Id ASC
    `)
    .all(batteryId)
}

exports.getBatteryStorageManagersByBatteryIdWithoutBatches = (batteryId) => {
  return db
    .prepare(`
      SELECT
        bsm.Id,
        bsm.BatteryId,
        bsm.LocationID,
        bsm.Qty,
        bsm.SourceTypeId,
        bsm.SourceId,
        bsm.OrderID,
        bsm.CreatedBy,
        bsm.createdDate
      FROM BatteryStorageManager bsm
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = COALESCE(bl.LocationTypeId, sl.LocationTypeId)
      WHERE bsm.BatteryId = ? AND bsm.Qty > 0
        AND NOT EXISTS (
          SELECT 1 FROM BatteryStorageManagerBatch bsmb
          WHERE bsmb.BatteryStorageManagerID = bsm.Id AND bsmb.Qty > 0
        )
        AND LOWER(COALESCE(slt.LocationTypeCode, 'df')) = 'df'
      ORDER BY bsm.createdDate ASC, bsm.Id ASC
    `)
    .all(batteryId)
}

exports.getOldestBatteryStorageManagerByBatteryId = (batteryId) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM BatteryStorageManager
      WHERE BatteryId = ?
      ORDER BY createdDate ASC, Id ASC
      LIMIT 1
    `)
    .get(batteryId)
}

exports.getBatteryStorageManagersByLocationId = (locationId) => {
  return db
    .prepare(`
      SELECT
        bsm.Id,
        bsm.BatteryId,
        bsm.LocationID,
        bsm.Qty,
        bsm.SourceTypeId,
        bsm.SourceId,
        bsm.OrderID,
        bsm.CreatedBy,
        bsm.createdDate,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode AS MasterBatchCode,
        ss.SourceCode AS SourceCode
      FROM BatteryStorageManager bsm
      INNER JOIN BatteryM b ON b.Id = bsm.BatteryId
      LEFT JOIN StorageSourceM ss ON ss.Id = bsm.SourceTypeId
      WHERE bsm.LocationID = ?
      ORDER BY bsm.Id DESC
    `)
    .all(locationId)
}

exports.getBatteryStorageManagersByOrderIdAndBatteryId = (orderId, batteryId) => {
  return db
    .prepare(`
      SELECT
        Id,
        BatteryId,
        LocationID,
        Qty,
        SourceTypeId,
        SourceId,
        OrderID,
        CreatedBy,
        createdDate
      FROM BatteryStorageManager
      WHERE OrderID = ? AND BatteryId = ? AND Qty > 0
      ORDER BY createdDate ASC, Id ASC
    `)
    .all(orderId, batteryId)
}

exports.getStorageLocationsByBranchIdForBatteries = (branchId) => {
  const batteryLocs = db
    .prepare(`
      SELECT
        bl.Id,
        bl.LocationCode,
        bl.LocationName,
        bl.BranchId,
        bl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        bl.Capacity,
        COALESCE(SUM(bsm.Qty), 0) AS UsedCapacity,
        bl.Capacity - COALESCE(SUM(bsm.Qty), 0) AS RemainingCapacity
      FROM BatteryLocationM bl
      LEFT JOIN BranchM b ON b.Id = bl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = bl.LocationTypeId
      LEFT JOIN BatteryStorageManager bsm ON bsm.LocationID = bl.Id
      WHERE bl.BranchId = ?
      GROUP BY
        bl.Id,
        bl.LocationCode,
        bl.LocationName,
        bl.BranchId,
        bl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        bl.Capacity
      ORDER BY bl.Id DESC
    `)
    .all(branchId)

  if (batteryLocs.length > 0) {
    return batteryLocs
  }

  return db
    .prepare(`
      SELECT
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        sl.Capacity,
        COALESCE(SUM(bsm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(bsm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN BatteryStorageManager bsm ON bsm.LocationID = sl.Id
      WHERE sl.BranchId = ?
      GROUP BY
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        sl.Capacity
      ORDER BY sl.Id DESC
    `)
    .all(branchId)
}

exports.getStorageLocationByIdForBatteries = (id) => {
  const fromBatteryLoc = db
    .prepare(`
      SELECT
        bl.Id,
        bl.LocationCode,
        bl.LocationName,
        bl.BranchId,
        bl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        bl.Capacity,
        COALESCE(SUM(bsm.Qty), 0) AS UsedCapacity,
        bl.Capacity - COALESCE(SUM(bsm.Qty), 0) AS RemainingCapacity
      FROM BatteryLocationM bl
      LEFT JOIN BranchM b ON b.Id = bl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = bl.LocationTypeId
      LEFT JOIN BatteryStorageManager bsm ON bsm.LocationID = bl.Id
      WHERE bl.Id = ?
      GROUP BY
        bl.Id,
        bl.LocationCode,
        bl.LocationName,
        bl.BranchId,
        bl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        bl.Capacity
    `)
    .get(id)

  if (fromBatteryLoc) {
    return fromBatteryLoc
  }

  return db
    .prepare(`
      SELECT
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        sl.Capacity,
        COALESCE(SUM(bsm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(bsm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN BatteryStorageManager bsm ON bsm.LocationID = sl.Id
      WHERE sl.Id = ?
      GROUP BY
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        sl.Capacity
    `)
    .get(id)
}

exports.createBatteryStorageManager = (storageManager) => {
  const result = db
    .prepare(`
      INSERT INTO BatteryStorageManager (
        BatteryId,
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
      storageManager.BatteryId,
      storageManager.LocationID,
      storageManager.Qty,
      storageManager.OrderID ?? null,
      storageManager.SourceTypeId ?? null,
      storageManager.SourceId ?? null,
      storageManager.CreatedBy ?? null
    )

  return exports.getBatteryStorageManagerById(result.lastInsertRowid)
}

exports.updateBatteryStorageManager = (id, storageManager) => {
  const result = db
    .prepare(`
      UPDATE BatteryStorageManager
      SET
        BatteryId = ?,
        LocationID = ?,
        Qty = ?,
        OrderID = COALESCE(?, OrderID),
        CreatedBy = COALESCE(?, CreatedBy)
      WHERE Id = ?
    `)
    .run(
      storageManager.BatteryId,
      storageManager.LocationID,
      storageManager.Qty,
      storageManager.OrderID ?? null,
      storageManager.CreatedBy ?? null,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getBatteryStorageManagerById(id)
}

exports.deleteBatteryStorageManager = (id) => {
  return db
    .prepare("DELETE FROM BatteryStorageManager WHERE Id = ?")
    .run(id)
}
