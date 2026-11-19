const db = require("../database/connection")

exports.getSuppliersByTyreId = (tyreId) => {
  return db
    .prepare(`
      SELECT
        s.SupplierID,
        s.SupplierCode,
        s.Name,
        (SELECT sc.PhoneNumber FROM SupplierContact sc WHERE sc.SupplierID = s.SupplierID ORDER BY sc.ID ASC LIMIT 1) AS Contact,
        s.TinNo,
        s.VatNo,
        ts.Price
      FROM TyreSupplier ts
      INNER JOIN SupplierM s
        ON s.SupplierID = ts.SupplierID
      WHERE ts.TyreId = ?
      ORDER BY s.SupplierID DESC
    `)
    .all(tyreId)
}

exports.getTyresBySupplierId = (supplierId) => {
  return db
    .prepare(`
      SELECT
        ts.TyreId AS TyreID,
        ts.Price,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall
      FROM TyreSupplier ts
      INNER JOIN TyreM t
        ON t.Id = ts.TyreId
      WHERE ts.SupplierID = ?
      ORDER BY ts.Id DESC
    `)
    .all(supplierId)
}

exports.getSupplierIdsByTyreId = (tyreId) => {
  const rows = db
    .prepare(`
      SELECT SupplierID
      FROM TyreSupplier
      WHERE TyreId = ?
      ORDER BY SupplierID ASC
    `)
    .all(tyreId)

  return rows.map((row) => row.SupplierID)
}

const verifySupplierIds = (supplierIds) => {
  if (supplierIds.length === 0) {
    return
  }

  const placeholders = supplierIds.map(() => "?").join(", ")
  const result = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM SupplierM
      WHERE SupplierID IN (${placeholders})
    `)
    .get(...supplierIds)

  if ((result?.count ?? 0) !== supplierIds.length) {
    throw new Error("One or more suppliers were not found")
  }
}

exports.syncTyreSuppliers = (tyreId, supplierIds = []) => {
  const uniqueSupplierIds = [...new Set(supplierIds)]

  verifySupplierIds(uniqueSupplierIds)

  db
    .prepare(`
      DELETE FROM TyreSupplier
      WHERE TyreId = ?
    `)
    .run(tyreId)

  const insertStmt = db.prepare(`
    INSERT INTO TyreSupplier (
      TyreId,
      SupplierID
    )
    VALUES (?, ?)
  `)

  uniqueSupplierIds.forEach((supplierId) => {
    insertStmt.run(tyreId, supplierId)
  })
}

exports.create = (data, options = {}) => {
  const { supplierId, tyreId, price } = data

  if (!supplierId || !tyreId || price === undefined) {
    throw new Error('supplierId, tyreId, and price are required')
  }

  if (typeof price !== 'number' || price < 0) {
    throw new Error('Price must be a non-negative number')
  }

  const stmt = db.prepare(`
    INSERT INTO TyreSupplier (
      TyreId,
      SupplierID,
      Price
    )
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(tyreId, supplierId, price)
  return result
}

exports.syncSupplierTyres = (supplierId, tyres = []) => {
  const uniqueTyres = []
  const seenTyreIds = new Set()

  tyres.forEach((item) => {
    if (!item || seenTyreIds.has(item.TyreID)) {
      return
    }

    seenTyreIds.add(item.TyreID)
    uniqueTyres.push(item)
  })

  db
    .prepare(`
      DELETE FROM TyreSupplier
      WHERE SupplierID = ?
    `)
    .run(supplierId)

  const insertStmt = db.prepare(`
    INSERT INTO TyreSupplier (
      TyreId,
      SupplierID,
      Price
    )
    VALUES (?, ?, ?)
  `)

  uniqueTyres.forEach((item) => {
    insertStmt.run(item.TyreID, supplierId, item.Price)
  })
}
