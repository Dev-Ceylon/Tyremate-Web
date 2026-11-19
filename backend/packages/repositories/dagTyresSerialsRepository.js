const db = require("../database/connection")

const SERIAL_SELECT = `
  SELECT
    dts.ID,
    dts.DAGTyresID,
    dts.SerialNumber,
    dts.DAGCost,
    dts.SoldAt,
    dts.SoldBy
  FROM DAGTyresSerials dts
`

exports.getAllDAGTyresSerials = () => {
  return db
    .prepare(`
      ${SERIAL_SELECT}
      ORDER BY dts.ID DESC
    `)
    .all()
}

exports.getDAGTyresSerialsByDAGTyresId = (dagTyresId) => {
  return db
    .prepare(`
      ${SERIAL_SELECT}
      WHERE dts.DAGTyresID = ?
      ORDER BY dts.ID DESC
    `)
    .all(dagTyresId)
}

exports.getDAGTyresSerialById = (id) => {
  return db
    .prepare(`
      ${SERIAL_SELECT}
      WHERE dts.ID = ?
    `)
    .get(id)
}

exports.createDAGTyresSerial = (dagTyresSerial) => {
  const result = db
    .prepare(`
      INSERT INTO DAGTyresSerials (
        DAGTyresID,
        SerialNumber,
        DAGCost
      )
      VALUES (?, ?, ?)
    `)
    .run(
      dagTyresSerial.DAGTyresID,
      dagTyresSerial.SerialNumber,
      dagTyresSerial.DAGCost === undefined ? null : dagTyresSerial.DAGCost
    )

  return exports.getDAGTyresSerialById(result.lastInsertRowid)
}

exports.updateDAGTyresSerial = (id, dagTyresSerial) => {
  const result = db
    .prepare(`
      UPDATE DAGTyresSerials
      SET
        DAGTyresID = ?,
        SerialNumber = ?,
        DAGCost = ?
      WHERE ID = ?
    `)
    .run(
      dagTyresSerial.DAGTyresID,
      dagTyresSerial.SerialNumber,
      dagTyresSerial.DAGCost === undefined ? null : dagTyresSerial.DAGCost,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGTyresSerialById(id)
}

// Marks a serial as taken. Guarded on SoldAt IS NULL so a serial can never be
// claimed twice; a 0-row update means it was already taken (or does not exist).
exports.markDAGTyresSerialSold = (id, { SoldAt, SoldBy = null }) => {
  const result = db
    .prepare(`
      UPDATE DAGTyresSerials
      SET
        SoldAt = ?,
        SoldBy = ?
      WHERE ID = ? AND SoldAt IS NULL
    `)
    .run(SoldAt, SoldBy, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGTyresSerialById(id)
}

exports.getDAGTyresSerialsByDAGId = (dagId) => {
  return db
    .prepare(`
      SELECT
        dts.ID,
        dts.DAGTyresID,
        dts.SerialNumber,
        dts.DAGCost,
        dts.SoldAt,
        dts.SoldBy
      FROM DAGTyresSerials dts
      INNER JOIN DAGTyres dt ON dt.ID = dts.DAGTyresID
      WHERE dt.DAGID = ?
      ORDER BY dts.ID DESC
    `)
    .all(dagId)
}

exports.deleteDAGTyresSerial = (id) => {
  return db
    .prepare("DELETE FROM DAGTyresSerials WHERE ID = ?")
    .run(id)
}

exports.deleteDAGTyresSerialsByDAGTyresId = (dagTyresId) => {
  return db
    .prepare("DELETE FROM DAGTyresSerials WHERE DAGTyresID = ?")
    .run(dagTyresId)
}
