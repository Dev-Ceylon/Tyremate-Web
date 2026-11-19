const db = require("../database/connection")

exports.getAllPoTyres = () => {
  return db
    .prepare(`
      SELECT
        pt.ID,
        pt.POID,
        pt.TyreID,
        pt.Price,
        pt.Discount,
        pt.Qty,
        pt.IsAdminApproved,
        pt.StatusID,
        sm.StatusCode AS StatusCode
      FROM POTyres pt
      LEFT JOIN StatusM sm ON sm.Id = pt.StatusID
      ORDER BY pt.ID DESC
    `)
    .all()
}

exports.getPoTyre = (poId, tyreId) => {
  return db
    .prepare(`
      SELECT
        pt.ID,
        pt.POID,
        pt.TyreID,
        pt.Price,
        pt.Discount,
        pt.Qty,
        pt.IsAdminApproved,
        pt.StatusID,
        sm.StatusCode AS StatusCode
      FROM POTyres pt
      LEFT JOIN StatusM sm ON sm.Id = pt.StatusID
      WHERE pt.POID = ? AND pt.TyreID = ?
    `)
    .get(poId, tyreId)
}

exports.getPoTyresByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        pt.ID,
        pt.POID,
        pt.TyreID,
        pt.Price,
        pt.Discount,
        pt.Qty,
        pt.IsAdminApproved,
        pt.StatusID,
        sm.StatusCode AS StatusCode,
        t.Brand,
        t.Size,
        t.Pattern,
        pta.LocationId,
        sl.LocationCode,
        sl.LocationName
      FROM POTyres pt
      INNER JOIN TyreM t ON t.Id = pt.TyreID
      LEFT JOIN StatusM sm ON sm.Id = pt.StatusID
      LEFT JOIN PoTyreAllocations pta ON pta.PoTyresID = pt.ID
      LEFT JOIN StorageLocationM sl ON sl.Id = pta.LocationId
      WHERE pt.POID = ?
      ORDER BY pt.ID DESC
    `)
    .all(poId)
}

exports.getPoTyreById = (poTyreId) => {
  return db
    .prepare(`
      SELECT
        pt.ID,
        pt.POID,
        pt.TyreID,
        pt.Price,
        pt.Discount,
        pt.Qty,
        pt.IsAdminApproved,
        pt.StatusID,
        sm.StatusCode AS StatusCode
      FROM POTyres pt
      LEFT JOIN StatusM sm ON sm.Id = pt.StatusID
      WHERE pt.ID = ?
    `)
    .get(poTyreId)
}

exports.createPoTyre = (poTyre) => {
  const result = db
    .prepare(`
      INSERT INTO POTyres (
        POID,
        TyreID,
        Price,
        Discount,
        Qty,
        IsAdminApproved,
        StatusID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      poTyre.POID,
      poTyre.TyreID,
      poTyre.Price,
      poTyre.Discount,
      poTyre.Qty,
      poTyre.IsAdminApproved,
      poTyre.StatusID ?? null
    )

  return db
    .prepare(`
      SELECT
        pt.ID,
        pt.POID,
        pt.TyreID,
        pt.Price,
        pt.Discount,
        pt.Qty,
        pt.IsAdminApproved,
        pt.StatusID,
        sm.StatusCode AS StatusCode
      FROM POTyres pt
      LEFT JOIN StatusM sm ON sm.Id = pt.StatusID
      WHERE pt.ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updatePoTyre = (poId, tyreId, poTyre) => {
  const result = db
    .prepare(`
      UPDATE POTyres
      SET
        POID = ?,
        TyreID = ?,
        Price = ?,
        Discount = ?,
        Qty = ?,
        IsAdminApproved = ?,
        StatusID = ?
      WHERE POID = ? AND TyreID = ?
    `)
    .run(
      poTyre.POID,
      poTyre.TyreID,
      poTyre.Price,
      poTyre.Discount,
      poTyre.Qty,
      poTyre.IsAdminApproved,
      poTyre.StatusID ?? null,
      poId,
      tyreId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getPoTyre(poTyre.POID, poTyre.TyreID)
}

exports.updateStatus = (poTyresId, statusId) => {
  const result = db
    .prepare(`
      UPDATE POTyres
      SET StatusID = ?
      WHERE ID = ?
    `)
    .run(statusId, poTyresId)

  if (result.changes === 0) {
    return null
  }

  return exports.getPoTyreById(poTyresId)
}

exports.deletePoTyre = (poId, tyreId) => {
  return db
    .prepare(`
      DELETE FROM POTyres
      WHERE POID = ? AND TyreID = ?
    `)
    .run(poId, tyreId)
}

exports.deletePoTyresByPoId = (poId) => {
  return db
    .prepare(`
      DELETE FROM POTyres
      WHERE POID = ?
    `)
    .run(poId)
}
