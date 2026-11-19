const db = require("../database/connection")

exports.getAllDAGTyres = () => {
  return db
    .prepare(`
      SELECT
        dt.ID,
        dt.DAGID,
        dt.TyreID,
        dt.StorageLocationID,
        dt.Qty
      FROM DAGTyres dt
      ORDER BY dt.ID DESC
    `)
    .all()
}

exports.getDAGTyresByDAGId = (dagId) => {
  return db
    .prepare(`
      SELECT
        dt.ID,
        dt.DAGID,
        dt.TyreID,
        dt.StorageLocationID,
        dt.Qty
      FROM DAGTyres dt
      WHERE dt.DAGID = ?
      ORDER BY dt.ID DESC
    `)
    .all(dagId)
}

exports.getDAGTyresByDAGIdWithDetails = (dagId) => {
  return db
    .prepare(`
      SELECT
        dt.ID,
        dt.DAGID,
        dt.TyreID,
        dt.StorageLocationID,
        dt.Qty,
        t.Size AS TyreCode,
        t.Pattern AS TyreName,
        sl.LocationCode AS StorageLocationCode,
        sl.LocationName AS StorageLocationName
      FROM DAGTyres dt
      INNER JOIN TyreM t ON t.Id = dt.TyreID
      INNER JOIN StorageLocationM sl ON sl.Id = dt.StorageLocationID
      WHERE dt.DAGID = ?
      ORDER BY dt.ID DESC
    `)
    .all(dagId)
}

exports.getDAGTyreById = (id) => {
  return db
    .prepare(`
      SELECT
        dt.ID,
        dt.DAGID,
        dt.TyreID,
        dt.StorageLocationID,
        dt.Qty
      FROM DAGTyres dt
      WHERE dt.ID = ?
    `)
    .get(id)
}

exports.createDAGTyre = (dagTyre) => {
  const result = db
    .prepare(`
      INSERT INTO DAGTyres (
        DAGID,
        TyreID,
        StorageLocationID,
        Qty
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      dagTyre.DAGID,
      dagTyre.TyreID,
      dagTyre.StorageLocationID,
      dagTyre.Qty
    )

  return exports.getDAGTyreById(result.lastInsertRowid)
}

exports.updateDAGTyre = (id, dagTyre) => {
  const result = db
    .prepare(`
      UPDATE DAGTyres
      SET
        DAGID = ?,
        TyreID = ?,
        StorageLocationID = ?,
        Qty = ?
      WHERE ID = ?
    `)
    .run(
      dagTyre.DAGID,
      dagTyre.TyreID,
      dagTyre.StorageLocationID,
      dagTyre.Qty,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGTyreById(id)
}

exports.deleteDAGTyre = (id) => {
  return db
    .prepare("DELETE FROM DAGTyres WHERE ID = ?")
    .run(id)
}

exports.deleteDAGTyresByDAGId = (dagId) => {
  return db
    .prepare("DELETE FROM DAGTyres WHERE DAGID = ?")
    .run(dagId)
}
