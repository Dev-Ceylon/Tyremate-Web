const db = require("../database/connection")

exports.getAllPoTyresSuppliers = () => {
  return db
    .prepare(`
      SELECT
        ID,
        PoTyresID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoTyresSuppliers
      ORDER BY ID DESC
    `)
    .all()
}

exports.getPoTyresSupplierById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        PoTyresID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoTyresSuppliers
      WHERE ID = ?
    `)
    .get(id)
}

exports.getPoTyresSuppliersByPoTyresId = (poTyresId) => {
  return db
    .prepare(`
      SELECT
        pts.ID,
        pts.PoTyresID,
        pts.Qty,
        pts.SupplierID,
        pts.IsApproved,
        pts.ExpectedDeliveryDate,
        pts.ActualDeliveryDate,
        s.Name AS SupplierName,
        s.SupplierCode
      FROM PoTyresSuppliers pts
      INNER JOIN SupplierM s ON s.SupplierID = pts.SupplierID
      WHERE pts.PoTyresID = ?
      ORDER BY pts.ID DESC
    `)
    .all(poTyresId)
}

exports.getPoTyresSupplier = (poTyresId, supplierId) => {
  return db
    .prepare(`
      SELECT
        ID,
        PoTyresID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoTyresSuppliers
      WHERE PoTyresID = ? AND SupplierID = ?
    `)
    .get(poTyresId, supplierId)
}

exports.createPoTyresSupplier = (payload) => {
  const result = db
    .prepare(`
      INSERT INTO PoTyresSuppliers (PoTyresID, Qty, SupplierID, IsApproved, ExpectedDeliveryDate, ActualDeliveryDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      payload.PoTyresID,
      payload.Qty,
      payload.SupplierID,
      payload.IsApproved,
      payload.ExpectedDeliveryDate ?? null,
      payload.ActualDeliveryDate ?? null
    )

  return exports.getPoTyresSupplierById(result.lastInsertRowid)
}

exports.updatePoTyresSupplier = (id, payload) => {
  db.prepare(`
      UPDATE PoTyresSuppliers
      SET
        PoTyresID = ?,
        Qty = ?,
        SupplierID = ?,
        IsApproved = ?,
        ExpectedDeliveryDate = ?,
        ActualDeliveryDate = ?
      WHERE ID = ?
    `)
    .run(
      payload.PoTyresID,
      payload.Qty,
      payload.SupplierID,
      payload.IsApproved,
      payload.ExpectedDeliveryDate ?? null,
      payload.ActualDeliveryDate ?? null,
      id
    )

  return exports.getPoTyresSupplierById(id)
}

exports.updateApprovalStatus = (id, isApproved) => {
  db.prepare(`
      UPDATE PoTyresSuppliers
      SET IsApproved = ?
      WHERE ID = ?
    `)
    .run(isApproved, id)

  return exports.getPoTyresSupplierById(id)
}

exports.updateDeliveryDates = (id, payload = {}) => {
  const expected = payload.ExpectedDeliveryDate ?? null
  const actual = payload.ActualDeliveryDate ?? null

  db.prepare(`
      UPDATE PoTyresSuppliers
      SET
        ExpectedDeliveryDate = ?,
        ActualDeliveryDate = ?
      WHERE ID = ?
    `)
    .run(expected, actual, id)

  return exports.getPoTyresSupplierById(id)
}

exports.setActualDeliveryDateForApprovedAllocations = (poTyresId, actualDeliveryDate) => {
  return db.prepare(`
      UPDATE PoTyresSuppliers
      SET ActualDeliveryDate = COALESCE(ActualDeliveryDate, ?)
      WHERE PoTyresID = ? AND IsApproved = 1
    `)
    .run(actualDeliveryDate, poTyresId)
}

exports.setActualDeliveryDateById = (id, actualDeliveryDate) => {
  return db.prepare(`
      UPDATE PoTyresSuppliers
      SET ActualDeliveryDate = COALESCE(ActualDeliveryDate, ?)
      WHERE ID = ? AND IsApproved = 1
    `)
    .run(actualDeliveryDate, id)
}

exports.deletePoTyresSupplier = (id) => {
  return db.prepare("DELETE FROM PoTyresSuppliers WHERE ID = ?").run(id)
}

exports.deletePoTyresSuppliersByPoTyresId = (poTyresId) => {
  return db.prepare("DELETE FROM PoTyresSuppliers WHERE PoTyresID = ?").run(poTyresId)
}