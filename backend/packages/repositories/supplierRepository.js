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
        s.SupplierTypeID,
        st.TypeCode AS SupplierTypeCode,
        st.TypeName AS SupplierTypeName,
        (SELECT sc.PhoneNumber FROM SupplierContact sc WHERE sc.SupplierID = s.SupplierID ORDER BY sc.ID ASC LIMIT 1) AS Contact,
        (SELECT sa.AddressLine1 FROM SupplierAddress sa WHERE sa.SupplierID = s.SupplierID ORDER BY sa.ID ASC LIMIT 1) AS Address
      FROM SupplierM s
      LEFT JOIN SupplierTypeM st ON st.Id = s.SupplierTypeID
      ORDER BY s.SupplierID DESC
    `)
    .all()
}

exports.getSupplierById = (supplierId) => {
  return db
    .prepare(`
      SELECT
        s.SupplierID,
        s.SupplierCode,
        s.Name,
        s.TinNo,
        s.VatNo,
        s.SupplierTypeID,
        st.TypeCode AS SupplierTypeCode,
        st.TypeName AS SupplierTypeName
      FROM SupplierM s
      LEFT JOIN SupplierTypeM st ON st.Id = s.SupplierTypeID
      WHERE s.SupplierID = ?
    `)
    .get(supplierId)
}

exports.getSupplierByCode = (supplierCode) => {
  return db
    .prepare(`
      SELECT
        s.SupplierID,
        s.SupplierCode,
        s.Name,
        s.TinNo,
        s.VatNo,
        s.SupplierTypeID,
        st.TypeCode AS SupplierTypeCode,
        st.TypeName AS SupplierTypeName
      FROM SupplierM s
      LEFT JOIN SupplierTypeM st ON st.Id = s.SupplierTypeID
      WHERE s.SupplierCode = ?
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
        VatNo,
        SupplierTypeID
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      supplier.SupplierCode,
      supplier.Name,
      supplier.TinNo,
      supplier.VatNo,
      supplier.SupplierTypeID ?? null
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
        VatNo = ?,
        SupplierTypeID = ?
      WHERE SupplierID = ?
    `)
    .run(
      supplier.SupplierCode,
      supplier.Name,
      supplier.TinNo,
      supplier.VatNo,
      supplier.SupplierTypeID ?? null,
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

exports.getAllSupplierTypes = () => {
  return db
    .prepare("SELECT Id, TypeCode, TypeName, Description FROM SupplierTypeM ORDER BY Id ASC")
    .all()
    .map((row) => ({
      Id: row.Id,
      TypeCode: row.TypeCode,
      TypeName: row.TypeName,
      Description: row.Description,
      SupplierTypeCode: row.TypeCode,
      SupplierTypeName: row.TypeName,
    }))
}

exports.getSupplierTypeByCode = (code) => {
  const row = db
    .prepare("SELECT Id, TypeCode, TypeName, Description FROM SupplierTypeM WHERE LOWER(TypeCode) = LOWER(?)")
    .get(code)

  if (!row) return null
  return {
    Id: row.Id,
    TypeCode: row.TypeCode,
    TypeName: row.TypeName,
    Description: row.Description,
    SupplierTypeCode: row.TypeCode,
    SupplierTypeName: row.TypeName,
  }
}

