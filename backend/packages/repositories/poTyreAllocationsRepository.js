const db = require("../database/connection")

exports.getAllAllocations = () => {
  return db.prepare("SELECT * FROM PoTyreAllocations").all()
}

exports.getAllocationById = (id) => {
  return db.prepare("SELECT * FROM PoTyreAllocations WHERE Id = ?").get(id)
}

exports.getAllocationsByPoId = (poId) => {
  return db.prepare("SELECT * FROM PoTyreAllocations WHERE POID = ?").all(poId)
}

exports.getAllocationsByPoTyresId = (poTyresId) => {
  return db.prepare("SELECT * FROM PoTyreAllocations WHERE PoTyresID = ?").all(poTyresId)
}

exports.getAllocationForPOAndTyreID = (poId, poTyresId) => {
  return db
    .prepare(
      `
      SELECT
        pta.Id,
        pta.POID,
        pta.PoTyresID,
        pta.LocationId,
        sl.LocationCode,
        sl.LocationName
      FROM PoTyreAllocations pta
      INNER JOIN StorageLocationM sl ON sl.Id = pta.LocationId
      WHERE pta.POID = ? AND pta.PoTyresID = ?
      `
    )
    .get(poId, poTyresId)
}

exports.createAllocation = (allocation) => {
  const { POID, PoTyresID, LocationId } = allocation
  const result = db
    .prepare(`
      INSERT INTO PoTyreAllocations (POID, PoTyresID, LocationId) 
      VALUES (?, ?, ?)
      ON CONFLICT(POID, PoTyresID) DO UPDATE SET LocationId = excluded.LocationId
    `)
    .run(POID, PoTyresID, LocationId)
  
  // If an update occurred instead of an insert, lastInsertRowid might be 0.
  // We fetch the ID to ensure the returned object is accurate for both cases.
  const id = result.lastInsertRowid || db.prepare("SELECT Id FROM PoTyreAllocations WHERE POID = ? AND PoTyresID = ?").get(POID, PoTyresID).Id

  return { ...allocation, Id: id }
}

exports.updateAllocation = (id, allocation) => {
  const { POID, PoTyresID, LocationId } = allocation
  const result = db
    .prepare(
      "UPDATE PoTyreAllocations SET POID = ?, PoTyresID = ?, LocationId = ? WHERE Id = ?"
    )
    .run(POID, PoTyresID, LocationId, id)
  return result.changes > 0 ? { ...allocation, Id: id } : null
}

exports.deleteAllocation = (id) => {
  return db.prepare("DELETE FROM PoTyreAllocations WHERE Id = ?").run(id)
}

exports.deleteAllocationsByPoId = (poId) => {
  return db.prepare("DELETE FROM PoTyreAllocations WHERE POID = ?").run(poId)
}

exports.deleteAllocationsByPoTyresId = (poTyresId) => {
  return db.prepare("DELETE FROM PoTyreAllocations WHERE PoTyresID = ?").run(poTyresId)
}