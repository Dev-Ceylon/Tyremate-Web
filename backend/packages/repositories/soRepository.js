const db = require("../database/connection")

exports.getAllSOs = () => {
  return db
    .prepare(`
      SELECT
        s.SoID,
        s.Date,
        s.CreatedDateTime,
        s.IsAdminApproved,
        s.IsCompleted,
        s.IsPaymentCompleted,
        COALESCE(c.Name, swc.CustomerName) AS CustomerName,
        c.CustomerCode,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalSale,
        COALESCE(SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalDiscount
      FROM SO s
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      GROUP BY s.SoID
      ORDER BY s.SoID DESC
    `)
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
        COALESCE(c.Name, swc.CustomerName) AS CustomerName,
        c.CustomerCode,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalSale,
        COALESCE(SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalDiscount
      FROM SO s
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      WHERE s.SoID = ?
      GROUP BY s.SoID
    `)
    .get(soId)
}

exports.getWarehouseDispatchBySoId = (soId) => {
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
        CreatedDateTime,
        IsAdminApproved,
        IsCompleted,
        IsPaymentCompleted
      )
      VALUES (?, datetime('now', 'localtime'), ?, ?, ?)
    `)
    .run(
      so.Date,
      so.IsAdminApproved,
      so.IsCompleted,
      so.IsPaymentCompleted
    )

  return exports.getSOById(result.lastInsertRowid)
}

exports.updateSO = (soId, so) => {
  const result = db
    .prepare(`
      UPDATE SO
      SET
        Date = ?,
        IsAdminApproved = ?,
        IsCompleted = ?,
        IsPaymentCompleted = ?
      WHERE SoID = ?
    `)
    .run(
      so.Date,
      so.IsAdminApproved,
      so.IsCompleted,
      so.IsPaymentCompleted,
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
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalSale
      FROM SO s
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
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
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS TotalSale
      FROM dates
      LEFT JOIN SO s ON date(s.CreatedDateTime) = dates.d
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
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
