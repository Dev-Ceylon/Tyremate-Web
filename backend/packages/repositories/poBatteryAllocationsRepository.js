const db = require("../database/connection")

exports.getAllAllocations = () => {
  return db.prepare("SELECT * FROM PoBatteryAllocations").all()
}

exports.getAllocationById = (id) => {
  return db.prepare("SELECT * FROM PoBatteryAllocations WHERE Id = ?").get(id)
}

exports.getAllocationsByPoId = (poId) => {
  return db.prepare("SELECT * FROM PoBatteryAllocations WHERE POID = ?").all(poId)
}

exports.getAllocationsByPoBatteriesId = (poBatteriesId) => {
  return db.prepare("SELECT * FROM PoBatteryAllocations WHERE PoBatteriesID = ?").all(poBatteriesId)
}

exports.getAllocationForPOAndBatteryID = (poId, poBatteriesId) => {
  return db
    .prepare(
      `
      SELECT
        pba.Id,
        pba.POID,
        pba.PoBatteriesID,
        pba.LocationId,
        COALESCE(bl.LocationCode, sl.LocationCode) AS LocationCode,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName
      FROM PoBatteryAllocations pba
      LEFT JOIN BatteryLocationM bl ON bl.Id = pba.LocationId
      LEFT JOIN StorageLocationM sl ON sl.Id = pba.LocationId
      WHERE pba.POID = ? AND pba.PoBatteriesID = ?
      `
    )
    .get(poId, poBatteriesId)
}

exports.createAllocation = (allocation) => {
  const { POID, PoBatteriesID, LocationId } = allocation
  const result = db
    .prepare(`
      INSERT INTO PoBatteryAllocations (POID, PoBatteriesID, LocationId) 
      VALUES (?, ?, ?)
      ON CONFLICT(POID, PoBatteriesID) DO UPDATE SET LocationId = excluded.LocationId
    `)
    .run(POID, PoBatteriesID, LocationId)
  
  const id =
    result.lastInsertRowid ||
    db.prepare("SELECT Id FROM PoBatteryAllocations WHERE POID = ? AND PoBatteriesID = ?").get(POID, PoBatteriesID)?.Id

  return { ...allocation, Id: id }
}

exports.updateAllocation = (id, allocation) => {
  const { POID, PoBatteriesID, LocationId } = allocation
  const result = db
    .prepare(
      "UPDATE PoBatteryAllocations SET POID = ?, PoBatteriesID = ?, LocationId = ? WHERE Id = ?"
    )
    .run(POID, PoBatteriesID, LocationId, id)
  return result.changes > 0 ? { ...allocation, Id: id } : null
}

exports.deleteAllocation = (id) => {
  return db.prepare("DELETE FROM PoBatteryAllocations WHERE Id = ?").run(id)
}

exports.deleteAllocationsByPoId = (poId) => {
  return db.prepare("DELETE FROM PoBatteryAllocations WHERE POID = ?").run(poId)
}

exports.deleteAllocationsByPoBatteriesId = (poBatteriesId) => {
  return db.prepare("DELETE FROM PoBatteryAllocations WHERE PoBatteriesID = ?").run(poBatteriesId)
}
