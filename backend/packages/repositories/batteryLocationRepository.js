const db = require("../database/connection")

exports.getAllBatteryLocations = () => {
  return db
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
    .all()
}

exports.getBatteryLocationsByBranchId = (branchId) => {
  return db
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
}

exports.getBatteryLocationById = (id) => {
  return db
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
}

exports.getBatteryLocationByCode = (locationCode) => {
  return db
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
      WHERE bl.LocationCode = ?
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
    .get(locationCode)
}

exports.getBatteryLocationByCodeAndBranch = (locationCode, branchId) => {
  return db
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
        bl.Capacity
      FROM BatteryLocationM bl
      LEFT JOIN BranchM b ON b.Id = bl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = bl.LocationTypeId
      WHERE bl.LocationCode = ? AND bl.BranchId = ?
    `)
    .get(locationCode, branchId)
}

exports.hasStock = (id) => {
  const row = db
    .prepare("SELECT 1 FROM BatteryStorageManager WHERE LocationID = ? AND Qty > 0 LIMIT 1")
    .get(id)
  return !!row
}

exports.createBatteryLocation = (batteryLocation) => {
  const result = db
    .prepare(`
      INSERT INTO BatteryLocationM (
        LocationCode,
        LocationName,
        BranchId,
        LocationTypeId,
        Capacity
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      batteryLocation.LocationCode,
      batteryLocation.LocationName,
      batteryLocation.BranchId,
      batteryLocation.LocationTypeId,
      batteryLocation.Capacity
    )

  return exports.getBatteryLocationById(result.lastInsertRowid)
}

exports.updateBatteryLocation = (id, batteryLocation) => {
  const result = db
    .prepare(`
      UPDATE BatteryLocationM
      SET
        LocationCode = ?,
        LocationName = ?,
        BranchId = ?,
        LocationTypeId = ?,
        Capacity = ?
      WHERE Id = ?
    `)
    .run(
      batteryLocation.LocationCode,
      batteryLocation.LocationName,
      batteryLocation.BranchId,
      batteryLocation.LocationTypeId,
      batteryLocation.Capacity,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getBatteryLocationById(id)
}

exports.deleteBatteryLocation = (id) => {
  return db
    .prepare("DELETE FROM BatteryLocationM WHERE Id = ?")
    .run(id)
}
