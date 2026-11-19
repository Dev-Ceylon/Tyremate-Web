const db = require("../database/connection")

exports.getAllDagTyreStorages = () => {
  return db
    .prepare(`
      SELECT
        ID,
        DAGTyresID,
        StorageManagerID
      FROM DagTyreStorage
      ORDER BY ID DESC
    `)
    .all()
}

exports.getDagTyreStorageById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        DAGTyresID,
        StorageManagerID
      FROM DagTyreStorage
      WHERE ID = ?
    `)
    .get(id)
}

exports.getDagTyreStoragesByDagTyresId = (dagTyresId) => {
  return db
    .prepare(`
      SELECT
        ID,
        DAGTyresID,
        StorageManagerID
      FROM DagTyreStorage
      WHERE DAGTyresID = ?
      ORDER BY ID DESC
    `)
    .all(dagTyresId)
}

exports.getDagTyreStoragesByStorageManagerId = (storageManagerId) => {
  return db
    .prepare(`
      SELECT
        ID,
        DAGTyresID,
        StorageManagerID
      FROM DagTyreStorage
      WHERE StorageManagerID = ?
      ORDER BY ID DESC
    `)
    .all(storageManagerId)
}

exports.createDagTyreStorage = (payload) => {
  const result = db
    .prepare(`
      INSERT INTO DagTyreStorage (
        DAGTyresID,
        StorageManagerID
      )
      VALUES (?, ?)
    `)
    .run(payload.DAGTyresID, payload.StorageManagerID)

  return exports.getDagTyreStorageById(result.lastInsertRowid)
}

exports.updateDagTyreStorage = (id, payload) => {
  const result = db
    .prepare(`
      UPDATE DagTyreStorage
      SET DAGTyresID = ?, StorageManagerID = ?
      WHERE ID = ?
    `)
    .run(payload.DAGTyresID, payload.StorageManagerID, id)

  return result.changes === 0 ? null : exports.getDagTyreStorageById(id)
}

exports.deleteDagTyreStorage = (id) => {
  return db
    .prepare("DELETE FROM DagTyreStorage WHERE ID = ?")
    .run(id)
}

exports.deleteDagTyreStorageByDagTyresId = (dagTyresId) => {
  return db
    .prepare("DELETE FROM DagTyreStorage WHERE DAGTyresID = ?")
    .run(dagTyresId)
}