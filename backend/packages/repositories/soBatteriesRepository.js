const db = require("../database/connection")

exports.getAllSoBatteries = () => {
  return db
    .prepare(`
      SELECT
        sb.ID,
        sb.SoID,
        sb.BatteryID,
        sb.Price,
        sb.Discount,
        sb.Qty,
        sb.NeedToOrderQty,
        sb.IsAdminApproved,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application,
        b.Technology
      FROM SoBatteries sb
      INNER JOIN BatteryM b ON b.Id = sb.BatteryID
      ORDER BY sb.ID DESC
    `)
    .all()
}

exports.getSoBatteriesBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        sb.ID,
        sb.SoID,
        sb.BatteryID,
        sb.Price,
        sb.Discount,
        sb.Qty,
        sb.NeedToOrderQty,
        sb.IsAdminApproved,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application,
        b.Technology,
        COALESCE(SUM(srb.Qty), 0) AS returnedQty,
        CASE 
          WHEN sb.Qty > 0 AND sb.Qty <= COALESCE(SUM(srb.Qty), 0) THEN 1 
          ELSE 0 
        END AS reTurnCompleted
      FROM SoBatteries sb
      INNER JOIN BatteryM b ON b.Id = sb.BatteryID
      LEFT JOIN SoReturnBatteries srb ON srb.SoBatteryID = sb.ID
      WHERE sb.SoID = ?
      GROUP BY
        sb.ID, sb.SoID, sb.BatteryID, sb.Price, sb.Discount, sb.Qty, sb.NeedToOrderQty, sb.IsAdminApproved,
        b.Brand, b.Model, b.Capacity, b.Voltage, b.Application, b.Technology
      ORDER BY sb.ID DESC;
    `)
    .all(soId)
}

exports.getSoBattery = (soId, batteryId) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        BatteryID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      FROM SoBatteries
      WHERE SoID = ? AND BatteryID = ?
    `)
    .get(soId, batteryId)
}

exports.getSoBatteryById = (id) => {
  return db
    .prepare(`
      SELECT
        sb.ID,
        sb.SoID,
        sb.BatteryID,
        sb.Price,
        sb.Discount,
        sb.Qty,
        sb.NeedToOrderQty,
        sb.IsAdminApproved,
        b.Brand,
        b.Model,
        b.Capacity,
        b.Voltage,
        b.Application,
        b.Technology
      FROM SoBatteries sb
      INNER JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE sb.ID = ?
    `)
    .get(id)
}

exports.createSoBattery = (soBattery) => {
  const result = db
    .prepare(`
      INSERT INTO SoBatteries (
        SoID,
        BatteryID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      soBattery.SoID,
      soBattery.BatteryID,
      soBattery.Price,
      soBattery.Discount,
      soBattery.Qty,
      soBattery.NeedToOrderQty,
      soBattery.IsAdminApproved
    )

  return exports.getSoBatteryById(result.lastInsertRowid)
}

exports.updateSoBattery = (id, soBattery) => {
  const result = db
    .prepare(`
      UPDATE SoBatteries
      SET
        BatteryID = ?,
        Price = ?,
        Discount = ?,
        Qty = ?,
        NeedToOrderQty = ?,
        IsAdminApproved = ?
      WHERE ID = ?
    `)
    .run(
      soBattery.BatteryID,
      soBattery.Price,
      soBattery.Discount,
      soBattery.Qty,
      soBattery.NeedToOrderQty,
      soBattery.IsAdminApproved,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getSoBatteryById(id)
}

exports.deleteSoBattery = (id) => {
  const result = db
    .prepare(`
      DELETE FROM SoBatteries
      WHERE ID = ?
    `)
    .run(id)

  return result.changes > 0
}
