const db = require("../database/connection")

exports.createAllocation = (allocation) => {
  const result = db
    .prepare(`
      INSERT INTO SoTyreStorageAllocation (
        SoTyreID,
        StorageManagerID,
        StorageManagerBatchID,
        Qty
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      allocation.SoTyreID,
      allocation.StorageManagerID ?? null,
      allocation.StorageManagerBatchID ?? null,
      allocation.Qty
    )

  return {
    Id: result.lastInsertRowid,
    ...allocation
  }
}

exports.getAllocationsBySoTyreId = (soTyreId) => {
  return db
    .prepare(`
      SELECT
        a.Id AS AllocationID,
        a.SoTyreID,
        a.StorageManagerID,
        a.StorageManagerBatchID,
        a.Qty,
        a.CreatedAt,
        sl.LocationName,
        smb.DOT,
        COALESCE((SELECT SUM(srt.Qty) FROM SoReturnTyres srt WHERE srt.SoTyreStorageAllocationID = a.Id), 0) +
        COALESCE((
          SELECT SUM(srl.ReturnedQty)
          FROM SalesReturnLine srl
          INNER JOIN SalesReturn sr ON sr.SalesReturnID = srl.SalesReturnID
          INNER JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
          WHERE srl.AllocationID = a.Id AND srs.StatusCode NOT IN ('REJECTED', 'CANCELLED')
        ), 0) AS ReturnedQty
      FROM SoTyreStorageAllocation a
      LEFT JOIN StorageManager sm ON sm.Id = a.StorageManagerID
      LEFT JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = a.StorageManagerBatchID
      WHERE a.SoTyreID = ?
      ORDER BY a.Id ASC
    `)
    .all(soTyreId)
}

exports.getAllocationsBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        a.Id AS AllocationID,
        a.SoTyreID,
        a.StorageManagerID,
        a.StorageManagerBatchID,
        a.Qty,
        st.SoID,
        st.TyreID,
        st.Price,
        st.Discount,
        sl.LocationName,
        smb.DOT
      FROM SoTyreStorageAllocation a
      INNER JOIN SoTyres st ON st.ID = a.SoTyreID
      LEFT JOIN StorageManager sm ON sm.Id = a.StorageManagerID
      LEFT JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = a.StorageManagerBatchID
      WHERE st.SoID = ?
      ORDER BY a.Id ASC
    `)
    .all(soId)
}

exports.deleteAllocationsBySoTyreId = (soTyreId) => {
  return db
    .prepare(`
      DELETE FROM SoTyreStorageAllocation
      WHERE SoTyreID = ?
    `)
    .run(soTyreId)
}

exports.getAllocationById = (allocationId) => {
  return db
    .prepare(`
      SELECT
        Id,
        SoTyreID,
        StorageManagerID,
        StorageManagerBatchID,
        Qty,
        CreatedAt
      FROM SoTyreStorageAllocation
      WHERE Id = ?
    `)
    .get(allocationId)
}
