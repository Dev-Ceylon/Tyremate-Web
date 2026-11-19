const db = require("../database/connection")

exports.getBatchesByPoTyresId = (poTyresId) => {
  return db
    .prepare(`
      SELECT
        Id,
        PoTyresID,
        DOT,
        Qty,
        CreatedBy,
        createdDate
      FROM PoTyreBatches
      WHERE PoTyresID = ?
      ORDER BY Id ASC
    `)
    .all(poTyresId)
}

exports.getBatchById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        PoTyresID,
        DOT,
        Qty,
        CreatedBy,
        createdDate
      FROM PoTyreBatches
      WHERE Id = ?
    `)
    .get(id)
}

exports.createBatch = (batch) => {
  const result = db
    .prepare(`
      INSERT INTO PoTyreBatches (
        PoTyresID,
        DOT,
        Qty,
        CreatedBy
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      batch.PoTyresID,
      batch.DOT ?? null,
      batch.Qty,
      batch.CreatedBy ?? null
    )

  return exports.getBatchById(result.lastInsertRowid)
}

exports.deleteBatchesByPoTyresId = (poTyresId) => {
  return db
    .prepare("DELETE FROM PoTyreBatches WHERE PoTyresID = ?")
    .run(poTyresId)
}

exports.getBatchesTotalQty = (poTyresId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS TotalQty
      FROM PoTyreBatches
      WHERE PoTyresID = ?
    `)
    .get(poTyresId)

  return Number(row?.TotalQty ?? 0)
}

exports.getBatchStatusByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        pt.ID AS PoTyresID,
        pt.TyreID,
        pt.Qty,
        t.Brand,
        t.Size,
        t.Pattern,
        CASE WHEN COUNT(ptb.Id) > 0 THEN 1 ELSE 0 END AS IsBatchManaged,
        COALESCE(SUM(ptb.Qty), 0) AS BatchQty,
        COUNT(ptb.Id) AS BatchCount
      FROM POTyres pt
      INNER JOIN TyreM t ON t.Id = pt.TyreID
      LEFT JOIN PoTyreBatches ptb ON ptb.PoTyresID = pt.ID
      WHERE pt.POID = ?
      GROUP BY pt.ID
      ORDER BY pt.ID DESC
    `)
    .all(poId)
}