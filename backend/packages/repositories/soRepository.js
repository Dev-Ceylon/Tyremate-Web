const db = require("../database/connection")

exports.getAllSOs = (category) => {
  const baseQuery = `
    SELECT
      s.SoID,
      s.Date,
      s.CreatedDateTime,
      s.IsAdminApproved,
      s.IsCompleted,
      s.IsPaymentCompleted,
      s.SalesRepID,
      COALESCE(s.Category, 'tyre') AS Category,
      COALESCE(c.Name, swc.CustomerName) AS CustomerName,
      c.CustomerCode,
      CASE
        WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
          COALESCE((SELECT SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
        ELSE
          COALESCE((SELECT SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
      END AS TotalSale,
      CASE
        WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
          COALESCE((SELECT SUM(sb.Price * sb.Qty * (COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
        ELSE
          COALESCE((SELECT SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
      END AS TotalDiscount
    FROM SO s
    LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
    LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
    LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
  `
  if (category && category !== "all") {
    return db
      .prepare(`${baseQuery} WHERE COALESCE(s.Category, 'tyre') = ? GROUP BY s.SoID ORDER BY s.SoID DESC`)
      .all(category)
  }
  return db
    .prepare(`${baseQuery} GROUP BY s.SoID ORDER BY s.SoID DESC`)
    .all()
}

exports.getSOById = (soId) => {
  return db
    .prepare(`
      SELECT
        s.SoID,
        s.Date,
        s.CreatedDateTime,
        s.IsAdminApproved,
        s.IsCompleted,
        s.IsPaymentCompleted,
        s.SalesRepID,
        COALESCE(s.Category, 'tyre') AS Category,
        COALESCE(c.Name, swc.CustomerName) AS CustomerName,
        c.CustomerCode,
        CASE
          WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
            COALESCE((SELECT SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
          ELSE
            COALESCE((SELECT SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
        END AS TotalSale,
        CASE
          WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
            COALESCE((SELECT SUM(sb.Price * sb.Qty * (COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
          ELSE
            COALESCE((SELECT SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
        END AS TotalDiscount
      FROM SO s
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      WHERE s.SoID = ?
      GROUP BY s.SoID
    `)
    .get(soId)
}

exports.getWarehouseDispatchBySoId = (soId) => {
  const so = db.prepare("SELECT Category FROM SO WHERE SoID = ?").get(soId)
  const isBattery = (so?.Category || "tyre") === "battery"

  if (isBattery) {
    return db
      .prepare(`
        SELECT
          COALESCE(bl.Id, sl.Id) AS LocationID,
          COALESCE(bl.LocationName, sl.LocationName, 'Battery Bay') AS LocationName,
          COALESCE(bl.LocationCode, sl.LocationCode, '') AS LocationCode,
          a.BatteryStorageManagerID AS StorageManagerID,
          a.BatteryStorageManagerBatchID AS StorageManagerBatchID,
          bsmb.BatchCode AS DOT,
          a.SoBatteryID AS SoTyreID,
          b.Id AS TyreID,
          b.Brand,
          b.Model AS Size,
          b.Capacity || ' ' || b.Voltage AS Pattern,
          a.Qty
        FROM SoBatteryStorageAllocation a
        INNER JOIN SoBatteries sb ON sb.ID = a.SoBatteryID
        INNER JOIN BatteryM b ON b.Id = sb.BatteryID
        LEFT JOIN BatteryStorageManager bsm ON bsm.Id = a.BatteryStorageManagerID
        LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
        LEFT JOIN StorageLocationM sl ON sl.Id = bsm.LocationID
        LEFT JOIN BatteryStorageManagerBatch bsmb ON bsmb.Id = a.BatteryStorageManagerBatchID
        WHERE sb.SoID = ?
        ORDER BY LocationName ASC, b.Brand ASC, b.Model ASC, bsmb.BatchCode ASC, a.Id ASC
      `)
      .all(soId)
  }

  return db
    .prepare(`
      SELECT
        sl.Id AS LocationID,
        sl.LocationName,
        sl.LocationCode,
        a.StorageManagerID,
        a.StorageManagerBatchID,
        smb.DOT,
        st.ID AS SoTyreID,
        t.Id AS TyreID,
        t.Brand,
        t.Size,
        t.Pattern,
        a.Qty
      FROM SoTyreStorageAllocation a
      INNER JOIN SoTyres st ON st.ID = a.SoTyreID
      INNER JOIN TyreM t ON t.Id = st.TyreID
      LEFT JOIN StorageManager sm ON sm.Id = a.StorageManagerID
      LEFT JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = a.StorageManagerBatchID
      WHERE st.SoID = ?
      ORDER BY sl.LocationName ASC, t.Brand ASC, t.Size ASC, t.Pattern ASC, smb.DOT ASC, a.Id ASC
    `)
    .all(soId)
}

exports.createSO = (so) => {
  const result = db
    .prepare(`
      INSERT INTO SO (
        Date,
        Category,
        CreatedDateTime,
        IsAdminApproved,
        IsCompleted,
        IsPaymentCompleted,
        SalesRepID
      )
      VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?, ?)
    `)
    .run(
      so.Date,
      so.Category || "tyre",
      so.IsAdminApproved,
      so.IsCompleted,
      so.IsPaymentCompleted,
      so.SalesRepID || null
    )

  return exports.getSOById(result.lastInsertRowid)
}

exports.updateSO = (soId, so) => {
  const result = db
    .prepare(`
      UPDATE SO
      SET
        Date = ?,
        Category = COALESCE(?, Category, 'tyre'),
        IsAdminApproved = ?,
        IsCompleted = ?,
        IsPaymentCompleted = ?,
        SalesRepID = COALESCE(?, SalesRepID)
      WHERE SoID = ?
    `)
    .run(
      so.Date,
      so.Category || null,
      so.IsAdminApproved,
      so.IsCompleted,
      so.IsPaymentCompleted,
      so.SalesRepID !== undefined ? so.SalesRepID : null,
      soId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getSOById(soId)
}

exports.getTodaySalesSummary = (date) => {
  return db
    .prepare(`
      SELECT
        COUNT(DISTINCT s.SoID) AS OrderCount,
        COALESCE(SUM(
          CASE
            WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
              COALESCE((SELECT SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
            ELSE
              COALESCE((SELECT SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
          END
        ), 0) AS TotalSale
      FROM SO s
      WHERE date(s.CreatedDateTime) = ?
    `)
    .get(date)
}

exports.getSalesTrendSummary = (fromDate, toDate) => {
  return db
    .prepare(`
      WITH RECURSIVE dates(d) AS (
        SELECT ?
        UNION ALL
        SELECT date(d, '+1 day') FROM dates WHERE d < ?
      )
      SELECT
        dates.d AS Date,
        COUNT(DISTINCT s.SoID) AS OrderCount,
        COALESCE(SUM(
          CASE
            WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
              COALESCE((SELECT SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
            ELSE
              COALESCE((SELECT SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
          END
        ), 0) AS TotalSale
      FROM dates
      LEFT JOIN SO s ON date(s.CreatedDateTime) = dates.d
      GROUP BY dates.d
      ORDER BY dates.d ASC
    `)
    .all(fromDate, toDate)
}

exports.deleteSO = (soId) => {
  return db
    .prepare("DELETE FROM SO WHERE SoID = ?")
    .run(soId)
}
