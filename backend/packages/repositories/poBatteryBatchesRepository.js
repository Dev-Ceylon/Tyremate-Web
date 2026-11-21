const db = require("../database/connection")

exports.getBatchesByPoBatteriesId = (poBatteriesId) => {
  return db
    .prepare(`
      SELECT
        Id,
        PoBatteriesID,
        BatchCode,
        Qty
      FROM PoBatteryBatches
      WHERE PoBatteriesID = ?
      ORDER BY Id ASC
    `)
    .all(poBatteriesId)
}

exports.getBatchById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        PoBatteriesID,
        BatchCode,
        Qty
      FROM PoBatteryBatches
      WHERE Id = ?
    `)
    .get(id)
}

exports.createBatch = (batch) => {
  const result = db
    .prepare(`
      INSERT INTO PoBatteryBatches (
        PoBatteriesID,
        BatchCode,
        Qty
      )
      VALUES (?, ?, ?)
    `)
    .run(
      batch.PoBatteriesID,
      batch.BatchCode ?? null,
      batch.Qty
    )

  return exports.getBatchById(result.lastInsertRowid)
}

exports.deleteBatchesByPoBatteriesId = (poBatteriesId) => {
  return db
    .prepare("DELETE FROM PoBatteryBatches WHERE PoBatteriesID = ?")
    .run(poBatteriesId)
}

exports.getBatchesTotalQty = (poBatteriesId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS TotalQty
      FROM PoBatteryBatches
      WHERE PoBatteriesID = ?
    `)
    .get(poBatteriesId)

  return Number(row?.TotalQty ?? 0)
}

exports.getBatchStatusByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        pb.ID AS PoBatteriesID,
        pb.BatteryID,
        pb.Qty,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        CASE WHEN COUNT(pbb.Id) > 0 THEN 1 ELSE 0 END AS IsBatchManaged,
        COALESCE(SUM(pbb.Qty), 0) AS BatchQty,
        COUNT(pbb.Id) AS BatchCount
      FROM POBatteries pb
      INNER JOIN BatteryM b ON b.Id = pb.BatteryID
      LEFT JOIN PoBatteryBatches pbb ON pbb.PoBatteriesID = pb.ID
      WHERE pb.POID = ?
      GROUP BY pb.ID
      ORDER BY pb.ID DESC
    `)
    .all(poId)
}
