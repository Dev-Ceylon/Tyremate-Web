const db = require("../database/connection")

exports.getAllSuppliers = () => {
  return db
    .prepare(`
      SELECT
        s.SupplierID,
        s.SupplierCode,
        s.Name,
        s.TinNo,
        s.VatNo,
        (SELECT sc.PhoneNumber FROM SupplierContact sc WHERE sc.SupplierID = s.SupplierID ORDER BY sc.ID ASC LIMIT 1) AS Contact,
        (SELECT sa.AddressLine1 FROM SupplierAddress sa WHERE sa.SupplierID = s.SupplierID ORDER BY sa.ID ASC LIMIT 1) AS Address
      FROM SupplierM s
      ORDER BY s.SupplierID DESC
    `)
    .all()
}

exports.getSupplierById = (supplierId) => {
  return db
    .prepare(`
      SELECT
        SupplierID,
        SupplierCode,
        Name,
        TinNo,
        VatNo
      FROM SupplierM
      WHERE SupplierID = ?
    `)
    .get(supplierId)
}

exports.getSupplierByCode = (supplierCode) => {
  return db
    .prepare(`
      SELECT
        SupplierID,
        SupplierCode,
        Name,
        TinNo,
        VatNo
      FROM SupplierM
      WHERE SupplierCode = ?
    `)
    .get(supplierCode)
}

exports.createSupplier = (supplier) => {
  const result = db
    .prepare(`
      INSERT INTO SupplierM (
        SupplierCode,
        Name,
        TinNo,
        VatNo
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      supplier.SupplierCode,
      supplier.Name,
      supplier.TinNo,
      supplier.VatNo
    )

  return exports.getSupplierById(result.lastInsertRowid)
}

exports.updateSupplier = (supplierId, supplier) => {
  const result = db
    .prepare(`
      UPDATE SupplierM
      SET
        SupplierCode = ?,
        Name = ?,
        TinNo = ?,
        VatNo = ?
      WHERE SupplierID = ?
    `)
    .run(
      supplier.SupplierCode,
      supplier.Name,
      supplier.TinNo,
      supplier.VatNo,
      supplierId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getSupplierById(supplierId)
}

exports.deleteSupplier = (supplierId) => {
  return db
    .prepare("DELETE FROM SupplierM WHERE SupplierID = ?")
    .run(supplierId)
}

exports.createSupplierContact = (contact) => {
  return db
    .prepare(`
      INSERT INTO SupplierContact (SupplierID, PhoneNumber, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(contact.SupplierID, contact.PhoneNumber, contact.IsPrimary)
}

exports.createSupplierEmail = (email) => {
  return db
    .prepare(`
      INSERT INTO SupplierEmail (SupplierID, EmailAddress, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(email.SupplierID, email.EmailAddress, email.IsPrimary)
}

exports.createSupplierAddress = (address) => {
  return db
    .prepare(`
      INSERT INTO SupplierAddress (
        SupplierID,
        AddressType,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        IsPrimary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      address.SupplierID,
      address.AddressType,
      address.AddressLine1,
      address.AddressLine2,
      address.City,
      address.State,
      address.PostalCode,
      address.IsPrimary
    )
}

exports.getSupplierContactsBySupplierId = (supplierId) => {
  return db
    .prepare(`
      SELECT PhoneNumber, IsPrimary
      FROM SupplierContact
      WHERE SupplierID = ?
    `)
    .all(supplierId)
}

exports.getSupplierEmailsBySupplierId = (supplierId) => {
  return db
    .prepare(`
      SELECT EmailAddress, IsPrimary
      FROM SupplierEmail
      WHERE SupplierID = ?
    `)
    .all(supplierId)
}

exports.getSupplierAddressesBySupplierId = (supplierId) => {
  return db
    .prepare(`
      SELECT AddressType, AddressLine1, AddressLine2, City, State, PostalCode, IsPrimary
      FROM SupplierAddress
      WHERE SupplierID = ?
    `)
    .all(supplierId)
}

exports.deleteSupplierContactsBySupplierId = (supplierId) => {
  return db
    .prepare("DELETE FROM SupplierContact WHERE SupplierID = ?")
    .run(supplierId)
}

exports.deleteSupplierEmailsBySupplierId = (supplierId) => {
  return db
    .prepare("DELETE FROM SupplierEmail WHERE SupplierID = ?")
    .run(supplierId)
}

exports.deleteSupplierAddressesBySupplierId = (supplierId) => {
  return db
    .prepare("DELETE FROM SupplierAddress WHERE SupplierID = ?")
    .run(supplierId)
}

exports.getNextSupplierCode = () => {
  const row = db
    .prepare("SELECT MAX(SupplierID) AS MaxId FROM SupplierM")
    .get()

  const nextNumber = (row?.MaxId ?? 0) + 1
  return `SUP${String(nextNumber).padStart(5, "0")}`
}
