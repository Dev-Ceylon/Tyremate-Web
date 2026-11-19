const db = require("../database/connection")

exports.getAllConsumableLocations = () => {
  return db
    .prepare(`
      SELECT
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        cl.Capacity,
        COALESCE(SUM(csm.Qty), 0) AS UsedCapacity,
        cl.Capacity - COALESCE(SUM(csm.Qty), 0) AS RemainingCapacity
      FROM ConsumableLocationM cl
      LEFT JOIN BranchM b ON b.Id = cl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = cl.LocationTypeId
      LEFT JOIN ConsumableStorageManager csm ON csm.LocationID = cl.Id
      GROUP BY
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        cl.Capacity
      ORDER BY cl.Id DESC
    `)
    .all()
}

exports.getConsumableLocationsByBranchId = (branchId) => {
  return db
    .prepare(`
      SELECT
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        cl.Capacity,
        COALESCE(SUM(csm.Qty), 0) AS UsedCapacity,
        cl.Capacity - COALESCE(SUM(csm.Qty), 0) AS RemainingCapacity
      FROM ConsumableLocationM cl
      LEFT JOIN BranchM b ON b.Id = cl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = cl.LocationTypeId
      LEFT JOIN ConsumableStorageManager csm ON csm.LocationID = cl.Id
      WHERE cl.BranchId = ?
      GROUP BY
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        cl.Capacity
      ORDER BY cl.Id DESC
    `)
    .all(branchId)
}

exports.getConsumableLocationById = (id) => {
  return db
    .prepare(`
      SELECT
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        cl.Capacity,
        COALESCE(SUM(csm.Qty), 0) AS UsedCapacity,
        cl.Capacity - COALESCE(SUM(csm.Qty), 0) AS RemainingCapacity
      FROM ConsumableLocationM cl
      LEFT JOIN BranchM b ON b.Id = cl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = cl.LocationTypeId
      LEFT JOIN ConsumableStorageManager csm ON csm.LocationID = cl.Id
      WHERE cl.Id = ?
      GROUP BY
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        cl.Capacity
    `)
    .get(id)
}

exports.getConsumableLocationByCode = (locationCode) => {
  return db
    .prepare(`
      SELECT
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName AS LocationType,
        slt.LocationTypeCode AS LocationTypeCode,
        b.BranchName AS Branch,
        cl.Capacity,
        COALESCE(SUM(csm.Qty), 0) AS UsedCapacity,
        cl.Capacity - COALESCE(SUM(csm.Qty), 0) AS RemainingCapacity
      FROM ConsumableLocationM cl
      LEFT JOIN BranchM b ON b.Id = cl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = cl.LocationTypeId
      LEFT JOIN ConsumableStorageManager csm ON csm.LocationID = cl.Id
      WHERE cl.LocationCode = ?
      GROUP BY
        cl.Id,
        cl.LocationCode,
        cl.LocationName,
        cl.BranchId,
        cl.LocationTypeId,
        slt.LocationTypeName,
        slt.LocationTypeCode,
        b.BranchName,
        cl.Capacity
    `)
    .get(locationCode)
}

exports.createConsumableLocation = (consumableLocation) => {
  const result = db
    .prepare(`
      INSERT INTO ConsumableLocationM (
        LocationCode,
        LocationName,
        BranchId,
        LocationTypeId,
        Capacity
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      consumableLocation.LocationCode,
      consumableLocation.LocationName,
      consumableLocation.BranchId,
      consumableLocation.LocationTypeId,
      consumableLocation.Capacity
    )

  return exports.getConsumableLocationById(result.lastInsertRowid)
}

exports.updateConsumableLocation = (id, consumableLocation) => {
  const result = db
    .prepare(`
      UPDATE ConsumableLocationM
      SET
        LocationCode = ?,
        LocationName = ?,
        BranchId = ?,
        LocationTypeId = ?,
        Capacity = ?
      WHERE Id = ?
    `)
    .run(
      consumableLocation.LocationCode,
      consumableLocation.LocationName,
      consumableLocation.BranchId,
      consumableLocation.LocationTypeId,
      consumableLocation.Capacity,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getConsumableLocationById(id)
}

exports.deleteConsumableLocation = (id) => {
  return db
    .prepare("DELETE FROM ConsumableLocationM WHERE Id = ?")
    .run(id)
}
