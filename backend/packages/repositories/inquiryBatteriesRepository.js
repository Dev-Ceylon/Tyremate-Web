const db = require("../database/connection")

// "Available to sell" stock for batteries: sums quantities in Default (df) locations,
// matching the sales-order auto-PO drain logic so inquiry NeedToOrderQty cannot disagree
// with what an SO can actually fulfil.
const AVAILABLE_BATTERY_STOCK_SQL = `
  SELECT bsm.BatteryId, SUM(bsm.Qty) AS AvailableQuantity
  FROM BatteryStorageManager bsm
  LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
  LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
  LEFT JOIN StorageLocationTypeM slt ON slt.Id = COALESCE(bl.LocationTypeId, sl.LocationTypeId)
  WHERE bsm.Qty > 0
    AND LOWER(COALESCE(slt.LocationTypeCode, 'df')) = 'df'
  GROUP BY bsm.BatteryId
`

exports.getInquiryBatteriesByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        ib.ID,
        ib.InquiryID,
        ib.BatteryID,
        ib.Price,
        ib.Discount,
        ib.Qty,
        ib.IsAdminApproved,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application,
        b.Technology,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity
      FROM InquiryBatteries ib
      INNER JOIN BatteryM b ON ib.BatteryID = b.Id
      LEFT JOIN (
        ${AVAILABLE_BATTERY_STOCK_SQL}
      ) stock ON stock.BatteryId = ib.BatteryID
      WHERE ib.InquiryID = ?
      ORDER BY ib.ID DESC
    `)
    .all(inquiryId)
}

exports.getInquiryBatteriesByInquiryIds = (inquiryIds) => {
  if (!inquiryIds.length) return []
  const placeholders = inquiryIds.map(() => "?").join(",")
  return db
    .prepare(`
      SELECT
        ib.ID,
        ib.InquiryID,
        ib.BatteryID,
        ib.Price,
        ib.Discount,
        ib.Qty,
        ib.IsAdminApproved,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application,
        b.Technology,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity
      FROM InquiryBatteries ib
      INNER JOIN BatteryM b ON ib.BatteryID = b.Id
      LEFT JOIN (
        ${AVAILABLE_BATTERY_STOCK_SQL}
      ) stock ON stock.BatteryId = ib.BatteryID
      WHERE ib.InquiryID IN (${placeholders})
      ORDER BY ib.ID DESC
    `)
    .all(...inquiryIds)
}

exports.getInquiryBatteryById = (id) => {
  return db
    .prepare(`
      SELECT
        ib.ID,
        ib.InquiryID,
        ib.BatteryID,
        ib.Price,
        ib.Discount,
        ib.Qty,
        ib.IsAdminApproved
      FROM InquiryBatteries ib
      WHERE ib.ID = ?
    `)
    .get(id)
}

exports.createInquiryBattery = (data) => {
  const result = db
    .prepare(`
      INSERT INTO InquiryBatteries (
        InquiryID,
        BatteryID,
        Price,
        Discount,
        Qty,
        IsAdminApproved
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.InquiryID,
      data.BatteryID,
      data.Price,
      data.Discount,
      data.Qty,
      data.IsAdminApproved !== undefined ? (data.IsAdminApproved ? 1 : 0) : 0
    )

  return exports.getInquiryBatteryById(result.lastInsertRowid)
}

exports.updateInquiryBattery = (id, data) => {
  const result = db
    .prepare(`
      UPDATE InquiryBatteries
      SET InquiryID = ?, BatteryID = ?, Price = ?, Discount = ?, Qty = ?, IsAdminApproved = ?
      WHERE ID = ?
    `)
    .run(
      data.InquiryID,
      data.BatteryID,
      data.Price,
      data.Discount,
      data.Qty,
      data.IsAdminApproved !== undefined ? (data.IsAdminApproved ? 1 : 0) : 0,
      id
    )

  if (result.changes === 0) return null
  return exports.getInquiryBatteryById(id)
}

exports.deleteInquiryBattery = (id) => db.prepare("DELETE FROM InquiryBatteries WHERE ID = ?").run(id)

exports.deleteInquiryBatteriesByInquiryId = (inquiryId) =>
  db.prepare("DELETE FROM InquiryBatteries WHERE InquiryID = ?").run(inquiryId)

exports.approveAllBatteriesForInquiry = (inquiryId) =>
  db.prepare("UPDATE InquiryBatteries SET IsAdminApproved = 1 WHERE InquiryID = ?").run(inquiryId)
