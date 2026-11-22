const db = require("../database/connection")

exports.createAllocation = (allocation) => {
  const result = db
    .prepare(`
      INSERT INTO SoBatteryStorageAllocation (
        SoBatteryID,
        BatteryStorageManagerID,
        BatteryStorageManagerBatchID,
        Qty
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      allocation.SoBatteryID,
      allocation.BatteryStorageManagerID ?? null,
      allocation.BatteryStorageManagerBatchID ?? null,
      allocation.Qty
    )

  return {
    Id: result.lastInsertRowid,
    ...allocation,
  }
}

exports.getAllocationsBySoBatteryId = (soBatteryId) => {
  return db
    .prepare(`
      SELECT
        a.Id AS AllocationID,
        a.SoBatteryID,
        a.BatteryStorageManagerID,
        a.BatteryStorageManagerBatchID,
        a.Qty,
        a.CreatedAt,
        COALESCE(bl.LocationName, sl.LocationName, 'Battery Bay') AS LocationName,
        COALESCE(bl.LocationCode, sl.LocationCode, '') AS LocationCode,
        bsmb.BatchCode,
        bsmb.ExpiryDate,
        COALESCE((SELECT SUM(srb.Qty) FROM SoReturnBatteries srb WHERE srb.SoBatteryStorageAllocationID = a.Id), 0) AS ReturnedQty
      FROM SoBatteryStorageAllocation a
      LEFT JOIN BatteryStorageManager bsm ON bsm.Id = a.BatteryStorageManagerID
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN BatteryStorageManagerBatch bsmb ON bsmb.Id = a.BatteryStorageManagerBatchID
      WHERE a.SoBatteryID = ?
      ORDER BY a.Id ASC
    `)
    .all(soBatteryId)
}

exports.getAllocationsBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        a.Id AS AllocationID,
        a.SoBatteryID,
        a.BatteryStorageManagerID,
        a.BatteryStorageManagerBatchID,
        a.Qty,
        sb.SoID,
        sb.BatteryID,
        sb.Price,
        sb.Discount,
        COALESCE(bl.LocationName, sl.LocationName, 'Battery Bay') AS LocationName,
        COALESCE(bl.LocationCode, sl.LocationCode, '') AS LocationCode,
        COALESCE(bl.Id, sl.Id) AS LocationID,
        bsmb.BatchCode,
        bsmb.ExpiryDate,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        COALESCE((SELECT SUM(srb.Qty) FROM SoReturnBatteries srb WHERE srb.SoBatteryStorageAllocationID = a.Id), 0) AS ReturnedQty
      FROM SoBatteryStorageAllocation a
      INNER JOIN SoBatteries sb ON sb.ID = a.SoBatteryID
      INNER JOIN BatteryM b ON b.Id = sb.BatteryID
      LEFT JOIN BatteryStorageManager bsm ON bsm.Id = a.BatteryStorageManagerID
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
      LEFT JOIN BatteryStorageManagerBatch bsmb ON bsmb.Id = a.BatteryStorageManagerBatchID
      WHERE sb.SoID = ?
      ORDER BY a.Id ASC
    `)
    .all(soId)
}

exports.getAllocationById = (id) => {
  return db
    .prepare(`
      SELECT
        Id AS AllocationID,
        SoBatteryID,
        BatteryStorageManagerID,
        BatteryStorageManagerBatchID,
        Qty,
        CreatedAt
      FROM SoBatteryStorageAllocation
      WHERE Id = ?
    `)
    .get(id)
}

exports.deleteAllocation = (id) => {
  return db
    .prepare("DELETE FROM SoBatteryStorageAllocation WHERE Id = ?")
    .run(id)
}
