const db = require("../database/connection")

exports.getAllPoBatterySuppliers = () => {
  return db
    .prepare(`
      SELECT
        ID,
        PoBatteriesID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoBatterySuppliers
      ORDER BY ID DESC
    `)
    .all()
}

exports.getPoBatterySupplierById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        PoBatteriesID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoBatterySuppliers
      WHERE ID = ?
    `)
    .get(id)
}

exports.getPoBatterySuppliersByPoBatteriesId = (poBatteriesId) => {
  return db
    .prepare(`
      SELECT
        pbs.ID,
        pbs.PoBatteriesID,
        pbs.Qty,
        pbs.SupplierID,
        pbs.IsApproved,
        pbs.ExpectedDeliveryDate,
        pbs.ActualDeliveryDate,
        s.Name AS SupplierName,
        s.SupplierCode
      FROM PoBatterySuppliers pbs
      INNER JOIN SupplierM s ON s.SupplierID = pbs.SupplierID
      WHERE pbs.PoBatteriesID = ?
      ORDER BY pbs.ID DESC
    `)
    .all(poBatteriesId)
}

exports.getPoBatterySupplier = (poBatteriesId, supplierId) => {
  return db
    .prepare(`
      SELECT
        ID,
        PoBatteriesID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      FROM PoBatterySuppliers
      WHERE PoBatteriesID = ? AND SupplierID = ?
    `)
    .get(poBatteriesId, supplierId)
}

exports.createPoBatterySupplier = (supplier) => {
  const result = db
    .prepare(`
      INSERT INTO PoBatterySuppliers (
        PoBatteriesID,
        Qty,
        SupplierID,
        IsApproved,
        ExpectedDeliveryDate,
        ActualDeliveryDate
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      supplier.PoBatteriesID,
      supplier.Qty,
      supplier.SupplierID,
      supplier.IsApproved,
      supplier.ExpectedDeliveryDate || null,
      supplier.ActualDeliveryDate || null
    )

  return exports.getPoBatterySupplierById(result.lastInsertRowid)
}

exports.updatePoBatterySupplier = (id, supplier) => {
  const result = db
    .prepare(`
      UPDATE PoBatterySuppliers
      SET
        PoBatteriesID = ?,
        Qty = ?,
        SupplierID = ?,
        IsApproved = ?,
        ExpectedDeliveryDate = ?,
        ActualDeliveryDate = ?
      WHERE ID = ?
    `)
    .run(
      supplier.PoBatteriesID,
      supplier.Qty,
      supplier.SupplierID,
      supplier.IsApproved,
      supplier.ExpectedDeliveryDate || null,
      supplier.ActualDeliveryDate || null,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatterySupplierById(id)
}

exports.deletePoBatterySupplier = (id) => {
  return db
    .prepare("DELETE FROM PoBatterySuppliers WHERE ID = ?")
    .run(id)
}

exports.deletePoBatterySuppliersByPoBatteriesId = (poBatteriesId) => {
  return db
    .prepare("DELETE FROM PoBatterySuppliers WHERE PoBatteriesID = ?")
    .run(poBatteriesId)
}

exports.updateSupplierApproval = (id, isApproved) => {
  const result = db
    .prepare(`
      UPDATE PoBatterySuppliers
      SET IsApproved = ?
      WHERE ID = ?
    `)
    .run(isApproved === null ? null : isApproved ? 1 : 0, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatterySupplierById(id)
}

exports.updateActualDeliveryDate = (id, actualDeliveryDate) => {
  const result = db
    .prepare(`
      UPDATE PoBatterySuppliers
      SET ActualDeliveryDate = ?
      WHERE ID = ?
    `)
    .run(actualDeliveryDate || null, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatterySupplierById(id)
}
