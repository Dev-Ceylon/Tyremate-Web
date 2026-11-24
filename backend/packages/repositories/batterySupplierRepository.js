const db = require("../database/connection")

exports.getSuppliersByBatteryId = (batteryId) => {
  return db
    .prepare(`
      SELECT
        s.SupplierID,
        s.SupplierCode,
        s.Name,
        (SELECT sc.PhoneNumber FROM SupplierContact sc WHERE sc.SupplierID = s.SupplierID ORDER BY sc.ID ASC LIMIT 1) AS Contact,
        s.TinNo,
        s.VatNo,
        bs.Price
      FROM BatterySupplier bs
      INNER JOIN SupplierM s
        ON s.SupplierID = bs.SupplierID
      WHERE bs.BatteryId = ?
      ORDER BY s.SupplierID DESC
    `)
    .all(batteryId)
}

exports.getBatteriesBySupplierId = (supplierId) => {
  return db
    .prepare(`
      SELECT
        bs.BatteryId AS BatteryID,
        bs.Price,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.WarrantyMonths
      FROM BatterySupplier bs
      INNER JOIN BatteryM b
        ON b.Id = bs.BatteryId
      WHERE bs.SupplierID = ?
      ORDER BY bs.Id DESC
    `)
    .all(supplierId)
}

exports.getSupplierIdsByBatteryId = (batteryId) => {
  const rows = db
    .prepare(`
      SELECT SupplierID
      FROM BatterySupplier
      WHERE BatteryId = ?
      ORDER BY SupplierID ASC
    `)
    .all(batteryId)

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

exports.syncBatterySuppliers = (batteryId, supplierIds = []) => {
  const uniqueSupplierIds = [...new Set(supplierIds)]

  verifySupplierIds(uniqueSupplierIds)

  db
    .prepare(`
      DELETE FROM BatterySupplier
      WHERE BatteryId = ?
    `)
    .run(batteryId)

  const insertStmt = db.prepare(`
    INSERT INTO BatterySupplier (
      BatteryId,
      SupplierID
    )
    VALUES (?, ?)
  `)

  uniqueSupplierIds.forEach((supplierId) => {
    insertStmt.run(batteryId, supplierId)
  })
}

exports.create = (data, options = {}) => {
  const supplierId = data.supplierId || data.SupplierID
  const batteryId = data.batteryId || data.BatteryId || data.BatteryID
  const price = data.price !== undefined ? data.price : data.Price

  if (!supplierId || !batteryId || price === undefined) {
    throw new Error("supplierId, batteryId, and price are required")
  }

  if (typeof price !== "number" || price < 0) {
    throw new Error("Price must be a non-negative number")
  }

  const stmt = db.prepare(`
    INSERT INTO BatterySupplier (
      BatteryId,
      SupplierID,
      Price
    )
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(batteryId, supplierId, price)
  return result
}

exports.syncSupplierBatteries = (supplierId, batteries = []) => {
  const uniqueBatteries = []
  const seenBatteryIds = new Set()

  batteries.forEach((item) => {
    if (!item || seenBatteryIds.has(item.BatteryID)) {
      return
    }

    seenBatteryIds.add(item.BatteryID)
    uniqueBatteries.push(item)
  })

  db
    .prepare(`
      DELETE FROM BatterySupplier
      WHERE SupplierID = ?
    `)
    .run(supplierId)

  const insertStmt = db.prepare(`
    INSERT INTO BatterySupplier (
      BatteryId,
      SupplierID,
      Price
    )
    VALUES (?, ?, ?)
  `)

  uniqueBatteries.forEach((item) => {
    insertStmt.run(item.BatteryID, supplierId, item.Price)
  })
}
