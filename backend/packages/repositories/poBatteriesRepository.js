const db = require("../database/connection")

exports.getAllPoBatteries = () => {
  return db
    .prepare(`
      SELECT
        pb.ID,
        pb.POID,
        pb.BatteryID,
        pb.Price,
        pb.Discount,
        pb.Qty,
        pb.IsAdminApproved,
        pb.StatusID,
        sm.StatusCode AS StatusCode
      FROM POBatteries pb
      LEFT JOIN StatusM sm ON sm.Id = pb.StatusID
      ORDER BY pb.ID DESC
    `)
    .all()
}

exports.getPoBattery = (poId, batteryId) => {
  return db
    .prepare(`
      SELECT
        pb.ID,
        pb.POID,
        pb.BatteryID,
        pb.Price,
        pb.Discount,
        pb.Qty,
        pb.IsAdminApproved,
        pb.StatusID,
        sm.StatusCode AS StatusCode
      FROM POBatteries pb
      LEFT JOIN StatusM sm ON sm.Id = pb.StatusID
      WHERE pb.POID = ? AND pb.BatteryID = ?
    `)
    .get(poId, batteryId)
}

exports.getPoBatteriesByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        pb.ID,
        pb.POID,
        pb.BatteryID,
        pb.Price,
        pb.Discount,
        pb.Qty,
        pb.IsAdminApproved,
        pb.StatusID,
        sm.StatusCode AS StatusCode,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths,
        pba.LocationId,
        COALESCE(bl.LocationCode, sl.LocationCode) AS LocationCode,
        COALESCE(bl.LocationName, sl.LocationName) AS LocationName
      FROM POBatteries pb
      INNER JOIN BatteryM b ON b.Id = pb.BatteryID
      LEFT JOIN StatusM sm ON sm.Id = pb.StatusID
      LEFT JOIN PoBatteryAllocations pba ON pba.PoBatteriesID = pb.ID
      LEFT JOIN BatteryLocationM bl ON bl.Id = pba.LocationId
      LEFT JOIN StorageLocationM sl ON sl.Id = pba.LocationId
      WHERE pb.POID = ?
      ORDER BY pb.ID DESC
    `)
    .all(poId)
}

exports.getPoBatteryById = (poBatteryId) => {
  return db
    .prepare(`
      SELECT
        pb.ID,
        pb.POID,
        pb.BatteryID,
        pb.Price,
        pb.Discount,
        pb.Qty,
        pb.IsAdminApproved,
        pb.StatusID,
        sm.StatusCode AS StatusCode,
        b.Brand,
        b.Model,
        b.Series,
        b.Voltage,
        b.Capacity,
        b.Technology,
        b.Application,
        b.WarrantyMonths
      FROM POBatteries pb
      INNER JOIN BatteryM b ON b.Id = pb.BatteryID
      LEFT JOIN StatusM sm ON sm.Id = pb.StatusID
      WHERE pb.ID = ?
    `)
    .get(poBatteryId)
}

exports.createPoBattery = (poBattery) => {
  const result = db
    .prepare(`
      INSERT INTO POBatteries (
        POID,
        BatteryID,
        Price,
        Discount,
        Qty,
        IsAdminApproved,
        StatusID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      poBattery.POID,
      poBattery.BatteryID,
      poBattery.Price,
      poBattery.Discount,
      poBattery.Qty,
      poBattery.IsAdminApproved,
      poBattery.StatusID
    )

  return exports.getPoBatteryById(result.lastInsertRowid)
}

exports.updatePoBattery = (poBatteryId, poBattery) => {
  const result = db
    .prepare(`
      UPDATE POBatteries
      SET
        POID = ?,
        BatteryID = ?,
        Price = ?,
        Discount = ?,
        Qty = ?,
        IsAdminApproved = ?,
        StatusID = ?
      WHERE ID = ?
    `)
    .run(
      poBattery.POID,
      poBattery.BatteryID,
      poBattery.Price,
      poBattery.Discount,
      poBattery.Qty,
      poBattery.IsAdminApproved,
      poBattery.StatusID,
      poBatteryId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatteryById(poBatteryId)
}

exports.updateStatus = (poBatteryId, statusId) => {
  const result = db
    .prepare(`
      UPDATE POBatteries
      SET StatusID = ?
      WHERE ID = ?
    `)
    .run(statusId, poBatteryId)

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatteryById(poBatteryId)
}

exports.deletePoBattery = (poBatteryId) => {
  return db
    .prepare("DELETE FROM POBatteries WHERE ID = ?")
    .run(poBatteryId)
}

exports.deletePoBatteriesByPoId = (poId) => {
  return db
    .prepare("DELETE FROM POBatteries WHERE POID = ?")
    .run(poId)
}

exports.updateAdminApproval = (poBatteryId, isAdminApproved) => {
  const result = db
    .prepare(`
      UPDATE POBatteries
      SET IsAdminApproved = ?
      WHERE ID = ?
    `)
    .run(isAdminApproved ? 1 : 0, poBatteryId)

  if (result.changes === 0) {
    return null
  }

  return exports.getPoBatteryById(poBatteryId)
}
