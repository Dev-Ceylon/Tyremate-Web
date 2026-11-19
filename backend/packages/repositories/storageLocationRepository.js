const db = require("../database/connection")

exports.getAllStorageLocations = () => {
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
        COALESCE(SUM(sm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(sm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN StorageManager sm ON sm.LocationID = sl.Id
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
    .all()
}

exports.getStorageLocationsByBranchId = (branchId) => {
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
        COALESCE(SUM(sm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(sm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN StorageManager sm ON sm.LocationID = sl.Id
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

/**
 * Returns the branch's quarantine location, or undefined when the branch has
 * none configured. When a branch has more than one, the lowest Id wins so the
 * choice is stable across calls.
 */
exports.getQuarantineLocationByBranchId = (branchId) => {
  return db
    .prepare(`
      SELECT
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        sl.Capacity,
        slt.LocationTypeCode AS LocationTypeCode
      FROM StorageLocationM sl
      INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      WHERE sl.BranchId = ? AND LOWER(slt.LocationTypeCode) = 'q-tine'
      ORDER BY sl.Id ASC
      LIMIT 1
    `)
    .get(branchId)
}

exports.getStorageLocationsByLocationTypeId = (locationTypeId) => {
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
        COALESCE(SUM(sm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(sm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN StorageManager sm ON sm.LocationID = sl.Id
      WHERE sl.LocationTypeId = ?
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
    .all(locationTypeId)
}

exports.getStorageLocationById = (id) => {
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
        COALESCE(SUM(sm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(sm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN StorageManager sm ON sm.LocationID = sl.Id
      WHERE sl.Id = ?
      GROUP BY
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName,
        b.BranchName,
        sl.Capacity
    `)
    .get(id)
}

exports.getStorageLocationByCode = (locationCode) => {
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
        COALESCE(SUM(sm.Qty), 0) AS UsedCapacity,
        sl.Capacity - COALESCE(SUM(sm.Qty), 0) AS RemainingCapacity
      FROM StorageLocationM sl
      LEFT JOIN BranchM b ON b.Id = sl.BranchId
      LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
      LEFT JOIN StorageManager sm ON sm.LocationID = sl.Id
      WHERE sl.LocationCode = ?
      GROUP BY
        sl.Id,
        sl.LocationCode,
        sl.LocationName,
        sl.BranchId,
        sl.LocationTypeId,
        slt.LocationTypeName,
        b.BranchName,
        sl.Capacity
    `)
    .get(locationCode)
}

exports.createStorageLocation = (storageLocation) => {
  const result = db
    .prepare(`
      INSERT INTO StorageLocationM (
        LocationCode,
        LocationName,
        BranchId,
        LocationTypeId,
        Capacity
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      storageLocation.LocationCode,
      storageLocation.LocationName,
      storageLocation.BranchId,
      storageLocation.LocationTypeId,
      storageLocation.Capacity
    )

  return exports.getStorageLocationById(result.lastInsertRowid)
}

exports.updateStorageLocation = (id, storageLocation) => {
  const result = db
    .prepare(`
      UPDATE StorageLocationM
      SET
        LocationCode = ?,
        LocationName = ?,
        BranchId = ?,
        LocationTypeId = ?,
        Capacity = ?
      WHERE Id = ?
    `)
    .run(
      storageLocation.LocationCode,
      storageLocation.LocationName,
      storageLocation.BranchId,
      storageLocation.LocationTypeId,
      storageLocation.Capacity,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getStorageLocationById(id)
}

exports.deleteStorageLocation = (id) => {
  return db
    .prepare("DELETE FROM StorageLocationM WHERE Id = ?")
    .run(id)
}
