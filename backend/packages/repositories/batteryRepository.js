const db = require("../database/connection")
const batterySupplierRepo = require("./batterySupplierRepository")

// "Available to sell" stock: only Default (df) locations count.
const AVAILABLE_STOCK_SQL = `
  SELECT bsm.BatteryId, SUM(bsm.Qty) AS AvailableQuantity
  FROM BatteryStorageManager bsm
  INNER JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
  INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
  WHERE LOWER(slt.LocationTypeCode) = 'df'
  GROUP BY bsm.BatteryId
`

exports.getAllBatteries = () => {
  return db
    .prepare(`
      SELECT
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM BatteryM b
      LEFT JOIN BatterySupplier bs ON bs.BatteryId = b.Id
      LEFT JOIN SupplierM s ON s.SupplierID = bs.SupplierID
      GROUP BY
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate
      ORDER BY b.Id DESC
    `)
    .all()
    .map((battery) => ({
      ...battery,
      SupplierIDs: batterySupplierRepo.getSupplierIdsByBatteryId(battery.Id),
    }))
}

exports.getAllBatteriesWithAvailableQuantity = () => {
  return db
    .prepare(`
      SELECT
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM BatteryM b
      LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
      ) stock ON stock.BatteryId = b.Id
      LEFT JOIN BatterySupplier bs ON bs.BatteryId = b.Id
      LEFT JOIN SupplierM s ON s.SupplierID = bs.SupplierID
      GROUP BY
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate
      ORDER BY b.Id DESC
    `)
    .all()
    .map((battery) => ({
      ...battery,
      SupplierIDs: batterySupplierRepo.getSupplierIdsByBatteryId(battery.Id),
    }))
}

exports.getBatteryById = (batteryId) => {
  const battery = db
    .prepare(`
      SELECT
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM BatteryM b
      LEFT JOIN BatterySupplier bs ON bs.BatteryId = b.Id
      LEFT JOIN SupplierM s ON s.SupplierID = bs.SupplierID
      WHERE b.Id = ?
      GROUP BY
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate
    `)
    .get(batteryId)

  if (!battery) {
    return null
  }

  return {
    ...battery,
    SupplierIDs: batterySupplierRepo.getSupplierIdsByBatteryId(battery.Id),
  }
}

exports.getBatteryByIdWithAvailableQuantity = (batteryId) => {
  const battery = db
    .prepare(`
      SELECT
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM BatteryM b
      LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
      ) stock ON stock.BatteryId = b.Id
      LEFT JOIN BatterySupplier bs ON bs.BatteryId = b.Id
      LEFT JOIN SupplierM s ON s.SupplierID = bs.SupplierID
      WHERE b.Id = ?
      GROUP BY
        b.Id,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        b.BatchCode,
        b.PriceValidityFrom,
        b.PriceValidityTo,
        b.PurchasedPrice,
        b.DiscountOffered,
        b.DiscountAmount,
        b.MRP_WithoutVAT,
        b.MRP_WithVAT,
        b.ActualSellingPrice,
        b.CreatedDate
    `)
    .get(batteryId)

  if (!battery) {
    return null
  }

  return {
    ...battery,
    SupplierIDs: batterySupplierRepo.getSupplierIdsByBatteryId(battery.Id),
  }
}

exports.createBattery = (battery) => {
  const createBatteryWithSupplierLink = db.transaction((payload) => {
    const result = db
      .prepare(`
        INSERT INTO BatteryM (
          Brand,
          Model,
          Series,
          Voltage,
          Capacity,
          Technology,
          Application,
          WarrantyMonths,
          BatchCode,
          PriceValidityFrom,
          PriceValidityTo,
          PurchasedPrice,
          DiscountOffered,
          DiscountAmount,
          MRP_WithoutVAT,
          MRP_WithVAT,
          ActualSellingPrice
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        payload.Brand,
        payload.Model,
        payload.Series || null,
        payload.Voltage || "12V",
        payload.Capacity,
        payload.Technology || null,
        payload.Application || "Motorcycle",
        payload.WarrantyMonths ?? 12,
        payload.BatchCode || null,
        payload.PriceValidityFrom || null,
        payload.PriceValidityTo || null,
        payload.PurchasedPrice ?? 0,
        payload.DiscountOffered ?? 0,
        payload.DiscountAmount ?? 0,
        payload.MRP_WithoutVAT ?? 0,
        payload.MRP_WithVAT ?? 0,
        payload.ActualSellingPrice ?? 0
      )

    const batteryId = result.lastInsertRowid
    batterySupplierRepo.syncBatterySuppliers(batteryId, payload.SupplierIDs || [])

    return exports.getBatteryById(batteryId)
  })

  return createBatteryWithSupplierLink(battery)
}

exports.updateBattery = (batteryId, battery) => {
  const updateBatteryWithSupplierLink = db.transaction((id, payload) => {
    const result = db
      .prepare(`
        UPDATE BatteryM
        SET
          Brand = ?,
          Model = ?,
          Series = ?,
          Voltage = ?,
          Capacity = ?,
          Technology = ?,
          Application = ?,
          WarrantyMonths = ?,
          BatchCode = ?,
          PriceValidityFrom = ?,
          PriceValidityTo = ?,
          PurchasedPrice = ?,
          DiscountOffered = ?,
          DiscountAmount = ?,
          MRP_WithoutVAT = ?,
          MRP_WithVAT = ?,
          ActualSellingPrice = ?
        WHERE Id = ?
      `)
      .run(
        payload.Brand,
        payload.Model,
        payload.Series || null,
        payload.Voltage || "12V",
        payload.Capacity,
        payload.Technology || null,
        payload.Application || "Motorcycle",
        payload.WarrantyMonths ?? 12,
        payload.BatchCode || null,
        payload.PriceValidityFrom || null,
        payload.PriceValidityTo || null,
        payload.PurchasedPrice ?? 0,
        payload.DiscountOffered ?? 0,
        payload.DiscountAmount ?? 0,
        payload.MRP_WithoutVAT ?? 0,
        payload.MRP_WithVAT ?? 0,
        payload.ActualSellingPrice ?? 0,
        id
      )

    if (result.changes === 0) {
      return null
    }

    batterySupplierRepo.syncBatterySuppliers(id, payload.SupplierIDs || [])

    return exports.getBatteryById(id)
  })

  return updateBatteryWithSupplierLink(batteryId, battery)
}

exports.getLowStockCount = (threshold = 5) => {
  return db
    .prepare(`
      SELECT COUNT(*) AS Count
      FROM (
        SELECT b.Id, COALESCE(SUM(bsm.Qty), 0) AS AvailableQty
        FROM BatteryM b
        LEFT JOIN BatteryStorageManager bsm ON bsm.BatteryId = b.Id
        GROUP BY b.Id
      )
      WHERE AvailableQty <= ?
    `)
    .get(threshold)
}

exports.deleteBattery = (batteryId) => {
  return db
    .prepare("DELETE FROM BatteryM WHERE Id = ?")
    .run(batteryId)
}
